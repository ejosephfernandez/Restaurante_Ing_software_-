package com.siar.persistencia.mesas;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MesaRepository extends JpaRepository<Mesa, Long> {

    List<Mesa> findByEstado(String estado);

    boolean existsByNumero(Integer numero);

    Optional<Mesa> findByNumero(int numero);

}
