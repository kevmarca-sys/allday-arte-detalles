package ec.edu.ucacue.allday.controller;

import ec.edu.ucacue.allday.dto.Dtos.*;
import ec.edu.ucacue.allday.service.CatalogoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CatalogoController {
    private final CatalogoService catalogo;
    public CatalogoController(CatalogoService c) { catalogo = c; }

    @GetMapping("/categorias")
    public List<CategoriaResponse> categorias() { return catalogo.categorias(); }

    @PostMapping("/categorias") @ResponseStatus(HttpStatus.CREATED)
    public CategoriaResponse crearCategoria(@Valid @RequestBody CategoriaRequest r) { return catalogo.crearCategoria(r); }

    @GetMapping("/productos")
    public List<ProductoResponse> productos(@RequestParam(required = false) String q, @RequestParam(required = false) Long categoriaId,
                                            @RequestParam(defaultValue = "true") boolean soloActivos) {
        return catalogo.buscar(q, categoriaId, soloActivos, false).stream().map(ProductoResponse::of).toList();
    }

    @PostMapping("/productos") @ResponseStatus(HttpStatus.CREATED)
    public ProductoResponse crear(@Valid @RequestBody ProductoRequest r) { return catalogo.crear(r); }

    @PutMapping("/productos/{id}")
    public ProductoResponse actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest r) { return catalogo.actualizar(id, r); }

    @PostMapping("/inventario/movimientos")
    public ProductoResponse movimiento(@Valid @RequestBody MovimientoRequest r) { return catalogo.movimiento(r); }

    @GetMapping("/inventario/movimientos")
    public List<MovimientoResponse> movimientos() { return catalogo.ultimosMovimientos(); }

    @GetMapping("/inventario/alertas")
    public List<ProductoResponse> alertas() { return catalogo.alertas(); }
}
