package ec.edu.ucacue.allday.repository;

import ec.edu.ucacue.allday.model.Producto;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @Query("""
        select p from Producto p
        where (:soloActivos = false or p.activo = true)
          and (:categoriaId is null or p.categoria.id = :categoriaId)
          and (:q = '' or lower(p.nombre) like lower(concat('%', :q, '%')) or lower(coalesce(p.codigo, '')) like lower(concat('%', :q, '%')))
          and (:destacados = false or p.destacado = true)
        order by p.nombre""")
    List<Producto> buscar(@Param("q") String q, @Param("categoriaId") Long categoriaId,
                          @Param("soloActivos") boolean soloActivos, @Param("destacados") boolean destacados);

    Optional<Producto> findFirstByCodigoIgnoreCase(String codigo);

    @Query("select p from Producto p where p.activo = true and p.esServicio = false and p.stock <= p.stockMinimo order by p.stock")
    List<Producto> bajoMinimo();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Producto p where p.id = :id")
    Optional<Producto> bloquear(@Param("id") Long id);
}
