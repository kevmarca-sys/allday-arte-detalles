package ec.edu.ucacue.allday.service;

import ec.edu.ucacue.allday.dto.Dtos.*;
import ec.edu.ucacue.allday.exception.ApiException;
import ec.edu.ucacue.allday.model.*;
import ec.edu.ucacue.allday.repository.*;
import ec.edu.ucacue.allday.security.UsuarioActual;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PedidoService {
    public static final EnumSet<EstadoPedido> ACTIVOS = EnumSet.of(EstadoPedido.RECIBIDO, EstadoPedido.EN_PREPARACION, EstadoPedido.LISTO);
    private final PedidoRepository pedidos;
    private final ClienteRepository clientes;
    private final ProductoRepository productos;

    private final VentaRepository ventas;
    public PedidoService(PedidoRepository p, ClienteRepository c, ProductoRepository pr, VentaRepository v) { pedidos = p; clientes = c; productos = pr; ventas = v; }

    @Transactional
    public PedidoResponse crear(PedidoRequest r, OrigenPedido origen) {
        String tel = r.telefono().replaceAll("\\s+", "");
        Cliente c = clientes.findFirstByTelefonoAndNombreIgnoreCase(tel, r.cliente().trim()).orElseGet(() -> {
            Cliente n = new Cliente(); n.setNombre(r.cliente().trim()); n.setTelefono(tel); n.setCreadoEn(LocalDateTime.now()); return clientes.save(n);
        });
        Pedido p = new Pedido();
        p.setCodigo("TMP-" + UUID.randomUUID());
        p.setCliente(c); p.setTipo(r.tipo().trim()); p.setDescripcion(r.descripcion().trim());
        p.setFechaEntrega(r.fechaEntrega()); p.setOrigen(origen);
        aplicarMontos(p, r);
        p.setEstado(EstadoPedido.RECIBIDO); p.setCreadoEn(LocalDateTime.now());
        if (r.items() != null) for (ItemRequest i : r.items()) {
            Producto pr = productos.findById(i.productoId()).filter(Producto::isActivo)
                    .orElseThrow(() -> ApiException.noEncontrado("Producto " + i.productoId()));
            DetallePedido d = new DetallePedido();
            d.setPedido(p); d.setProducto(pr); d.setCantidad(i.cantidad()); d.setPrecioUnitario(pr.getPrecio());
            p.getDetalles().add(d);
        }
        agregarHistorial(p, EstadoPedido.RECIBIDO);
        p = pedidos.saveAndFlush(p);
        p.setCodigo(String.format("AD-%04d", 1000 + p.getId())); // RN03: código único AD-####
        return PedidoResponse.of(p);
    }

    private static void aplicarMontos(Pedido p, PedidoRequest r) {
        BigDecimal ant = r.montoAnticipo() == null ? BigDecimal.ZERO : r.montoAnticipo();
        if (r.total() != null && ant.compareTo(r.total()) > 0) throw ApiException.invalido("El anticipo no puede ser mayor que el valor total");
        p.setTotal(r.total()); p.setMontoAnticipo(ant); p.setAnticipo(ant.signum() > 0);
        p.setResponsable(r.responsable() == null || r.responsable().isBlank() ? null : r.responsable().trim());
        p.setImagenId(r.imagenId());
    }

    /** Edita los datos del encargo (no el estado ni el código). */
    @Transactional
    public PedidoResponse actualizar(Long id, PedidoRequest r) {
        Pedido p = pedidos.findById(id).orElseThrow(() -> ApiException.noEncontrado("Pedido"));
        if (p.getEstado() == EstadoPedido.ENTREGADO || p.getEstado() == EstadoPedido.ANULADO)
            throw ApiException.conflicto("No se puede editar un pedido " + p.getEstado().name().toLowerCase());
        String tel = r.telefono().replaceAll("\\s+", "");
        Cliente c = p.getCliente();
        if (!c.getTelefono().equals(tel) || !c.getNombre().equalsIgnoreCase(r.cliente().trim())) {
            c = clientes.findFirstByTelefonoAndNombreIgnoreCase(tel, r.cliente().trim()).orElseGet(() -> {
                Cliente n = new Cliente(); n.setNombre(r.cliente().trim()); n.setTelefono(tel); n.setCreadoEn(LocalDateTime.now()); return clientes.save(n);
            });
            p.setCliente(c);
        }
        p.setTipo(r.tipo().trim()); p.setDescripcion(r.descripcion().trim()); p.setFechaEntrega(r.fechaEntrega());
        aplicarMontos(p, r);
        return PedidoResponse.of(p);
    }

    /** Registra un abono al saldo del pedido. */
    @Transactional
    public PedidoResponse pago(Long id, BigDecimal monto) {
        Pedido p = pedidos.findById(id).orElseThrow(() -> ApiException.noEncontrado("Pedido"));
        if (p.getEstado() == EstadoPedido.ANULADO) throw ApiException.conflicto("El pedido está anulado");
        BigDecimal saldo = PedidoResponse.of(p).saldo();
        if (monto.compareTo(saldo) > 0) throw ApiException.invalido("El abono supera el saldo pendiente ($" + saldo + ")");
        BigDecimal pagado = (p.getMontoAnticipo() == null ? BigDecimal.ZERO : p.getMontoAnticipo()).add(monto);
        p.setMontoAnticipo(pagado); p.setAnticipo(true);
        return PedidoResponse.of(p);
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> entregadosRecientes() {
        return pedidos.findTop20ByEstadoOrderByIdDesc(EstadoPedido.ENTREGADO).stream().map(PedidoResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> activos() {
        return pedidos.findByEstadoInOrderByFechaEntregaAscIdAsc(ACTIVOS).stream().map(PedidoResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> porEstado(EstadoPedido e) {
        return pedidos.findByEstadoInOrderByFechaEntregaAscIdAsc(EnumSet.of(e)).stream().map(PedidoResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> clientes() {
        List<ClienteResponse> l = new java.util.ArrayList<>(pedidos.resumenClientes().stream().map(r -> {
            Cliente c = (Cliente) r[0];
            return new ClienteResponse(c.getId(), c.getNombre(), c.getTelefono(), c.getCreadoEn(), (Long) r[1], (LocalDateTime) r[2],
                    c.getIdentificacion(), 0, BigDecimal.ZERO, null);
        }).toList());
        // Clientes que pidieron comprobante con cédula/RUC en caja
        for (Object[] r : ventas.resumenClientes()) {
            String id = (String) r[0];
            l.add(new ClienteResponse(null, (String) r[1], null, (LocalDateTime) r[4], 0, null, id, (Long) r[2], (BigDecimal) r[3], (LocalDateTime) r[5]));
        }
        return l;
    }

    @Transactional(readOnly = true)
    public PedidoPublico consultaPublica(String codigo) {
        return pedidos.findByCodigoIgnoreCase(codigo.trim()).map(PedidoPublico::of)
                .orElseThrow(() -> ApiException.noEncontrado("Pedido"));
    }

    /** RN04: los estados avanzan en orden; solo el administrador puede anular. */
    @Transactional
    public PedidoResponse cambiarEstado(Long id, EstadoPedido nuevo) {
        Pedido p = pedidos.findById(id).orElseThrow(() -> ApiException.noEncontrado("Pedido"));
        EstadoPedido actual = p.getEstado();
        if (nuevo == EstadoPedido.ANULADO) {
            Usuario u = UsuarioActual.get();
            if (u == null || u.getRol() != Rol.ADMIN) throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN, "Solo el administrador puede anular pedidos");
            if (actual == EstadoPedido.ENTREGADO) throw ApiException.conflicto("No se puede anular un pedido entregado");
        } else {
            EstadoPedido esperado = switch (actual) {
                case RECIBIDO -> EstadoPedido.EN_PREPARACION;
                case EN_PREPARACION -> EstadoPedido.LISTO;
                case LISTO -> EstadoPedido.ENTREGADO;
                default -> null;
            };
            if (nuevo != esperado) throw ApiException.conflicto("No se puede pasar de " + actual + " a " + nuevo);
        }
        p.setEstado(nuevo);
        agregarHistorial(p, nuevo);
        return PedidoResponse.of(p);
    }

    private void agregarHistorial(Pedido p, EstadoPedido e) {
        HistorialEstado h = new HistorialEstado();
        h.setPedido(p); h.setEstado(e); h.setFecha(LocalDateTime.now()); h.setUsuario(UsuarioActual.get());
        p.getHistorial().add(h);
    }
}
