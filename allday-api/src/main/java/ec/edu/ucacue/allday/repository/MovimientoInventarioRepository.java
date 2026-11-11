package ec.edu.ucacue.allday.repository;

import ec.edu.ucacue.allday.model.MovimientoInventario;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {
    List<MovimientoInventario> findTop50ByOrderByFechaDesc();
}
