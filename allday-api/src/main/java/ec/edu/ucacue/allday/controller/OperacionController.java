package ec.edu.ucacue.allday.controller;

import ec.edu.ucacue.allday.dto.Dtos.*;
import ec.edu.ucacue.allday.model.EstadoPedido;
import ec.edu.ucacue.allday.model.OrigenPedido;
import ec.edu.ucacue.allday.service.*;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/** Ventas, pedidos y reportes del panel interno. */
@RestController
@RequestMapping("/api")
public class OperacionController {
    private final VentaService ventas;
    private final PedidoService pedidos;
    private final ReporteService reportes;
    public OperacionController(VentaService v, PedidoService p, ReporteService r) { ventas = v; pedidos = p; reportes = r; }

    @PostMapping("/ventas") @ResponseStatus(HttpStatus.CREATED)
    public VentaResponse vender(@Valid @RequestBody VentaRequest r) { return ventas.registrar(r); }

    @GetMapping("/ventas")
    public List<VentaResponse> ventas(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        LocalDate a = desde == null ? LocalDate.now() : desde;
        return ventas.entre(a, hasta == null ? a : hasta);
    }

    @GetMapping("/ventas/{id}")
    public VentaResponse venta(@PathVariable Long id) { return ventas.obtener(id); }

    @PostMapping("/ventas/{id}/anular")
    public VentaResponse anular(@PathVariable Long id, @Valid @RequestBody AnularRequest r) { return ventas.anular(id, r.motivo()); }

    @GetMapping("/pedidos")
    public List<PedidoResponse> pedidos(@RequestParam(required = false) EstadoPedido estado) {
        return estado == null ? pedidos.activos() : pedidos.porEstado(estado);
    }

    @PostMapping("/pedidos") @ResponseStatus(HttpStatus.CREATED)
    public PedidoResponse crear(@Valid @RequestBody PedidoRequest r) { return pedidos.crear(r, OrigenPedido.LOCAL); }

    @GetMapping("/pedidos/entregados")
    public List<PedidoResponse> entregados() { return pedidos.entregadosRecientes(); }

    @PutMapping("/pedidos/{id}")
    public PedidoResponse editar(@PathVariable Long id, @Valid @RequestBody PedidoRequest r) { return pedidos.actualizar(id, r); }

    @PostMapping("/pedidos/{id}/pagos")
    public PedidoResponse pago(@PathVariable Long id, @Valid @RequestBody PagoRequest r) { return pedidos.pago(id, r.monto()); }

    @PatchMapping("/pedidos/{id}/estado")
    public PedidoResponse estado(@PathVariable Long id, @Valid @RequestBody EstadoRequest r) { return pedidos.cambiarEstado(id, r.estado()); }

    @GetMapping("/reportes/resumen")
    public Resumen resumen() { return reportes.resumen(); }
}
