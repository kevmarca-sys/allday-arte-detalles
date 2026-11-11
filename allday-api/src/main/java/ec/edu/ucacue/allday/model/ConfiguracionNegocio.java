package ec.edu.ucacue.allday.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "configuracion_negocio")
public class ConfiguracionNegocio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 200)
    private String direccion;

    @Column(length = 120)
    private String horario;

    @Column(length = 20)
    private String whatsapp;

    @Column(length = 200)
    private String facebook;

    @Column(length = 200)
    private String instagram;

    @Column(length = 200)
    private String tiktok;

    @Column(length = 13)
    private String ruc;

    @Column(length = 20)
    private String telefono;

    @Column(name = "pie_comprobante", length = 200)
    private String pieComprobante;

    @Column(name = "iva_porcentaje")
    private Integer ivaPorcentaje;

    @Column(name = "qr_whatsapp")
    private Boolean qrWhatsapp;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getHorario() { return horario; }
    public void setHorario(String horario) { this.horario = horario; }
    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
    public String getFacebook() { return facebook; }
    public void setFacebook(String facebook) { this.facebook = facebook; }
    public String getInstagram() { return instagram; }
    public void setInstagram(String instagram) { this.instagram = instagram; }
    public String getTiktok() { return tiktok; }
    public void setTiktok(String tiktok) { this.tiktok = tiktok; }
    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getPieComprobante() { return pieComprobante; }
    public void setPieComprobante(String pieComprobante) { this.pieComprobante = pieComprobante; }
    public Integer getIvaPorcentaje() { return ivaPorcentaje; }
    public void setIvaPorcentaje(Integer ivaPorcentaje) { this.ivaPorcentaje = ivaPorcentaje; }
    public Boolean getQrWhatsapp() { return qrWhatsapp; }
    public void setQrWhatsapp(Boolean qrWhatsapp) { this.qrWhatsapp = qrWhatsapp; }
}
