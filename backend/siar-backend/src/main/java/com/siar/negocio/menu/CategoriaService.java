package com.siar.negocio.menu;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siar.persistencia.menu.Categoria;
import com.siar.persistencia.menu.CategoriaRepository;

import java.util.List;

@Service //permite que Spring gestione esta clase.
@Transactional(readOnly = true) //dministra las transacciones y readOnly = true marca por defecto las operaciones de consulta; los métodos de escritura sobrescriben esa configuración.
public class CategoriaService {
    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    // Consultar todas las categorias
    public List<Categoria> listarTodas() {
        return categoriaRepository.findAll();
    }

      // Consultar solamente las categorias activas
    public List<Categoria> listarActivas() {
        return categoriaRepository.findByActivaTrue();
    }

    // Buscar una categoria por su identificador
    public Categoria obtenerPorId(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "No existe la categoria con ID: " + id
                        )
                );
    }

    // Crear una categoria
    @Transactional //administra las transacciones
    public Categoria crear(Categoria categoria) {
        validarNombre(categoria.getNombre());

        if (categoriaRepository.existsByNombreIgnoreCase(
                categoria.getNombre().trim())) {
            throw new IllegalStateException(
                    "Ya existe una categoria con ese nombre"
            );
        }

        categoria.setIdCategoria(null);
        categoria.setNombre(categoria.getNombre().trim());

        if (categoria.getActiva() == null) {
            categoria.setActiva(true);
        }

        return categoriaRepository.save(categoria);
    }

    // Actualizar una categoria existente
    @Transactional
    public Categoria actualizar(Long id, Categoria datos) {
        Categoria existente = obtenerPorId(id);

        validarNombre(datos.getNombre());

        String nombreNuevo = datos.getNombre().trim();

        categoriaRepository.findByNombreIgnoreCase(nombreNuevo)
                .ifPresent(categoria -> {
                    if (!categoria.getIdCategoria().equals(id)) {
                        throw new IllegalStateException(
                                "Ya existe otra categoria con ese nombre"
                        );
                    }
                });

        existente.setNombre(nombreNuevo);

        if (datos.getActiva() != null) {
            existente.setActiva(datos.getActiva());
        }

        return categoriaRepository.save(existente);
    }

    // Desactivar sin eliminar fisicamente la categoria
    @Transactional
    public void desactivar(Long id) {
        Categoria categoria = obtenerPorId(id);
        categoria.setActiva(false);
        categoriaRepository.save(categoria);
    }

    private void validarNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException(
                    "El nombre de la categoria es obligatorio"
            );
        }
    }
}
