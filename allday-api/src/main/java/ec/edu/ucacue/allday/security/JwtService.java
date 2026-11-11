package ec.edu.ucacue.allday.security;

import ec.edu.ucacue.allday.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Emite y valida tokens JWT firmados con HMAC-SHA256. */
@Service
public class JwtService {
    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private final SecretKey key;
    private final long expMillis;

    public JwtService(@Value("${app.jwt.secret:}") String secret, @Value("${app.jwt.expiration-hours:8}") long horas) {
        byte[] bytes;
        if (secret == null || secret.isBlank()) {
            // Sin JWT_SECRET se genera una clave temporal: las sesiones se pierden al reiniciar.
            bytes = new byte[32];
            new SecureRandom().nextBytes(bytes);
            log.warn("JWT_SECRET no definido: se usa una clave temporal. Defínalo en producción (Secrets Manager).");
        } else {
            bytes = secret.length() >= 44 && secret.matches("^[A-Za-z0-9+/=]+$") ? Decoders.BASE64.decode(secret) : secret.getBytes();
            if (bytes.length < 32) throw new IllegalStateException("JWT_SECRET debe tener al menos 32 bytes");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expMillis = horas * 3600_000L;
    }

    public String generar(Usuario u) {
        Date ahora = new Date();
        return Jwts.builder().subject(u.getEmail()).claim("rol", u.getRol().name()).claim("uid", u.getId())
                .issuedAt(ahora).expiration(new Date(ahora.getTime() + expMillis)).signWith(key).compact();
    }

    /** Devuelve los claims si el token es válido; lanza excepción en caso contrario. */
    public Claims validar(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public static String claveAleatoria() {
        byte[] b = new byte[48]; new SecureRandom().nextBytes(b); return Base64.getEncoder().encodeToString(b);
    }
}
