package com.siar.negocio.menu;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.siar.persistencia.menu.Categoria;
import com.siar.persistencia.menu.CategoriaRepository;
import com.siar.persistencia.menu.Producto;
import com.siar.persistencia.menu.ProductoRepository;

@Service 
@Transactional(readOnly = true)
public class ProductoService {
    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    public ProductoService (ProductoRepository productoRepository, CategoriaRepository categoriaRepository){
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
    }

    // Consultar todos los productos.
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    // Consultar productos activos.
    public List<Producto> listarActivos() {
        return productoRepository.findByActivoTrue();
    }

    // Consultar productos activos y disponibles.
    public List<Producto> listarDisponibles() {
        return productoRepository
                .findByDisponibleTrueAndActivoTrue();
    }

    // Consultar un producto por su identificador.
    public Producto obtenerPorId(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No existe el producto con ID: " + id
                ));
    }

    // Consultar productos de una categoría.
    public List<Producto> listarPorCategoria(Long idCategoria) {
        if (!categoriaRepository.existsById(idCategoria)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No existe la categoría con ID: " + idCategoria
            );
        }

        return productoRepository
                .findByCategoria_IdCategoria(idCategoria);
    }

    // Crear producto.
    @Transactional
    public Producto crear(Producto datos) {
        validarDatos(datos);

        Categoria categoria =
                obtenerCategoriaActiva(datos.getCategoria());

        Producto producto = new Producto();
        producto.setNombre(datos.getNombre().trim());
        producto.setDescripcion(datos.getDescripcion());
        producto.setPrecio(datos.getPrecio());
        producto.setImagen(datos.getImagen());
        producto.setCategoria(categoria);

        producto.setActivo(
                datos.getActivo() == null || datos.getActivo()
        );

        producto.setDisponible(
                producto.getActivo()
                        && (datos.getDisponible() == null
                        || datos.getDisponible())
        );

        return productoRepository.save(producto);
    }

     // Actualizar producto.
    @Transactional
    public Producto actualizar(Long id, Producto datos) {
        validarDatos(datos);

        Producto existente = obtenerPorId(id);
        Categoria categoria =
                obtenerCategoriaActiva(datos.getCategoria());

        existente.setNombre(datos.getNombre().trim());
        existente.setDescripcion(datos.getDescripcion());
        existente.setPrecio(datos.getPrecio());
        existente.setImagen(datos.getImagen());
        existente.setCategoria(categoria);

        if (datos.getActivo() != null) {
            existente.setActivo(datos.getActivo());
        }

        if (datos.getDisponible() != null) {
            existente.setDisponible(datos.getDisponible());
        }

        // Un producto inactivo no puede estar disponible.
        if (!Boolean.TRUE.equals(existente.getActivo())) {
            existente.setDisponible(false);
        }

        return productoRepository.save(existente);
    }

    // Cambiar disponibilidad de un producto.
    @Transactional
    public Producto cambiarDisponibilidad(
            Long id, boolean disponible) {

        Producto producto = obtenerPorId(id);

        if (disponible
                && !Boolean.TRUE.equals(producto.getActivo())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede habilitar un producto inactivo"
            );
        }

        producto.setDisponible(disponible);

        return productoRepository.save(producto);
    }

    // Desactivación lógica.
    @Transactional
    public void desactivar(Long id) {
        Producto producto = obtenerPorId(id);

        producto.setActivo(false);
        producto.setDisponible(false);

        productoRepository.save(producto);
    }

    private void validarDatos(Producto producto) {
        if (producto == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe proporcionar los datos del producto"
            );
        }

        if (producto.getNombre() == null
                || producto.getNombre().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre del producto es obligatorio"
            );
        }

        if (producto.getPrecio() == null
                || producto.getPrecio()
                    .compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El precio debe ser mayor que cero"
            );
        }

        if (producto.getCategoria() == null
                || producto.getCategoria().getIdCategoria() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe seleccionar una categoría"
            );
        }
    }

    private Categoria obtenerCategoriaActiva(Categoria referencia) {
        Long idCategoria = referencia.getIdCategoria();

        Categoria categoria = categoriaRepository.findById(idCategoria)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No existe la categoría seleccionada"
                ));

        if (!Boolean.TRUE.equals(categoria.getActiva())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede asociar el producto a una categoría inactiva"
            );
        }

        return categoria;
    }

}
