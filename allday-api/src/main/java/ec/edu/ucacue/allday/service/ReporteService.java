package ec.edu.ucacue.allday.service;

import ec.edu.ucacue.allday.dto.Dtos.*;
import ec.edu.ucacue.allday.exception.ApiException;
import ec.edu.ucacue.allday.model.EstadoPedido;
import ec.edu.ucacue.allday.model.Producto;
import ec.edu.ucacue.allday.repository.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReporteService {
    private final VentaRepository ventas;
    private final DetalleVentaRepository detalles;
    private final PedidoRepository pedidos;
    private final ClienteRepository clientes;
    private final CatalogoService catalogo;
    private final VentaService ventaService;

    public ReporteService(VentaRepository v, DetalleVentaRepository d, PedidoRepository p, ClienteRepository c,
                          CatalogoService cat, VentaService vs) {
        ventas = v; detalles = d; pedidos = p; clientes = c; catalogo = cat; ventaService = vs;
    }

    private static Double variacion(BigDecimal actual, BigDecimal anterior) {
        if (anterior.signum() == 0) return null; // sin base de comparación
        return actual.subtract(anterior).multiply(BigDecimal.valueOf(100)).divide(anterior, 1, RoundingMode.HALF_UP).doubleValue();
    }

    private List<TopProducto> top(LocalDateTime desde, LocalDateTime hasta, int n) {
        return detalles.masVendidos(desde, hasta, PageRequest.of(0, n)).stream().map(r -> {
            Producto p = (Producto) r[0];
            return new TopProducto(p.getId(), p.getNombre(), p.getCategoria().getIcono(), p.getImagenId(), (Long) r[1], (BigDecimal) r[2],
                    p.getCodigo(), p.getCategoria().getNombre());
        }).toList();
    }

    private List<DiaVenta> porDia(LocalDate desde, LocalDate hasta) {
        List<DiaVenta> l = new ArrayList<>();
        for (LocalDate d = desde; !d.isAfter(hasta); d = d.plusDays(1))
            l.add(new DiaVenta(d, ventas.totalEntre(d.atStartOfDay(), d.plusDays(1).atStartOfDay())));
        return l;
    }

    @Transactional(readOnly = true)
    public Resumen resumen() {
        LocalDate hoy = LocalDate.now();
        var ini = hoy.atStartOfDay(); var fin = hoy.plusDays(1).atStartOfDay();
        LocalDateTime iniMes = hoy.withDayOfMonth(1).atStartOfDay();
        // Mes anterior comparado hasta el mismo día, para que la variación sea justa
        LocalDateTime iniMesAnt = iniMes.minusMonths(1), finMesAnt = fin.minusMonths(1);
        BigDecimal ventasMes = ventas.totalEntre(iniMes, fin), ventasAnt = ventas.totalEntre(iniMesAnt, finMesAnt);
        long pedMes = pedidos.countByCreadoEnBetween(iniMes, fin), pedAnt = pedidos.countByCreadoEnBetween(iniMesAnt, finMesAnt);

        var activos = pedidos.findByEstadoInOrderByFechaEntregaAscIdAsc(PedidoService.ACTIVOS);
        var paraHoy = activos.stream().filter(p -> p.getEstado() != EstadoPedido.LISTO && !p.getFechaEntrega().isAfter(hoy))
                .map(PedidoResponse::of).toList();
        var alertas = catalogo.alertas();
        var ultimas = ventaService.delDia(hoy);
        return new Resumen(ventas.totalEntre(ini, fin), ventas.contarEntre(ini, fin), activos.size(), paraHoy.size(),
                pedidos.countByEstadoIn(EnumSet.of(EstadoPedido.LISTO)), alertas.size(), porDia(hoy.minusDays(6), hoy),
                ultimas.subList(0, Math.min(8, ultimas.size())), paraHoy, alertas,
                ventasMes, variacion(ventasMes, ventasAnt), pedMes, variacion(BigDecimal.valueOf(pedMes), BigDecimal.valueOf(pedAnt)),
                clientes.count(), clientes.countByCreadoEnGreaterThanEqual(iniMes), top(iniMes, fin, 5),
                pedidos.findTop6ByOrderByCreadoEnDesc().stream().map(PedidoResponse::of).toList());
    }

    @Transactional(readOnly = true)
    public ReporteVentas ventas(LocalDate desde, LocalDate hasta) {
        if (hasta.isBefore(desde)) throw ApiException.invalido("La fecha final no puede ser anterior a la inicial");
        if (desde.plusDays(370).isBefore(hasta)) throw ApiException.invalido("El rango máximo es de un año");
        LocalDateTime a = desde.atStartOfDay(), b = hasta.plusDays(1).atStartOfDay();
        BigDecimal total = ventas.totalEntre(a, b);
        long n = ventas.contarEntre(a, b);
        BigDecimal ticket = n == 0 ? BigDecimal.ZERO : total.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
        List<CategoriaVenta> cats = detalles.porCategoria(a, b).stream()
                .map(r -> new CategoriaVenta((String) r[0], (Long) r[1], (BigDecimal) r[2])).toList();
        long dias = java.time.temporal.ChronoUnit.DAYS.between(desde, hasta) + 1;
        LocalDateTime pa = a.minusDays(dias);
        // Margen estimado: solo productos con costo registrado (costo actual del producto)
        BigDecimal ingresos = BigDecimal.ZERO, utilidad = BigDecimal.ZERO;
        for (Object[] r : detalles.masVendidos(a, b, PageRequest.of(0, 10000))) {
            Producto p = (Producto) r[0];
            if (p.getCosto() == null) continue;
            BigDecimal monto = (BigDecimal) r[2];
            ingresos = ingresos.add(monto);
            utilidad = utilidad.add(monto.subtract(p.getCosto().multiply(BigDecimal.valueOf((Long) r[1]))));
        }
        Double margen = ingresos.signum() == 0 ? null
                : utilidad.multiply(BigDecimal.valueOf(100)).divide(ingresos, 1, RoundingMode.HALF_UP).doubleValue();
        return new ReporteVentas(desde, hasta, total, n, ticket, pedidos.countByCreadoEnBetween(a, b),
                porDia(desde, hasta), top(a, b, 10), cats, ventas.totalEntre(pa, a), ventas.contarEntre(pa, a), margen,
                pedidos.countByEstadoIn(EnumSet.of(EstadoPedido.LISTO)),
                pedidos.countByEstadoIn(EnumSet.of(EstadoPedido.RECIBIDO, EstadoPedido.EN_PREPARACION)));
    }
}
