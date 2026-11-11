package ec.edu.ucacue.allday;

import java.util.Locale;
import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AlldayApiApplication {
    public static void main(String[] args) {
        Locale.setDefault(Locale.forLanguageTag("es-EC")); // mensajes de validación en español
        TimeZone.setDefault(TimeZone.getTimeZone("America/Guayaquil"));
        SpringApplication.run(AlldayApiApplication.class, args);
    }
}
