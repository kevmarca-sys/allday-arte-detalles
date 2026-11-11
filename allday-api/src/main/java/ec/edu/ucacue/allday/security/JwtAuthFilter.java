package ec.edu.ucacue.allday.security;

import ec.edu.ucacue.allday.repository.UsuarioRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Lee el encabezado Authorization: Bearer <token> y autentica la petición. */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final UsuarioRepository usuarios;

    public JwtAuthFilter(JwtService jwt, UsuarioRepository usuarios) { this.jwt = jwt; this.usuarios = usuarios; }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) {
            try {
                Claims c = jwt.validar(h.substring(7));
                usuarios.findByEmailIgnoreCase(c.getSubject()).filter(u -> u.isActivo()).ifPresent(u -> {
                    var auth = new UsernamePasswordAuthenticationToken(u, null, List.of(new SimpleGrantedAuthority("ROLE_" + u.getRol().name())));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            } catch (Exception e) {
                SecurityContextHolder.clearContext(); // token inválido o expirado: queda como anónimo
            }
        }
        chain.doFilter(req, res);
    }
}
