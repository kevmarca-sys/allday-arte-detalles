package ec.edu.ucacue.allday.exception;

import ec.edu.ucacue.allday.dto.Dtos.ErrorResponse;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** Convierte las excepciones en respuestas JSON uniformes y comprensibles. */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<ErrorResponse> resp(HttpStatus s, String m, Map<String, String> campos) {
        return ResponseEntity.status(s).body(new ErrorResponse(s.value(), m, campos, LocalDateTime.now()));
    }
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> api(ApiException e) { return resp(e.getStatus(), e.getMessage(), null); }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validacion(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> campos.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return resp(HttpStatus.BAD_REQUEST, "Revise los datos ingresados", campos);
    }
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorResponse> formato(Exception e) { return resp(HttpStatus.BAD_REQUEST, "Formato de datos no válido", null); }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> tamano(Exception e) { return resp(HttpStatus.BAD_REQUEST, "El archivo es demasiado grande (máx. 1,5 MB)", null); }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> noRuta(Exception e) { return resp(HttpStatus.NOT_FOUND, "Recurso no encontrado", null); }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> credenciales(BadCredentialsException e) { return resp(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos", null); }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> denegado(AccessDeniedException e) { return resp(HttpStatus.FORBIDDEN, "No tiene permiso para esta acción", null); }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> integridad(DataIntegrityViolationException e) { return resp(HttpStatus.CONFLICT, "El registro entra en conflicto con datos existentes", null); }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> general(Exception e) {
        log.error("Error no controlado", e);
        return resp(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error inesperado. Intente nuevamente.", null);
    }
}
