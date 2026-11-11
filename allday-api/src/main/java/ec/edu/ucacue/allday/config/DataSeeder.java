package ec.edu.ucacue.allday.config;

import ec.edu.ucacue.allday.model.*;
import ec.edu.ucacue.allday.repository.*;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Carga inicial: crea el administrador (con la contraseña de la variable ADMIN_PASSWORD), la configuración
 * del negocio, las categorías del local y el catálogo de productos de seed/catalogo.csv (precios
 * referenciales; el negocio los ajusta desde el panel). Solo con SEED_DEMO=true (para practicar)
 * se cargan además pedidos FICTICIOS.
 */
@Component
public class DataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private final UsuarioRepository usuarios; private final CategoriaRepository categorias;
    private final ProductoRepository productos; private final ClienteRepository clientes;
    private final PedidoRepository pedidos; private final ImagenRepository imagenes;
    private final ConfiguracionRepository config; private final PasswordEncoder encoder;
    @Value("${app.admin.email}") private String adminEmail;
    @Value("${app.admin.password:}") private String adminPassword;
    @Value("${app.seed-demo:false}") private boolean seedDemo;
    @Value("${app.cargar-catalogo:true}") private boolean cargarCatalogo;
    @Value("${app.whatsapp-negocio:}") private String whatsappNegocio;
    private final MovimientoInventarioRepository movimientos;

    public DataSeeder(UsuarioRepository u, CategoriaRepository c, ProductoRepository p, ClienteRepository cl,
                      PedidoRepository pe, ImagenRepository im, ConfiguracionRepository cf, PasswordEncoder e,
                      MovimientoInventarioRepository mv) {
        movimientos = mv; usuarios = u; categorias = c; productos = p; clientes = cl; pedidos = pe; imagenes = im; config = cf; encoder = e;
    }

    @Override @Transactional
    public void run(String... args) {
        if (usuarios.count() == 0) {
            if (adminPassword == null || adminPassword.length() < 8) {
                log.warn("No hay usuarios y ADMIN_PASSWORD no está definido (mín. 8 caracteres): no se creó el administrador.");
            } else {
                Usuario a = new Usuario();
                a.setNombre("Administración ALL DAY"); a.setEmail(adminEmail.toLowerCase()); a.setRol(Rol.ADMIN);
                a.setActivo(true); a.setPasswordHash(encoder.encode(adminPassword));
                usuarios.save(a);
                log.info("Administrador creado: {}", adminEmail);
            }
        }
        if (config.count() == 0) {
            ConfiguracionNegocio c = new ConfiguracionNegocio();
            c.setNombre("ALL DAY Arte – Detalles"); c.setDireccion("Cuenca, Ecuador"); c.setHorario("Lun - Sáb: 08:30 - 19:00");
            c.setPieComprobante("¡Gracias por su compra!");
            config.save(c);
        }
        // WhatsApp del negocio: se pone solo si está vacío (si se cambia en el panel, se respeta el del panel).
        String wa = whatsappNegocio == null ? "" : whatsappNegocio.replaceAll("\\D", "");
        if (!wa.isEmpty()) config.findAll().stream().findFirst().ifPresent(c -> {
            if (c.getWhatsapp() == null || c.getWhatsapp().isBlank()) {
                c.setWhatsapp(wa); config.save(c);
                log.info("WhatsApp del negocio configurado: +{}", wa);
            }
        });
        if (categorias.count() == 0) {
            cargarCategorias();
            if (seedDemo) cargarDemo();
        }
        if (cargarCatalogo) cargarCatalogo();
        // Productos creados antes de existir el campo "código": se les asigna uno para la caja y el lector de barras
        productos.findAll().stream().filter(p -> p.getCodigo() == null).forEach(p -> {
            String n = java.text.Normalizer.normalize(p.getCategoria().getNombre(), java.text.Normalizer.Form.NFD).replaceAll("[^A-Za-z]", "").toUpperCase();
            p.setCodigo("AD-" + (n + "XXX").substring(0, 3) + "-" + String.format("%03d", p.getId()));
        });
    }

    private Long img(String nombre) {
        if (nombre == null) return null;
        try (InputStream in = new ClassPathResource("seed/" + nombre + ".jpg").getInputStream()) {
            Imagen i = new Imagen(); i.setTipo("image/jpeg"); i.setDatos(in.readAllBytes()); i.setCreadoEn(LocalDateTime.now());
            return imagenes.save(i).getId();
        } catch (Exception e) { return null; }
    }
    private Categoria cat(String n, String ic, String imagen) {
        Categoria c = new Categoria(); c.setNombre(n); c.setIcono(ic); c.setImagenId(img(imagen)); return categorias.save(c);
    }
    private void prod(Categoria c, String n, String precio, int stock, int min, boolean serv, boolean dest, Long imagen) {
        Producto p = new Producto(); p.setCategoria(c); p.setNombre(n); p.setPrecio(new BigDecimal(precio));
        p.setStock(serv ? 0 : stock); p.setStockMinimo(serv ? 0 : min); p.setEsServicio(serv); p.setDestacado(dest); p.setActivo(true);
        p.setImagenId(imagen);
        productos.save(p);
    }

    /** Líneas de negocio que la encargada indicó en la entrevista (04/11/2026), más el bazar del nombre del local. */
    private void cargarCategorias() {
        cat("Útiles escolares", "note", "cat-papeleria"); cat("Copias e impresiones", "print", null); cat("Fotos", "camera", "cat-fotos");
        cat("Detalles y Regalos", "gift", "cat-regalos"); cat("Cosméticos", "lips", "cat-cosmeticos");
        cat("Artículos para fiestas", "balloon", "cat-fiestas"); cat("Bazar", "basket", "cat-bazar");
        log.info("Categorías del negocio creadas (sin productos).");
    }

    /**
     * Catálogo del local (resources/seed/catalogo.csv), levantado de las fotos del 10/11/2026.
     * Solo agrega lo que falta: no duplica categorías ni productos (compara por nombre) y no
     * modifica precios o stock editados desde el panel. Se desactiva con CARGAR_CATALOGO=false.
     * Los precios son referenciales y deben confirmarse con el negocio.
     */
    private void cargarCatalogo() {
        java.util.Map<String, Categoria> cats = new java.util.HashMap<>();
        categorias.findAll().forEach(c -> cats.put(c.getNombre().toLowerCase(), c));
        java.util.Map<String, Producto> existentes = new java.util.HashMap<>();
        productos.findAll().forEach(p -> existentes.put(p.getNombre().toLowerCase(), p));
        Usuario admin = usuarios.findAll().stream().filter(u -> u.getRol() == Rol.ADMIN).findFirst().orElse(null);
        int nuevos = 0, fotos = 0;
        java.util.Set<String> reemplazar = leerReemplazos();
        try (var in = new java.io.BufferedReader(new java.io.InputStreamReader(
                new ClassPathResource("seed/catalogo.csv").getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String linea = in.readLine(); // encabezado
            while ((linea = in.readLine()) != null) {
                if (linea.isBlank()) continue;
                String[] f = linea.split(";", -1);
                if (f.length < 10) { log.warn("Fila del catálogo ignorada: {}", linea); continue; }
                Categoria c = cats.get(f[0].toLowerCase());
                if (c == null) { c = cat(f[0], f[1], null); cats.put(f[0].toLowerCase(), c); }
                String foto = f.length > 10 ? f[10].trim() : "";
                Producto ya = existentes.get(f[2].toLowerCase());
                if (ya != null) { // ya existe: solo se le pone la foto si todavía no tiene
                    if (ya.getImagenId() == null && !foto.isEmpty()) {
                        Long img = imagenSeed(foto);
                        if (img != null) { ya.setImagenId(img); productos.save(ya); fotos++; }
                    } else if (reemplazar.contains(foto) && actualizarImagen(ya, foto)) {
                        fotos++;
                    }
                    continue;
                }
                boolean serv = f[8].equals("1");
                Producto p = new Producto(); p.setCategoria(c); p.setNombre(f[2]); p.setDescripcion(f[3]);
                p.setPrecio(new BigDecimal(f[5])); p.setStock(serv ? 0 : Integer.parseInt(f[6]));
                p.setStockMinimo(serv ? 0 : Integer.parseInt(f[7])); p.setEsServicio(serv);
                p.setDestacado(f[9].equals("1")); p.setActivo(true);
                if (!foto.isEmpty()) { Long img = imagenSeed(foto); if (img != null) { p.setImagenId(img); fotos++; } }
                p = productos.save(p); existentes.put(f[2].toLowerCase(), p); nuevos++;
                if (!serv && p.getStock() > 0) {
                    MovimientoInventario m = new MovimientoInventario(); m.setProducto(p); m.setUsuario(admin);
                    m.setTipo(TipoMovimiento.ENTRADA); m.setCantidad(p.getStock());
                    m.setMotivo("Carga inicial del catálogo"); m.setFecha(LocalDateTime.now());
                    movimientos.save(m);
                }
            }
        } catch (Exception e) {
            log.error("No se pudo cargar el catálogo: {}", e.getMessage());
        }
        if (nuevos > 0) log.info("Catálogo: {} productos agregados (precios referenciales, confirmar con el negocio).", nuevos);
        if (fotos > 0) log.info("Catálogo: {} imágenes de productos cargadas.", fotos);
    }

    /** Archivos de seed/img/reemplazar.txt: su imagen se actualiza aunque el producto ya tenga una. */
    private java.util.Set<String> leerReemplazos() {
        java.util.Set<String> r = new java.util.HashSet<>();
        var res = new ClassPathResource("seed/img/reemplazar.txt");
        if (!res.exists()) return r;
        try (var in = res.getInputStream()) {
            for (String l : new String(in.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8).split("\\R")) {
                l = l.trim(); if (!l.isEmpty() && !l.startsWith("#")) r.add(l);
            }
        } catch (Exception e) { log.warn("No se pudo leer reemplazar.txt: {}", e.getMessage()); }
        return r;
    }

    /**
     * Si el archivo es distinto a la imagen actual del producto, guarda una imagen NUEVA (otro id, para
     * que el navegador no muestre la anterior desde su caché). La anterior se conserva por si otra
     * parte del sistema (galería) la usa.
     */
    private boolean actualizarImagen(Producto p, String archivo) {
        var res = new ClassPathResource("seed/img/" + archivo);
        if (p.getImagenId() == null || !res.exists()) return false;
        Imagen vieja = imagenes.findById(p.getImagenId()).orElse(null);
        try (var in = res.getInputStream()) {
            byte[] datos = in.readAllBytes();
            if (vieja != null && java.util.Arrays.equals(datos, vieja.getDatos())) return false;
            Imagen i = new Imagen(); i.setTipo(archivo.endsWith(".png") ? "image/png" : "image/jpeg");
            i.setDatos(datos); i.setCreadoEn(LocalDateTime.now());
            p.setImagenId(imagenes.save(i).getId()); productos.save(p);
            return true;
        } catch (Exception e) { log.warn("No se pudo actualizar la imagen {}: {}", archivo, e.getMessage()); return false; }
    }

    /** Guarda en la tabla imagenes una foto de resources/seed/img y devuelve su id (null si no existe). */
    private Long imagenSeed(String archivo) {
        var res = new ClassPathResource("seed/img/" + archivo);
        if (!res.exists()) { log.warn("No se encontró la imagen del catálogo: {}", archivo); return null; }
        try (var in = res.getInputStream()) {
            Imagen i = new Imagen(); i.setTipo(archivo.endsWith(".png") ? "image/png" : "image/jpeg");
            i.setDatos(in.readAllBytes()); i.setCreadoEn(LocalDateTime.now());
            return imagenes.save(i).getId();
        } catch (Exception e) { log.warn("No se pudo leer la imagen {}: {}", archivo, e.getMessage()); return null; }
    }

    private Categoria porNombre(String n) {
        return categorias.findAll().stream().filter(c -> c.getNombre().equals(n)).findFirst().orElseThrow();
    }

    /** SOLO PARA PRÁCTICA (SEED_DEMO=true): productos y pedidos ficticios. */
    private void cargarDemo() {
        Categoria ute = porNombre("Útiles escolares"), cop = porNombre("Copias e impresiones"), fot = porNombre("Fotos"),
                det = porNombre("Detalles y Regalos"), cos = porNombre("Cosméticos"), fie = porNombre("Artículos para fiestas"), baz = porNombre("Bazar");
        prod(ute, "Cuaderno universitario 100 hojas", "1.50", 42, 15, false, true, img("p-cuaderno"));
        prod(det, "Caja de regalo", "10.00", 16, 5, false, true, img("p-caja"));
        prod(fot, "Impresión de fotos 10x15 cm", "0.25", 0, 0, true, true, img("p-fotos"));
        prod(ute, "Esferos azules (caja x12)", "3.20", 6, 8, false, false, null);
        prod(ute, "Set de marcadores 12 colores", "4.50", 18, 6, false, true, null);
        prod(ute, "Cartulina A4 (paquete x10)", "1.20", 35, 10, false, false, null);
        prod(cop, "Copia blanco y negro", "0.05", 0, 0, true, false, null);
        prod(cop, "Impresión a color", "0.25", 0, 0, true, false, null);
        prod(fot, "Fotos tamaño carné (x6)", "2.00", 0, 0, true, false, null);
        prod(det, "Arreglo para cumpleaños", "18.00", 4, 2, false, false, null);
        prod(cos, "Labial mate", "3.50", 14, 5, false, false, null);
        prod(fie, "Globos metalizados (x5)", "4.00", 30, 10, false, true, null);
        prod(fie, "Velas de cumpleaños", "0.90", 2, 10, false, false, null);
        prod(baz, "Organizador de escritorio", "5.75", 9, 4, false, false, null);
        pedido("María P.", "0987001122", "Detalle / arreglo", "Caja con globos y tarjeta 'Feliz día mamá'", 0, EstadoPedido.EN_PREPARACION, OrigenPedido.LOCAL);
        pedido("Jorge V.", "0991112233", "Decoración para fiesta", "Globos azul y blanco, letrero 'Mateo 5'", 1, EstadoPedido.RECIBIDO, OrigenPedido.WEB);
        pedido("Ana T.", "0995554433", "Impresión de documentos", "Trabajo de 40 páginas a color, anillado", 3, EstadoPedido.RECIBIDO, OrigenPedido.LOCAL);
        pedido("Luis R.", "0981237788", "Impresión de fotos", "20 fotos 10x15", 0, EstadoPedido.LISTO, OrigenPedido.LOCAL);
        log.warn("SEED_DEMO=true: se cargaron productos, precios y pedidos FICTICIOS. No usar con datos reales.");
    }

    private void pedido(String nom, String tel, String tipo, String desc, int dias, EstadoPedido estado, OrigenPedido origen) {
        Cliente c = new Cliente(); c.setNombre(nom); c.setTelefono(tel); c.setCreadoEn(LocalDateTime.now().minusDays(2)); clientes.save(c);
        Pedido p = new Pedido(); p.setCodigo("TMP-" + nom); p.setCliente(c); p.setTipo(tipo); p.setDescripcion(desc);
        p.setFechaEntrega(LocalDate.now().plusDays(dias)); p.setEstado(estado); p.setAnticipo(true); p.setOrigen(origen);
        p.setCreadoEn(LocalDateTime.now().minusHours(5));
        EstadoPedido[] orden = {EstadoPedido.RECIBIDO, EstadoPedido.EN_PREPARACION, EstadoPedido.LISTO};
        for (EstadoPedido e : orden) {
            HistorialEstado h = new HistorialEstado(); h.setPedido(p); h.setEstado(e);
            h.setFecha(LocalDateTime.now().minusHours(5 - e.ordinal())); p.getHistorial().add(h);
            if (e == estado) break;
        }
        p = pedidos.saveAndFlush(p);
        p.setCodigo(String.format("AD-%04d", 1000 + p.getId()));
    }
}
