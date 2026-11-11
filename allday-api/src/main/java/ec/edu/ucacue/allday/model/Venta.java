package ec.edu.ucacue.allday.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "ventas")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal descuento;

    @Enumerated(EnumType.STRING) @Column(name = "forma_pago", length = 20)
    private FormaPago formaPago;

    @Column(name = "monto_recibido", precision = 10, scale = 2)
    private BigDecimal montoRecibido;

    @Column(precision = 10, scale = 2)
    private BigDecimal cambio;

    @Column(precision = 10, scale = 2)
    private BigDecimal iva;

    @Column(name = "cliente_nombre", length = 120)
    private String clienteNombre;

    @Column(name = "cliente_identificacion", length = 13)
    private String clienteIdentificacion;

    @Column(name = "cliente_email", length = 120)
    private String clienteEmail;

    @Column(length = 250)
    private String observacion;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean anulada;

    @Column(name = "motivo_anulacion", length = 200)
    private String motivoAnulacion;

    @Column(name = "anulada_en")
    private LocalDateTime anuladaEn;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "anulada_por")
    private Usuario anuladaPor;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<DetalleVenta> detalles = new java.util.ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getDescuento() { return descuento; }
    public void setDescuento(BigDecimal descuento) { this.descuento = descuento; }
    public FormaPago getFormaPago() { return formaPago; }
    public void setFormaPago(FormaPago formaPago) { this.formaPago = formaPago; }
    public BigDecimal getMontoRecibido() { return montoRecibido; }
    public void setMontoRecibido(BigDecimal montoRecibido) { this.montoRecibido = montoRecibido; }
    public BigDecimal getCambio() { return cambio; }
    public void setCambio(BigDecimal cambio) { this.cambio = cambio; }
    public BigDecimal getIva() { return iva; }
    public void setIva(BigDecimal iva) { this.iva = iva; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
    public String getClienteIdentificacion() { return clienteIdentificacion; }
    public void setClienteIdentificacion(String clienteIdentificacion) { this.clienteIdentificacion = clienteIdentificacion; }
    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }
    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
    public boolean isAnulada() { return anulada; }
    public void setAnulada(boolean anulada) { this.anulada = anulada; }
    public String getMotivoAnulacion() { return motivoAnulacion; }
    public void setMotivoAnulacion(String motivoAnulacion) { this.motivoAnulacion = motivoAnulacion; }
    public LocalDateTime getAnuladaEn() { return anuladaEn; }
    public void setAnuladaEn(LocalDateTime anuladaEn) { this.anuladaEn = anuladaEn; }
    public Usuario getAnuladaPor() { return anuladaPor; }
    public void setAnuladaPor(Usuario anuladaPor) { this.anuladaPor = anuladaPor; }
    public java.util.List<DetalleVenta> getDetalles() { return detalles; }
    public void setDetalles(java.util.List<DetalleVenta> detalles) { this.detalles = detalles; }
}
