package ec.edu.ucacue.allday.exception;

import org.springframework.http.HttpStatus;

/** Error de negocio con su código HTTP. */
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    public ApiException(HttpStatus status, String mensaje) { super(mensaje); this.status = status; }
    public HttpStatus getStatus() { return status; }
    public static ApiException noEncontrado(String que) { return new ApiException(HttpStatus.NOT_FOUND, que + " no encontrado"); }
    public static ApiException conflicto(String m) { return new ApiException(HttpStatus.CONFLICT, m); }
    public static ApiException invalido(String m) { return new ApiException(HttpStatus.BAD_REQUEST, m); }
}
