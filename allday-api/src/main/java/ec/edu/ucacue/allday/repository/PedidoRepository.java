package ec.edu.ucacue.allday.repository;

import ec.edu.ucacue.allday.model.EstadoPedido;
import ec.edu.ucacue.allday.model.Pedido;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    @EntityGraph(attributePaths = {"historial"})
    Optional<Pedido> findByCodigoIgnoreCase(String codigo);
    List<Pedido> findByEstadoInOrderByFechaEntregaAscIdAsc(Collection<EstadoPedido> estados);
    long countByEstadoIn(Collection<EstadoPedido> estados);
    long countByCreadoEnBetween(java.time.LocalDateTime desde, java.time.LocalDateTime hasta);
    List<Pedido> findTop6ByOrderByCreadoEnDesc();
    List<Pedido> findTop20ByEstadoOrderByIdDesc(EstadoPedido estado);

    /** [cliente, número de pedidos, último pedido] */
    @org.springframework.data.jpa.repository.Query("select p.cliente, count(p), max(p.creadoEn) from Pedido p group by p.cliente order by max(p.creadoEn) desc")
    List<Object[]> resumenClientes();
}
