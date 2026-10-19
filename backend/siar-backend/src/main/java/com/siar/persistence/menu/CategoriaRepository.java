package com.siar.persistence.menu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

     List<Categoria> findByActivaTrue();

    boolean existsByNombreIgnoreCase(String nombre);

    Optional<Categoria> findByNombreIgnoreCase(String nombre);

}