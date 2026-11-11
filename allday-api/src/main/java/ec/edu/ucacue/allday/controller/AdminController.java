package ec.edu.ucacue.allday.controller;

import ec.edu.ucacue.allday.dto.Dtos.*;
import ec.edu.ucacue.allday.exception.ApiException;
import ec.edu.ucacue.allday.model.ConfiguracionNegocio;
import ec.edu.ucacue.allday.model.Imagen;
import ec.edu.ucacue.allday.repository.ConfiguracionRepository;
import ec.edu.ucacue.allday.repository.ImagenRepository;
import ec.edu.ucacue.allday.service.CatalogoService;
import ec.edu.ucacue.allday.service.PedidoService;
import ec.edu.ucacue.allday.service.ReporteService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Imágenes, configuración del negocio, clientes, categorías y reportes. */
@RestController
@RequestMapping("/api")
public class AdminController {
    private static final Set<String> TIPOS = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_BYTES = 1_500_000;
    private final ImagenRepository imagenes;
    private final ConfiguracionRepository config;
    private final CatalogoService catalogo;
    private final PedidoService pedidos;
    private final ReporteService reportes;

    public AdminController(ImagenRepository i, ConfiguracionRepository c, CatalogoService cat, PedidoService p, ReporteService r) {
        imagenes = i; config = c; catalogo = cat; pedidos = p; reportes = r;
    }

    // ----- Imágenes (se guardan en la base para que todas las instancias detrás del balanceador las vean) -----
    @PostMapping(value = "/imagenes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED)
    public ImagenResponse subir(@RequestParam("archivo") MultipartFile archivo) throws IOException {
        if (archivo.isEmpty()) throw ApiException.invalido("Seleccione una imagen");
        if (!TIPOS.contains(archivo.getContentType())) throw ApiException.invalido("Formato no permitido: use JPG, PNG o WEBP");
        if (archivo.getSize() > MAX_BYTES) throw ApiException.invalido("La imagen supera 1,5 MB");
        byte[] datos = archivo.getBytes();
        if (!firmaValida(datos)) throw ApiException.invalido("El archivo no es una imagen válida");
        Imagen im = new Imagen(); im.setTipo(archivo.getContentType()); im.setDatos(datos); im.setCreadoEn(LocalDateTime.now());
        im = imagenes.save(im);
        return new ImagenResponse(im.getId(), "/api/public/imagenes/" + im.getId());
    }

    /** Comprueba los "bytes mágicos" para no confiar solo en el tipo declarado por el navegador. */
    private static boolean firmaValida(byte[] b) {
        if (b.length < 12) return false;
        boolean jpg = (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8;
        boolean png = (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
        boolean webp = b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
        return jpg || png || webp;
    }

    @GetMapping("/public/imagenes/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> imagen(@PathVariable Long id) {
        Imagen im = imagenes.findById(id).orElseThrow(() -> ApiException.noEncontrado("Imagen"));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(im.getTipo()))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic()).body(im.getDatos());
    }

    // ----- Configuración del negocio -----
    private ConfiguracionNegocio cfg() {
        return config.findAll().stream().findFirst().orElseGet(() -> {
            ConfiguracionNegocio c = new ConfiguracionNegocio(); c.setNombre("ALL DAY Arte – Detalles"); c.setDireccion("Cuenca, Ecuador");
            return config.save(c);
        });
    }
    @GetMapping("/public/configuracion")
    @Transactional
    public ConfiguracionDto configuracion() { return ConfiguracionDto.of(cfg()); }

    @PutMapping("/configuracion")
    @Transactional
    public ConfiguracionDto guardarConfiguracion(@Valid @RequestBody ConfiguracionDto d) {
        ConfiguracionNegocio c = cfg();
        c.setNombre(d.nombre().trim()); c.setDireccion(d.direccion()); c.setHorario(d.horario()); c.setWhatsapp(d.whatsapp());
        c.setFacebook(d.facebook()); c.setInstagram(d.instagram()); c.setTiktok(d.tiktok());
        c.setRuc(d.ruc()); c.setTelefono(d.telefono()); c.setPieComprobante(d.pieComprobante());
        c.setIvaPorcentaje(d.ivaPorcentaje()); c.setQrWhatsapp(d.qrWhatsapp());
        return ConfiguracionDto.of(c);
    }

    // ----- Categorías -----
    @PutMapping("/categorias/{id}")
    public CategoriaResponse actualizarCategoria(@PathVariable Long id, @Valid @RequestBody CategoriaRequest r) { return catalogo.actualizarCategoria(id, r); }

    @DeleteMapping("/categorias/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarCategoria(@PathVariable Long id) { catalogo.eliminarCategoria(id); }

    // ----- Clientes y reportes -----
    @GetMapping("/clientes")
    public List<ClienteResponse> clientes() { return pedidos.clientes(); }

    @GetMapping("/reportes/ventas")
    public ReporteVentas reporteVentas(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                       @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reportes.ventas(desde, hasta);
    }
}
