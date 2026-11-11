package ec.edu.ucacue.allday.repository;

import ec.edu.ucacue.allday.model.Venta;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface VentaRepository extends JpaRepository<Venta, Long> {

    @EntityGraph(attributePaths = {"detalles", "usuario"})
    List<Venta> findByFechaBetweenOrderByFechaDesc(LocalDateTime desde, LocalDateTime hasta);

    /** Las ventas anuladas no suman en los totales ni en los reportes. */
    @Query("select coalesce(sum(v.total), 0) from Venta v where v.anulada = false and v.fecha >= :desde and v.fecha < :hasta")
    BigDecimal totalEntre(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    /** [identificación, nombre, compras, total, primera compra, última compra] */
    @Query("""
        select v.clienteIdentificacion, max(v.clienteNombre), count(v), sum(v.total), min(v.fecha), max(v.fecha) from Venta v
        where v.anulada = false and v.clienteIdentificacion is not null and v.clienteIdentificacion <> '' and v.clienteIdentificacion <> '9999999999999'
        group by v.clienteIdentificacion order by max(v.fecha) desc""")
    List<Object[]> resumenClientes();

    @Query("select count(v) from Venta v where v.anulada = false and v.fecha >= :desde and v.fecha < :hasta")
    long contarEntre(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}
