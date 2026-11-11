package ec.edu.ucacue.allday.service;

import ec.edu.ucacue.allday.dto.Dtos.*;
import ec.edu.ucacue.allday.exception.ApiException;
import ec.edu.ucacue.allday.model.Usuario;
import ec.edu.ucacue.allday.repository.UsuarioRepository;
import ec.edu.ucacue.allday.security.JwtService;
import ec.edu.ucacue.allday.security.UsuarioActual;
import java.util.List;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {
    private final UsuarioRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public UsuarioService(UsuarioRepository repo, PasswordEncoder encoder, JwtService jwt) {
        this.repo = repo; this.encoder = encoder; this.jwt = jwt;
    }

    public LoginResponse login(LoginRequest r) {
        Usuario u = repo.findByEmailIgnoreCase(r.email().trim())
                .filter(Usuario::isActivo)
                .filter(x -> encoder.matches(r.password(), x.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("credenciales"));
        return new LoginResponse(jwt.generar(u), u.getId(), u.getNombre(), u.getEmail(), u.getRol());
    }

    public List<UsuarioResponse> listar() { return repo.findAll().stream().map(UsuarioResponse::of).toList(); }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest r) {
        if (repo.existsByEmailIgnoreCase(r.email())) throw ApiException.conflicto("Ya existe un usuario con ese correo");
        if (r.password() == null || r.password().isBlank()) throw ApiException.invalido("La contraseña es obligatoria");
        Usuario u = new Usuario();
        u.setNombre(r.nombre().trim()); u.setEmail(r.email().trim().toLowerCase()); u.setRol(r.rol());
        u.setPasswordHash(encoder.encode(r.password())); u.setActivo(r.activo() == null || r.activo());
        return UsuarioResponse.of(repo.save(u));
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioRequest r) {
        Usuario u = repo.findById(id).orElseThrow(() -> ApiException.noEncontrado("Usuario"));
        repo.findByEmailIgnoreCase(r.email()).filter(o -> !o.getId().equals(id))
                .ifPresent(o -> { throw ApiException.conflicto("Ya existe un usuario con ese correo"); });
        Usuario yo = UsuarioActual.get();
        boolean desactivar = r.activo() != null && !r.activo();
        if (yo != null && yo.getId().equals(id) && (desactivar || r.rol() != u.getRol()))
            throw ApiException.invalido("No puede desactivarse ni cambiar su propio rol");
        u.setNombre(r.nombre().trim()); u.setEmail(r.email().trim().toLowerCase()); u.setRol(r.rol());
        if (r.activo() != null) u.setActivo(r.activo());
        if (r.password() != null && !r.password().isBlank()) u.setPasswordHash(encoder.encode(r.password()));
        return UsuarioResponse.of(u);
    }
}
