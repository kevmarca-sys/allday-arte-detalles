package ec.edu.ucacue.allday.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String codigo;

    @ManyToOne(fetch = FetchType.EAGER, optional = false) @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Column(nullable = false, length = 60)
    private String tipo;

    @Column(nullable = false, columnDefinition = "text")
    private String descripcion;

    @Column(name = "fecha_entrega", nullable = false)
    private LocalDate fechaEntrega;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private EstadoPedido estado;

    @Column(nullable = false)
    private boolean anticipo;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10)
    private OrigenPedido origen;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "monto_anticipo", precision = 10, scale = 2)
    private BigDecimal montoAnticipo;

    @Column(length = 100)
    private String responsable;

    @Column(name = "imagen_id")
    private Long imagenId;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<DetallePedido> detalles = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("fecha ASC")
    private java.util.List<HistorialEstado> historial = new java.util.ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public LocalDate getFechaEntrega() { return fechaEntrega; }
    public void setFechaEntrega(LocalDate fechaEntrega) { this.fechaEntrega = fechaEntrega; }
    public EstadoPedido getEstado() { return estado; }
    public void setEstado(EstadoPedido estado) { this.estado = estado; }
    public boolean isAnticipo() { return anticipo; }
    public void setAnticipo(boolean anticipo) { this.anticipo = anticipo; }
    public OrigenPedido getOrigen() { return origen; }
    public void setOrigen(OrigenPedido origen) { this.origen = origen; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public BigDecimal getMontoAnticipo() { return montoAnticipo; }
    public void setMontoAnticipo(BigDecimal montoAnticipo) { this.montoAnticipo = montoAnticipo; }
    public String getResponsable() { return responsable; }
    public void setResponsable(String responsable) { this.responsable = responsable; }
    public Long getImagenId() { return imagenId; }
    public void setImagenId(Long imagenId) { this.imagenId = imagenId; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }
    public java.util.List<DetallePedido> getDetalles() { return detalles; }
    public void setDetalles(java.util.List<DetallePedido> detalles) { this.detalles = detalles; }
    public java.util.List<HistorialEstado> getHistorial() { return historial; }
    public void setHistorial(java.util.List<HistorialEstado> historial) { this.historial = historial; }
}
