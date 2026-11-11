package ec.edu.ucacue.allday.repository;

import ec.edu.ucacue.allday.model.DetalleVenta;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, Long> {

    /** [producto, cantidad total, monto total] ordenado por cantidad. */
    @Query("""
        select d.producto, sum(d.cantidad), sum(d.subtotal) from DetalleVenta d
        where d.venta.anulada = false and d.venta.fecha >= :desde and d.venta.fecha < :hasta
        group by d.producto order by sum(d.cantidad) desc""")
    List<Object[]> masVendidos(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta, Pageable page);

    @Query("""
        select d.producto.categoria.nombre, sum(d.cantidad), sum(d.subtotal) from DetalleVenta d
        where d.venta.anulada = false and d.venta.fecha >= :desde and d.venta.fecha < :hasta
        group by d.producto.categoria.nombre order by sum(d.subtotal) desc""")
    List<Object[]> porCategoria(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}
