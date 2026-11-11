package ec.edu.ucacue.allday.security;

import ec.edu.ucacue.allday.model.Usuario;
import org.springframework.security.core.context.SecurityContextHolder;

/** Acceso al usuario autenticado de la petición en curso. */
public final class UsuarioActual {
    private UsuarioActual() {}
    public static Usuario get() {
        var a = SecurityContextHolder.getContext().getAuthentication();
        return a != null && a.getPrincipal() instanceof Usuario u ? u : null;
    }
}
