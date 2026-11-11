package ec.edu.ucacue.allday.controller;

import ec.edu.ucacue.allday.dto.Dtos.*;
import ec.edu.ucacue.allday.security.UsuarioActual;
import ec.edu.ucacue.allday.service.UsuarioService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final UsuarioService usuarios;
    public AuthController(UsuarioService u) { usuarios = u; }

    @PostMapping("/auth/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest r) { return usuarios.login(r); }

    @GetMapping("/auth/me")
    public UsuarioResponse me() { return UsuarioResponse.of(UsuarioActual.get()); }

    @GetMapping("/health")
    public java.util.Map<String, String> health() {
        // "servidor" permite comprobar el balanceo de carga en AWS: cada instancia responde con su propio nombre
        String servidor;
        try { servidor = java.net.InetAddress.getLocalHost().getHostName(); } catch (Exception e) { servidor = "desconocido"; }
        return java.util.Map.of("estado", "ok", "servidor", servidor);
    }

    @GetMapping("/usuarios")
    public List<UsuarioResponse> listar() { return usuarios.listar(); }

    @PostMapping("/usuarios") @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse crear(@Valid @RequestBody UsuarioRequest r) { return usuarios.crear(r); }

    @PutMapping("/usuarios/{id}")
    public UsuarioResponse actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioRequest r) { return usuarios.actualizar(id, r); }
}
