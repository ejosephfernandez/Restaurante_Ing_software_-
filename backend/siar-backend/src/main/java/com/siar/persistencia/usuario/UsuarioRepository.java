package com.siar.persistencia.usuario;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Carga el rol y sus permisos en la misma consulta (open-in-view esta desactivado)
    @EntityGraph(attributePaths = {"rol", "rol.permisos"})
    Optional<Usuario> findByUsuarioIgnoreCaseOrCorreoIgnoreCase(String usuario, String correo);
}
