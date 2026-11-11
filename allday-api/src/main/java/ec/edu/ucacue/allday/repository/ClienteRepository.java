package ec.edu.ucacue.allday.repository;

import ec.edu.ucacue.allday.model.Cliente;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findFirstByTelefonoAndNombreIgnoreCase(String telefono, String nombre);
    long countByCreadoEnGreaterThanEqual(java.time.LocalDateTime desde);
}
