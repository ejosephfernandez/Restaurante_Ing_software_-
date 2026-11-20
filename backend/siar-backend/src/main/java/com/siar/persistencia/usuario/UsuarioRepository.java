package com.siar.persistencia.usuario;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Carga el rol y sus permisos en la misma consulta (open-in-view esta desactivado)
    @EntityGraph(attributePaths = {"rol", "rol.permisos"})
    Optional<Usuario> findByUsuarioIgnoreCaseOrCorreoIgnoreCase(String usuario, String correo);

    // Gestion de usuarios (HU01-HU04): listado con el rol en la misma consulta
    @EntityGraph(attributePaths = {"rol"})
    List<Usuario> findAllByOrderByNombreAsc();

    // Unicidad de usuario y correo (uq_usuario_login, uq_usuario_correo)
    boolean existsByUsuarioIgnoreCase(String usuario);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByUsuarioIgnoreCaseAndIdUsuarioNot(String usuario, Long idUsuario);

    boolean existsByCorreoIgnoreCaseAndIdUsuarioNot(String correo, Long idUsuario);
}
