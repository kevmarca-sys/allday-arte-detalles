# ALL DAY Arte y Detalles — Plataforma web de gestión

Proyecto final de Programación Web (UCACUE, 7.º ciclo de Sistemas Computacionales).
Caso real: **ALL DAY Arte – Detalles**, bazar y papelería de Cuenca.

| Carpeta | Contenido | Tecnología |
|---|---|---|
| `allday-api` | API REST (lógica de negocio y acceso a datos) | Java 17, Spring Boot 3.5, Spring Security + JWT, JPA, PostgreSQL |
| `allday-web` | Tienda pública y panel del negocio (presentación) | React 18, Vite 5, React Router, Axios |

## Funcionalidades

**Catálogo web (cliente, sin cuenta, solo lectura):** el negocio no hace envíos, así que la web es un catálogo: portada, categorías y productos con foto, precio y disponibilidad, buscador, botón **Consultar por WhatsApp** en cada producto, explicación de los pedidos personalizados y consulta del estado de un pedido con su código. La web no recoge datos personales; el aviso de privacidad está en el pie. Horario, WhatsApp y redes se toman de la Configuración.

**Panel (con usuario):**
- **Inicio** (admin): ventas del día, gráfico de la semana, pedidos para hoy y productos por agotarse.
- **Caja · Venta** (admin y empleado): el total se va sumando al tocar productos; descuento, forma de pago (efectivo, transferencia, tarjeta), efectivo recibido con cálculo del vuelto, calculadora, datos del cliente (consumidor final o cédula/RUC validados) y **comprobante de venta numerado e imprimible** (ticket 80 mm). Descuenta el stock en una transacción.
- **Ventas** (admin y empleado): historial por fecha con número de comprobante, cliente, forma de pago y quién atendió; reimpresión, exportación a CSV y **anulación** (solo admin, con motivo; devuelve el stock y no suma en reportes).
- **Pedidos** (admin y empleado): tablero Recibido → En preparación → Listo → Entregado, con aviso por WhatsApp. Solo el admin puede anular.
- **Productos** (admin): catálogo con foto, precio, stock mínimo, destacados y activación.
- **Categorías** (admin): con foto e ícono; no se eliminan si tienen productos.
- **Inventario** (admin): niveles de stock, reposición, salidas, alertas e historial de movimientos.
- **Clientes** (admin y empleado): número de pedidos, último pedido y contacto por WhatsApp.
- **Reportes** (admin): ventas por rango de fechas, ticket promedio, ventas por categoría, productos más vendidos y exportación a CSV (Excel).
- **Configuración** (admin): datos del negocio (horario, WhatsApp, redes) y usuarios.

### Seguridad y cumplimiento
- El comprobante es un **documento interno de control**: no es factura ni comprobante electrónico autorizado por el SRI (eso requiere firma electrónica y conexión con el SRI).
- Contraseñas con BCrypt, tokens JWT con expiración, permisos por rol en cada ruta de la API.
- Las imágenes se validan por tipo, tamaño (máx. 1,5 MB) y firma del archivo; se reducen en el navegador antes de subirse y se guardan en la base para que funcionen con varias instancias detrás del balanceador.
- Consentimiento expreso para nombre y teléfono; la consulta pública por código no muestra datos personales.

## Cómo ejecutarlo en Windows

1. **Base de datos:** en pgAdmin, conectado al servidor del puerto **5433**, ejecute `allday-api/crear-base.sql` (crea la base `allday`).
2. **API:** en una terminal dentro de `allday-api` ejecute `.\ejecutar-api.ps1`. Pedirá la contraseña de PostgreSQL y, la primera vez, la contraseña del administrador (`admin@allday.ec`). Al iniciar se crean las categorías y se carga el **catálogo inicial del local** (77 productos con foto, precio de referencia y stock, desde `src/main/resources/seed/catalogo.csv`); los precios marcados como estimados los confirma la encargada desde el panel.
3. **Web:** en otra terminal dentro de `allday-web` ejecute `.\ejecutar-web.ps1` y abra <http://localhost:5173>.
4. **Panel del negocio:** no aparece en la tienda pública. El personal entra por <http://localhost:5173/admin> con `admin@allday.ec` y la contraseña elegida. Desde **Configuración → Usuarios** se crea la cuenta del empleado.

> Si PowerShell bloquea los scripts: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
> Documentación de la API: <http://localhost:8080/swagger-ui.html>.

## Variables de entorno

| Variable | Uso | Valor local por defecto |
|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Conexión a PostgreSQL | `jdbc:postgresql://localhost:5433/allday`, `postgres`, (se pide) |
| `JWT_SECRET` | Clave de firma de los tokens (≥ 32 bytes) | aleatoria por ejecución |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador inicial | `admin@allday.ec`, (se pide) |
| `CORS_ORIGINS` | Orígenes permitidos del front-end | localhost |
| `CARGAR_CATALOGO` | `false` evita cargar el catálogo inicial | `true` |
| `WHATSAPP_NEGOCIO` | WhatsApp del negocio para los botones de consulta | `593984115728` |
| `SEED_DEMO` | `true` carga productos y pedidos **ficticios** para practicar (base vacía) | `false` |
| `VITE_WHATSAPP` (web) | Número de WhatsApp **del negocio** (formato 5939XXXXXXXX) | vacío: muestra el mensaje sin enviarlo |

Ninguna contraseña se guarda en el código. En AWS los secretos se guardan cifrados en **SSM Parameter Store** y cada servidor los lee al arrancar.

## Arquitectura en AWS (despliegue con balanceo de carga)

```
Usuario ──HTTPS──▶ CloudFront ──▶ S3 privado ............ capa de presentación (React)
                       │
                       └─ /api/* ─▶ Application Load Balancer
                                       │  (reparte y revisa /api/health)
                                       ▼
                             Auto Scaling Group: 2–4 EC2 t3.micro
                             en 2 zonas de disponibilidad ........ capa de lógica (Spring Boot)
                                       │ 5432, SSL
                                       ▼
                             RDS PostgreSQL privada .............. capa de datos
```

| Control | Cómo se cumple |
|---|---|
| HTTPS | CloudFront con certificado de AWS; HTTP redirige a HTTPS |
| Red | `sg-alb` solo acepta tráfico de CloudFront; `sg-api` solo del ALB (8080); `sg-db` solo de la API (5432) |
| Base de datos | RDS sin acceso público, cifrada en reposo y con SSL obligatorio |
| Credenciales | SSM Parameter Store (SecureString, KMS); rol IAM de mínimo privilegio |
| Escalabilidad | Auto Scaling por CPU promedio > 50 % (mín. 2, máx. 4) |
| Recuperación | El ALB saca de servicio un servidor que falla y el ASG lo reemplaza |

### Desplegar (AWS CloudShell)

```bash
cd /tmp && git clone https://github.com/kevmarca-sys/allday-arte-detalles.git
bash allday-arte-detalles/aws/desplegar.sh
```

El script compila la API y la web, crea toda la infraestructura y al final muestra la URL pública. Volver a ejecutarlo actualiza la API servidor por servidor sin cortar el servicio.

- `aws/prueba-balanceo.sh`: muestra qué servidor responde cada petición, hace una prueba de carga y revisa los controles de seguridad.
- `aws/eliminar.sh`: borra todo lo creado (usar después de la defensa para no gastar créditos).

## Datos de ejemplo

Por defecto la API carga el catálogo real del local y **no inventa** ventas ni pedidos. Para practicar se puede ejecutar con `SEED_DEMO=true`, que carga datos **ficticios**. Las fotos de las categorías provienen del diseño de referencia; reemplácelas por fotos reales desde **Categorías**.
