package ec.edu.ucacue.allday.service;

import ec.edu.ucacue.allday.dto.Dtos.*;
import ec.edu.ucacue.allday.exception.ApiException;
import ec.edu.ucacue.allday.model.*;
import ec.edu.ucacue.allday.repository.*;
import ec.edu.ucacue.allday.security.UsuarioActual;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogoService {
    private final CategoriaRepository categorias;
    private final ProductoRepository productos;
    private final MovimientoInventarioRepository movimientos;

    public CatalogoService(CategoriaRepository c, ProductoRepository p, MovimientoInventarioRepository m) {
        this.categorias = c; this.productos = p; this.movimientos = m;
    }

    public List<CategoriaResponse> categorias() {
        return categorias.findAll(Sort.by("id")).stream().map(CategoriaResponse::of).toList();
    }

    @Transactional
    public CategoriaResponse crearCategoria(CategoriaRequest r) {
        if (categorias.existsByNombreIgnoreCase(r.nombre().trim())) throw ApiException.conflicto("La categoría ya existe");
        Categoria c = new Categoria(); c.setNombre(r.nombre().trim()); c.setIcono(r.icono()); c.setImagenId(r.imagenId());
        return CategoriaResponse.of(categorias.save(c));
    }

    @Transactional
    public CategoriaResponse actualizarCategoria(Long id, CategoriaRequest r) {
        Categoria c = categorias.findById(id).orElseThrow(() -> ApiException.noEncontrado("Categoría"));
        categorias.findAll().stream().filter(o -> !o.getId().equals(id) && o.getNombre().equalsIgnoreCase(r.nombre().trim()))
                .findAny().ifPresent(o -> { throw ApiException.conflicto("Ya existe otra categoría con ese nombre"); });
        c.setNombre(r.nombre().trim()); c.setIcono(r.icono()); c.setImagenId(r.imagenId());
        return CategoriaResponse.of(c);
    }

    @Transactional
    public void eliminarCategoria(Long id) {
        Categoria c = categorias.findById(id).orElseThrow(() -> ApiException.noEncontrado("Categoría"));
        if (!productos.buscar("", id, false, false).isEmpty())
            throw ApiException.conflicto("No se puede eliminar: la categoría tiene productos. Muévalos o desactívelos primero.");
        categorias.delete(c);
    }

    public List<Producto> buscar(String q, Long categoriaId, boolean soloActivos, boolean destacados) {
        return productos.buscar(q == null ? "" : q.trim(), categoriaId, soloActivos, destacados);
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest r) {
        Producto p = new Producto();
        aplicar(p, r);
        p.setActivo(r.activo() == null || r.activo());
        p = productos.save(p);
        if (p.getCodigo() == null) p.setCodigo(generarCodigo(p));
        if (!p.isEsServicio() && p.getStock() > 0) registrar(p, TipoMovimiento.ENTRADA, p.getStock(), "Stock inicial");
        return ProductoResponse.of(p);
    }

    @Transactional
    public ProductoResponse actualizar(Long id, ProductoRequest r) {
        Producto p = productos.bloquear(id).orElseThrow(() -> ApiException.noEncontrado("Producto"));
        int antes = p.getStock();
        aplicar(p, r);
        if (r.activo() != null) p.setActivo(r.activo());
        if (p.getCodigo() == null) p.setCodigo(generarCodigo(p));
        int dif = p.getStock() - antes;
        if (dif != 0 && !p.isEsServicio()) registrar(p, TipoMovimiento.AJUSTE, dif, "Ajuste desde edición de producto");
        return ProductoResponse.of(p);
    }

    private void aplicar(Producto p, ProductoRequest r) {
        Categoria c = categorias.findById(r.categoriaId()).orElseThrow(() -> ApiException.noEncontrado("Categoría"));
        p.setNombre(r.nombre().trim()); p.setCategoria(c); p.setPrecio(r.precio());
        p.setEsServicio(r.esServicio()); p.setDestacado(r.destacado()); p.setImagenId(r.imagenId());
        p.setStock(r.esServicio() ? 0 : r.stock()); p.setStockMinimo(r.esServicio() ? 0 : r.stockMinimo());
        String cod = r.codigo() == null || r.codigo().isBlank() ? null : r.codigo().trim().toUpperCase();
        if (cod != null) productos.findFirstByCodigoIgnoreCase(cod).filter(o -> !o.getId().equals(p.getId()))
                .ifPresent(o -> { throw ApiException.conflicto("El código " + cod + " ya está asignado a " + o.getNombre()); });
        p.setCodigo(cod);
        if (r.costo() != null && r.costo().compareTo(r.precio()) > 0) throw ApiException.invalido("El costo no puede ser mayor que el precio de venta");
        p.setCosto(r.costo());
        p.setDescripcion(r.descripcion() == null || r.descripcion().isBlank() ? null : r.descripcion().trim());
        int iva = r.iva() == null ? 15 : r.iva();
        if (iva != 0 && iva != 5 && iva != 15) throw ApiException.invalido("Tarifa de IVA no válida (0 %, 5 % o 15 %)");
        p.setIva(iva);
        p.setGaleria(r.galeria() == null || r.galeria().isEmpty() ? null
                : String.join(",", r.galeria().stream().filter(java.util.Objects::nonNull).map(String::valueOf).toList()));
    }

    /** Código corto para buscar en caja o con lector de barras: AD-UTI-007 */
    private static String generarCodigo(Producto p) {
        String n = java.text.Normalizer.normalize(p.getCategoria().getNombre(), java.text.Normalizer.Form.NFD)
                .replaceAll("[^A-Za-z]", "").toUpperCase();
        return "AD-" + (n + "XXX").substring(0, 3) + "-" + String.format("%03d", p.getId());
    }

    public ProductoPublico publico(Long id) {
        return productos.findById(id).filter(Producto::isActivo).map(ProductoPublico::of)
                .orElseThrow(() -> ApiException.noEncontrado("Producto"));
    }

    void registrar(Producto p, TipoMovimiento t, int cantidad, String motivo) {
        MovimientoInventario m = new MovimientoInventario();
        m.setProducto(p); m.setTipo(t); m.setCantidad(cantidad); m.setMotivo(motivo);
        m.setFecha(LocalDateTime.now()); m.setUsuario(UsuarioActual.get());
        movimientos.save(m);
    }

    @Transactional
    public ProductoResponse movimiento(MovimientoRequest r) {
        Producto p = productos.bloquear(r.productoId()).orElseThrow(() -> ApiException.noEncontrado("Producto"));
        if (p.isEsServicio()) throw ApiException.invalido("Los servicios no manejan inventario");
        int delta = switch (r.tipo()) {
            case ENTRADA -> Math.abs(r.cantidad());
            case SALIDA -> -Math.abs(r.cantidad());
            case AJUSTE -> r.cantidad();
        };
        if (delta == 0) throw ApiException.invalido("La cantidad no puede ser cero");
        if (p.getStock() + delta < 0) throw ApiException.conflicto("El stock no puede quedar negativo (actual: " + p.getStock() + ")");
        p.setStock(p.getStock() + delta);
        registrar(p, r.tipo(), delta, r.motivo().trim());
        return ProductoResponse.of(p);
    }

    public List<MovimientoResponse> ultimosMovimientos() {
        return movimientos.findTop50ByOrderByFechaDesc().stream().map(MovimientoResponse::of).toList();
    }

    public List<ProductoResponse> alertas() { return productos.bajoMinimo().stream().map(ProductoResponse::of).toList(); }
}
