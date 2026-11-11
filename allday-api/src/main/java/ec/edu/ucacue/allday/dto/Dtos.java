package ec.edu.ucacue.allday.dto;

import ec.edu.ucacue.allday.model.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Objetos de transferencia de datos (peticiones y respuestas de la API). */
public final class Dtos {
    private Dtos() {}

    // ---------- Autenticación y usuarios ----------
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record LoginResponse(String token, Long id, String nombre, String email, Rol rol) {}
    public record UsuarioRequest(
            @NotBlank @Size(max = 100) String nombre,
            @NotBlank @Email @Size(max = 120) String email,
            @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres") String password,
            @NotNull Rol rol, Boolean activo) {}
    public record UsuarioResponse(Long id, String nombre, String email, Rol rol, boolean activo) {
        public static UsuarioResponse of(Usuario u) {
            return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol(), u.isActivo());
        }
    }

    // ---------- Catálogo ----------
    public record CategoriaRequest(@NotBlank @Size(max = 60) String nombre, @Size(max = 30) String icono, Long imagenId) {}
    public record CategoriaResponse(Long id, String nombre, String icono, Long imagenId) {
        public static CategoriaResponse of(Categoria c) { return new CategoriaResponse(c.getId(), c.getNombre(), c.getIcono(), c.getImagenId()); }
    }
    public record ProductoRequest(
            @NotBlank @Size(max = 150) String nombre,
            @NotNull Long categoriaId,
            @NotNull @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0") @Digits(integer = 8, fraction = 2) BigDecimal precio,
            @NotNull @PositiveOrZero Integer stock,
            @NotNull @PositiveOrZero Integer stockMinimo,
            boolean esServicio, boolean destacado, Boolean activo, Long imagenId,
            @Size(max = 40) @Pattern(regexp = "^$|^[A-Za-z0-9-]+$", message = "Código: solo letras, números y guiones") String codigo,
            @DecimalMin(value = "0.00", message = "El costo no puede ser negativo") @Digits(integer = 8, fraction = 2) BigDecimal costo,
            @Size(max = 2000) String descripcion,
            Integer iva,
            @Size(max = 4, message = "Máximo 4 fotos adicionales") List<Long> galeria) {}
    static List<Long> galeria(Producto p) {
        if (p.getGaleria() == null || p.getGaleria().isBlank()) return List.of();
        return java.util.Arrays.stream(p.getGaleria().split(",")).filter(x -> !x.isBlank()).map(Long::valueOf).toList();
    }
    static int iva(Producto p) { return p.getIva() == null ? 15 : p.getIva(); }
    public record ProductoResponse(Long id, String nombre, Long categoriaId, String categoria, String icono,
                                   BigDecimal precio, int stock, int stockMinimo, boolean esServicio,
                                   boolean destacado, boolean activo, boolean bajoMinimo, Long imagenId,
                                   String codigo, BigDecimal costo, String descripcion, int iva, List<Long> galeria) {
        public static ProductoResponse of(Producto p) {
            return new ProductoResponse(p.getId(), p.getNombre(), p.getCategoria().getId(), p.getCategoria().getNombre(),
                    p.getCategoria().getIcono(), p.getPrecio(), p.getStock(), p.getStockMinimo(), p.isEsServicio(),
                    p.isDestacado(), p.isActivo(), !p.isEsServicio() && p.getStock() <= p.getStockMinimo(), p.getImagenId(),
                    p.getCodigo(), p.getCosto(), p.getDescripcion(), Dtos.iva(p), Dtos.galeria(p));
        }
    }
    /** Versión pública: no expone el stock exacto ni el mínimo. */
    public record ProductoPublico(Long id, String nombre, Long categoriaId, String categoria, String icono,
                                  BigDecimal precio, boolean esServicio, boolean destacado, String disponibilidad, Long imagenId,
                                  String codigo, String descripcion, List<Long> galeria) {
        public static ProductoPublico of(Producto p) {
            String d = p.isEsServicio() ? "SERVICIO" : p.getStock() <= 0 ? "AGOTADO" : p.getStock() <= p.getStockMinimo() ? "ULTIMAS" : "DISPONIBLE";
            return new ProductoPublico(p.getId(), p.getNombre(), p.getCategoria().getId(), p.getCategoria().getNombre(),
                    p.getCategoria().getIcono(), p.getPrecio(), p.isEsServicio(), p.isDestacado(), d, p.getImagenId(),
                    p.getCodigo(), p.getDescripcion(), Dtos.galeria(p));
        }
    }

    // ---------- Inventario ----------
    public record MovimientoRequest(@NotNull Long productoId, @NotNull TipoMovimiento tipo,
                                    @NotNull Integer cantidad, @NotBlank @Size(max = 150) String motivo) {}
    public record MovimientoResponse(Long id, String producto, TipoMovimiento tipo, int cantidad, String motivo,
                                     LocalDateTime fecha, String usuario, Long productoId, String codigo, Long imagenId) {
        public static MovimientoResponse of(MovimientoInventario m) {
            return new MovimientoResponse(m.getId(), m.getProducto().getNombre(), m.getTipo(), m.getCantidad(), m.getMotivo(),
                    m.getFecha(), m.getUsuario() == null ? "Sistema" : m.getUsuario().getNombre(),
                    m.getProducto().getId(), m.getProducto().getCodigo(), m.getProducto().getImagenId());
        }
    }

    // ---------- Ventas ----------
    public record ItemRequest(@NotNull Long productoId, @NotNull @Min(1) @Max(10000) Integer cantidad) {}
    public record VentaRequest(
            @NotEmpty(message = "La venta debe tener al menos un producto") List<@Valid ItemRequest> items,
            @DecimalMin(value = "0.00", message = "El descuento no puede ser negativo") @Digits(integer = 8, fraction = 2) BigDecimal descuento,
            FormaPago formaPago,
            @DecimalMin(value = "0.00") @Digits(integer = 8, fraction = 2) BigDecimal montoRecibido,
            @Size(max = 120) String clienteNombre,
            @Pattern(regexp = "^$|^[0-9]{10}$|^[0-9]{13}$", message = "Cédula (10 dígitos) o RUC (13 dígitos)") String clienteIdentificacion,
            @Email(message = "Correo no válido") @Size(max = 120) String clienteEmail,
            @Size(max = 250) String observacion) {}
    public record AnularRequest(@NotBlank(message = "Indique el motivo") @Size(max = 200) String motivo) {}
    public record DetalleVentaResponse(Long productoId, String producto, String codigo, int cantidad, BigDecimal precioUnitario, BigDecimal subtotal) {}
    public record VentaResponse(Long id, String numero, LocalDateTime fecha, BigDecimal subtotal, BigDecimal descuento, BigDecimal total,
                                FormaPago formaPago, BigDecimal montoRecibido, BigDecimal cambio, String clienteNombre,
                                String clienteIdentificacion, String clienteEmail, String observacion, String usuario,
                                boolean anulada, String motivoAnulacion, LocalDateTime anuladaEn, String anuladaPor,
                                List<DetalleVentaResponse> detalles, List<String> alertas, BigDecimal iva) {
        public static String numero(Long id) { return String.format("001-001-%09d", id); }
        public static VentaResponse of(Venta v, List<String> alertas) {
            BigDecimal sub = v.getSubtotal() != null ? v.getSubtotal() : v.getTotal();
            return new VentaResponse(v.getId(), numero(v.getId()), v.getFecha(), sub, v.getDescuento() == null ? BigDecimal.ZERO : v.getDescuento(),
                    v.getTotal(), v.getFormaPago() == null ? FormaPago.EFECTIVO : v.getFormaPago(), v.getMontoRecibido(), v.getCambio(),
                    v.getClienteNombre() == null || v.getClienteNombre().isBlank() ? "Consumidor final" : v.getClienteNombre(),
                    v.getClienteIdentificacion() == null || v.getClienteIdentificacion().isBlank() ? "9999999999999" : v.getClienteIdentificacion(),
                    v.getClienteEmail(), v.getObservacion(), v.getUsuario().getNombre(), v.isAnulada(), v.getMotivoAnulacion(), v.getAnuladaEn(),
                    v.getAnuladaPor() == null ? null : v.getAnuladaPor().getNombre(),
                    v.getDetalles().stream().map(d -> new DetalleVentaResponse(d.getProducto().getId(), d.getProducto().getNombre(),
                            d.getProducto().getCodigo(), d.getCantidad(), d.getPrecioUnitario(), d.getSubtotal())).toList(), alertas,
                    v.getIva() == null ? BigDecimal.ZERO : v.getIva());
        }
    }

    // ---------- Pedidos ----------
    public record PedidoRequest(
            @NotBlank @Size(max = 100) String cliente,
            @NotBlank @Pattern(regexp = "^[0-9 +]{7,20}$", message = "Teléfono no válido") String telefono,
            @NotBlank @Size(max = 60) String tipo,
            @NotBlank @Size(max = 1000) String descripcion,
            @NotNull @FutureOrPresent(message = "La fecha de entrega no puede ser anterior a hoy") LocalDate fechaEntrega,
            @DecimalMin(value = "0.00", message = "El valor no puede ser negativo") @Digits(integer = 8, fraction = 2) BigDecimal total,
            @DecimalMin(value = "0.00", message = "El anticipo no puede ser negativo") @Digits(integer = 8, fraction = 2) BigDecimal montoAnticipo,
            @Size(max = 100) String responsable,
            Long imagenId,
            List<@Valid ItemRequest> items,
            Boolean aceptaPrivacidad) {}
    public record PagoRequest(@NotNull @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0") @Digits(integer = 8, fraction = 2) BigDecimal monto) {}
    public record HistorialResponse(EstadoPedido estado, LocalDateTime fecha, String usuario) {}
    public record PedidoResponse(Long id, String codigo, String cliente, String telefono, String tipo, String descripcion,
                                 LocalDate fechaEntrega, EstadoPedido estado, boolean anticipo, OrigenPedido origen,
                                 LocalDateTime creadoEn, BigDecimal totalProductos, List<HistorialResponse> historial,
                                 BigDecimal total, BigDecimal montoAnticipo, BigDecimal saldo, String responsable, Long imagenId) {
        static BigDecimal total(Pedido p) {
            if (p.getTotal() != null) return p.getTotal();
            return p.getDetalles().stream().map(d -> d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        static BigDecimal pagado(Pedido p) { return p.getMontoAnticipo() == null ? BigDecimal.ZERO : p.getMontoAnticipo(); }
        static BigDecimal saldo(Pedido p) { return total(p).subtract(pagado(p)).max(BigDecimal.ZERO); }
        public static PedidoResponse of(Pedido p) {
            BigDecimal tot = total(p);
            return new PedidoResponse(p.getId(), p.getCodigo(), p.getCliente().getNombre(), p.getCliente().getTelefono(),
                    p.getTipo(), p.getDescripcion(), p.getFechaEntrega(), p.getEstado(), p.isAnticipo(), p.getOrigen(),
                    p.getCreadoEn(), tot, p.getHistorial().stream().map(h -> new HistorialResponse(h.getEstado(), h.getFecha(),
                    h.getUsuario() == null ? "Cliente (web)" : h.getUsuario().getNombre())).toList(),
                    tot, pagado(p), saldo(p), p.getResponsable(), p.getImagenId());
        }
    }
    /** Consulta pública por código: sin teléfono ni datos personales (RN07). */
    public record PedidoPublico(String codigo, String tipo, LocalDate fechaEntrega, EstadoPedido estado, List<HistorialResponse> historial,
                                String cliente, String descripcion, LocalDateTime creadoEn, BigDecimal total, BigDecimal saldo, Long imagenId) {
        /** Solo el primer nombre y la inicial del apellido: "Camila V." */
        static String enmascarar(String n) {
            String[] w = n.trim().split("\\s+");
            return w.length == 1 ? w[0] : w[0] + " " + w[1].charAt(0) + ".";
        }
        public static PedidoPublico of(Pedido p) {
            return new PedidoPublico(p.getCodigo(), p.getTipo(), p.getFechaEntrega(), p.getEstado(),
                    p.getHistorial().stream().map(h -> new HistorialResponse(h.getEstado(), h.getFecha(), null)).toList(),
                    enmascarar(p.getCliente().getNombre()), p.getDescripcion(), p.getCreadoEn(),
                    PedidoResponse.total(p), PedidoResponse.saldo(p), p.getImagenId());
        }
    }
    public record EstadoRequest(@NotNull EstadoPedido estado) {}

    // ---------- Reportes ----------
    public record DiaVenta(LocalDate fecha, BigDecimal total) {}
    public record TopProducto(Long id, String nombre, String icono, Long imagenId, long cantidad, BigDecimal total, String codigo, String categoria) {}
    public record CategoriaVenta(String categoria, long cantidad, BigDecimal total) {}
    public record Resumen(BigDecimal totalHoy, long ventasHoy, long pedidosPendientes, long entregasHoy, long listos,
                          long porAgotarse, List<DiaVenta> semana, List<VentaResponse> ultimasVentas,
                          List<PedidoResponse> paraHoy, List<ProductoResponse> alertas,
                          BigDecimal ventasMes, Double variacionVentas, long pedidosMes, Double variacionPedidos,
                          long clientes, long clientesNuevosMes, List<TopProducto> masVendidos, List<PedidoResponse> pedidosRecientes) {}
    public record ReporteVentas(LocalDate desde, LocalDate hasta, BigDecimal total, long numeroVentas, BigDecimal ticketPromedio,
                                long pedidos, List<DiaVenta> porDia, List<TopProducto> topProductos, List<CategoriaVenta> porCategoria,
                                BigDecimal totalAnterior, long numeroAnterior, Double margen, long pedidosListos, long pedidosEnCurso) {}

    // ---------- Clientes y configuración ----------
    public record ClienteResponse(Long id, String nombre, String telefono, LocalDateTime creadoEn, long pedidos, LocalDateTime ultimoPedido,
                                  String identificacion, long compras, BigDecimal totalCompras, LocalDateTime ultimaCompra) {}
    public record ConfiguracionDto(
            @NotBlank @Size(max = 100) String nombre, @Size(max = 200) String direccion, @Size(max = 120) String horario,
            @Pattern(regexp = "^$|^[0-9]{10,15}$", message = "WhatsApp: solo números en formato internacional, ej. 5939XXXXXXXX") String whatsapp,
            @Pattern(regexp = "^$|^https://.*", message = "Las redes deben ser enlaces https://") @Size(max = 200) String facebook,
            @Pattern(regexp = "^$|^https://.*", message = "Las redes deben ser enlaces https://") @Size(max = 200) String instagram,
            @Pattern(regexp = "^$|^https://.*", message = "Las redes deben ser enlaces https://") @Size(max = 200) String tiktok,
            @Pattern(regexp = "^$|^[0-9]{13}$", message = "El RUC debe tener 13 dígitos") String ruc,
            @Size(max = 20) String telefono, @Size(max = 200) String pieComprobante,
            @Min(0) @Max(30) Integer ivaPorcentaje, Boolean qrWhatsapp) {
        public static ConfiguracionDto of(ConfiguracionNegocio c) {
            return new ConfiguracionDto(c.getNombre(), c.getDireccion(), c.getHorario(), c.getWhatsapp(), c.getFacebook(), c.getInstagram(), c.getTiktok(),
                    c.getRuc(), c.getTelefono(), c.getPieComprobante(), c.getIvaPorcentaje() == null ? 15 : c.getIvaPorcentaje(),
                    c.getQrWhatsapp() == null || c.getQrWhatsapp());
        }
    }
    public record ImagenResponse(Long id, String url) {}

    public record ErrorResponse(int status, String mensaje, java.util.Map<String, String> campos, LocalDateTime fecha) {}
}
