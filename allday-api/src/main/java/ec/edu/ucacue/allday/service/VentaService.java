package ec.edu.ucacue.allday.service;

import ec.edu.ucacue.allday.dto.Dtos.*;
import ec.edu.ucacue.allday.exception.ApiException;
import ec.edu.ucacue.allday.model.*;
import ec.edu.ucacue.allday.repository.*;
import ec.edu.ucacue.allday.security.UsuarioActual;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VentaService {
    private final VentaRepository ventas;
    private final ProductoRepository productos;
    private final CatalogoService catalogo;

    public VentaService(VentaRepository v, ProductoRepository p, CatalogoService c) { ventas = v; productos = p; catalogo = c; }

    /** Cédula ecuatoriana: 10 dígitos, provincia 01-24 o 30, dígito verificador por módulo 10. */
    static boolean cedulaValida(String c) {
        if (c == null || !c.matches("\\d{10}")) return false;
        int prov = Integer.parseInt(c.substring(0, 2));
        if (!((prov >= 1 && prov <= 24) || prov == 30) || c.charAt(2) > '5') return false;
        int suma = 0;
        for (int i = 0; i < 9; i++) {
            int d = (c.charAt(i) - '0') * (i % 2 == 0 ? 2 : 1);
            suma += d > 9 ? d - 9 : d;
        }
        return (10 - suma % 10) % 10 == c.charAt(9) - '0';
    }

    /** Acepta consumidor final, cédula válida o RUC de 13 dígitos (persona natural con cédula válida + 001, o sociedad/pública). */
    static void validarIdentificacion(String id) {
        if (id == null || id.isBlank() || id.equals("9999999999999")) return;
        if (id.length() == 10 && !cedulaValida(id)) throw ApiException.invalido("La cédula del cliente no es válida");
        if (id.length() == 13) {
            boolean natural = id.charAt(2) < '6' && cedulaValida(id.substring(0, 10));
            boolean sociedad = id.charAt(2) == '9' || id.charAt(2) == '6';
            if (!(natural || sociedad) || id.endsWith("000")) throw ApiException.invalido("El RUC del cliente no es válido");
        }
    }

    /** Registra la venta en una sola transacción: si algo falla, no se guarda nada (RNF08). */
    @Transactional
    public VentaResponse registrar(VentaRequest r) {
        validarIdentificacion(r.clienteIdentificacion());
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        r.items().forEach(i -> cantidades.merge(i.productoId(), i.cantidad(), Integer::sum));
        Venta v = new Venta();
        v.setUsuario(UsuarioActual.get()); v.setFecha(LocalDateTime.now());
        BigDecimal subtotal = BigDecimal.ZERO;
        List<String> alertas = new ArrayList<>();
        // Se bloquean las filas en orden de id para evitar interbloqueos entre ventas simultáneas.
        for (Long id : new TreeSet<>(cantidades.keySet())) {
            int cant = cantidades.get(id);
            Producto p = productos.bloquear(id).orElseThrow(() -> ApiException.noEncontrado("Producto " + id));
            if (!p.isActivo()) throw ApiException.conflicto(p.getNombre() + " no está disponible");
            if (!p.isEsServicio()) {
                if (cant > p.getStock()) throw ApiException.conflicto("Stock insuficiente de " + p.getNombre() + " (disponible: " + p.getStock() + ")");
                p.setStock(p.getStock() - cant);
                catalogo.registrar(p, TipoMovimiento.SALIDA, -cant, "Venta");
                if (p.getStock() <= p.getStockMinimo()) alertas.add(p.getNombre() + " (quedan " + p.getStock() + ")");
            }
            DetalleVenta d = new DetalleVenta();
            d.setVenta(v); d.setProducto(p); d.setCantidad(cant); d.setPrecioUnitario(p.getPrecio());
            d.setSubtotal(p.getPrecio().multiply(BigDecimal.valueOf(cant)));
            v.getDetalles().add(d);
            subtotal = subtotal.add(d.getSubtotal());
        }
        BigDecimal desc = r.descuento() == null ? BigDecimal.ZERO : r.descuento().setScale(2, RoundingMode.HALF_UP);
        if (desc.compareTo(subtotal) > 0) throw ApiException.invalido("El descuento no puede ser mayor que el subtotal");
        BigDecimal total = subtotal.subtract(desc);
        FormaPago fp = r.formaPago() == null ? FormaPago.EFECTIVO : r.formaPago();
        v.setSubtotal(subtotal); v.setDescuento(desc); v.setTotal(total); v.setFormaPago(fp);
        // Los precios incluyen IVA: se desglosa por línea según la tarifa de cada producto, con el descuento prorrateado.
        BigDecimal iva = BigDecimal.ZERO;
        if (subtotal.signum() > 0) for (DetalleVenta d : v.getDetalles()) {
            int t = d.getProducto().getIva() == null ? 15 : d.getProducto().getIva();
            if (t == 0) continue;
            BigDecimal neto = d.getSubtotal().multiply(total).divide(subtotal, 6, RoundingMode.HALF_UP);
            BigDecimal base = neto.divide(BigDecimal.ONE.add(BigDecimal.valueOf(t).movePointLeft(2)), 6, RoundingMode.HALF_UP);
            iva = iva.add(neto.subtract(base));
        }
        v.setIva(iva.setScale(2, RoundingMode.HALF_UP));
        if (fp == FormaPago.EFECTIVO && r.montoRecibido() != null) {
            if (r.montoRecibido().compareTo(total) < 0) throw ApiException.invalido("El efectivo recibido es menor que el total");
            v.setMontoRecibido(r.montoRecibido()); v.setCambio(r.montoRecibido().subtract(total));
        }
        v.setClienteNombre(r.clienteNombre() == null ? null : r.clienteNombre().trim());
        v.setClienteIdentificacion(r.clienteIdentificacion()); v.setClienteEmail(r.clienteEmail());
        v.setObservacion(r.observacion()); v.setAnulada(false);
        return VentaResponse.of(ventas.save(v), alertas);
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> delDia(LocalDate dia) { return entre(dia == null ? LocalDate.now() : dia, dia == null ? LocalDate.now() : dia); }

    @Transactional(readOnly = true)
    public List<VentaResponse> entre(LocalDate desde, LocalDate hasta) {
        if (hasta.isBefore(desde)) throw ApiException.invalido("La fecha final no puede ser anterior a la inicial");
        return ventas.findByFechaBetweenOrderByFechaDesc(desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay()).stream()
                .map(v -> VentaResponse.of(v, List.of())).toList();
    }

    @Transactional(readOnly = true)
    public VentaResponse obtener(Long id) {
        return ventas.findById(id).map(v -> VentaResponse.of(v, List.of())).orElseThrow(() -> ApiException.noEncontrado("Venta"));
    }

    /** Anula una venta (solo administrador): devuelve el stock y deja constancia de quién, cuándo y por qué. */
    @Transactional
    public VentaResponse anular(Long id, String motivo) {
        Usuario u = UsuarioActual.get();
        if (u == null || u.getRol() != Rol.ADMIN) throw new ApiException(HttpStatus.FORBIDDEN, "Solo el administrador puede anular ventas");
        Venta v = ventas.findById(id).orElseThrow(() -> ApiException.noEncontrado("Venta"));
        if (v.isAnulada()) throw ApiException.conflicto("La venta ya está anulada");
        for (DetalleVenta d : v.getDetalles()) {
            Producto p = productos.bloquear(d.getProducto().getId()).orElseThrow();
            if (!p.isEsServicio()) {
                p.setStock(p.getStock() + d.getCantidad());
                catalogo.registrar(p, TipoMovimiento.ENTRADA, d.getCantidad(), "Anulación de venta " + VentaResponse.numero(v.getId()));
            }
        }
        v.setAnulada(true); v.setMotivoAnulacion(motivo.trim()); v.setAnuladaEn(LocalDateTime.now()); v.setAnuladaPor(u);
        return VentaResponse.of(v, List.of());
    }
}
