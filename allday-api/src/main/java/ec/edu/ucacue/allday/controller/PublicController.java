package ec.edu.ucacue.allday.controller;

import ec.edu.ucacue.allday.dto.Dtos.*;
import ec.edu.ucacue.allday.service.CatalogoService;
import ec.edu.ucacue.allday.service.PedidoService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

/** Servicios públicos del catálogo (solo lectura): no requieren autenticación. */
@RestController
@RequestMapping("/api/public")
public class PublicController {
    private final CatalogoService catalogo;
    private final PedidoService pedidos;
    public PublicController(CatalogoService c, PedidoService p) { catalogo = c; pedidos = p; }

    @GetMapping("/categorias")
    public List<CategoriaResponse> categorias() { return catalogo.categorias(); }

    @GetMapping("/productos")
    public List<ProductoPublico> productos(@RequestParam(required = false) String q, @RequestParam(required = false) Long categoriaId,
                                           @RequestParam(defaultValue = "false") boolean destacados) {
        return catalogo.buscar(q, categoriaId, true, destacados).stream().map(ProductoPublico::of).toList();
    }

    @GetMapping("/productos/{id}")
    public ProductoPublico producto(@PathVariable Long id) { return catalogo.publico(id); }

    @GetMapping("/pedidos/{codigo}")
    public PedidoPublico consultar(@PathVariable String codigo) { return pedidos.consultaPublica(codigo); }
}
