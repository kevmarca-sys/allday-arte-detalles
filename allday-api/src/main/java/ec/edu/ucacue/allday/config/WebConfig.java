package ec.edu.ucacue.allday.config;

import java.util.Locale;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.FixedLocaleResolver;

@Configuration
public class WebConfig {
    /** Todas las respuestas (incluidos los mensajes de validación) en español. */
    @Bean
    LocaleResolver localeResolver() { return new FixedLocaleResolver(Locale.forLanguageTag("es-EC")); }
}
