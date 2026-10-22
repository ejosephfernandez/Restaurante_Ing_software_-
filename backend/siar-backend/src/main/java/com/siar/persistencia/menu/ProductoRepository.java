package com.siar.persistencia.menu;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;


public interface ProductoRepository extends JpaRepository<Producto, Long> {

    // Consultar todos los productos incluyendo su categoría
    @Override
    @EntityGraph(attributePaths = {"categoria"})
    List<Producto> findAll();

    // Consultar un producto por ID incluyendo su categoría
    @Override
    @EntityGraph(attributePaths = {"categoria"})
    Optional<Producto> findById(Long id);

    // Consultar productos activos incluyendo su categoría
    @EntityGraph(attributePaths = {"categoria"})
    List<Producto> findByActivoTrue();

    // Consultar productos disponibles incluyendo su categoría
    @EntityGraph(attributePaths = {"categoria"})
    List<Producto> findByDisponibleTrueAndActivoTrue();

    // Consultar productos por categoría
    @EntityGraph(attributePaths = {"categoria"})
    List<Producto> findByCategoria_IdCategoria(Long idCategoria);

}
