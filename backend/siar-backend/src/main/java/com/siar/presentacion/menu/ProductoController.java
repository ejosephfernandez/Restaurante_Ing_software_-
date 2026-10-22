package com.siar.presentacion.menu;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siar.negocio.menu.ProductoService;
import com.siar.persistencia.menu.Producto;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {
    
    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    // GET /api/productos
    @GetMapping
    public ResponseEntity<List<Producto>> listarTodos() {
        return ResponseEntity.ok(
                productoService.listarTodos()
        );
    }

    // GET /api/productos/activos
    @GetMapping("/activos")
    public ResponseEntity<List<Producto>> listarActivos() {
        return ResponseEntity.ok(
                productoService.listarActivos()
        );
    }

    // GET /api/productos/disponibles
    @GetMapping("/disponibles")
    public ResponseEntity<List<Producto>> listarDisponibles() {
        return ResponseEntity.ok(
                productoService.listarDisponibles()
        );
    }

    // GET /api/productos/categoria/1
    @GetMapping("/categoria/{idCategoria}")
    public ResponseEntity<List<Producto>> listarPorCategoria(
            @PathVariable Long idCategoria) {

        return ResponseEntity.ok(
                productoService.listarPorCategoria(idCategoria)
        );
    }

    // GET /api/productos/1
    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerPorId(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                productoService.obtenerPorId(id)
        );
    }

    // POST /api/productos
    @PostMapping
    public ResponseEntity<Producto> crear(
            @RequestBody Producto producto) {

        Producto creado = productoService.crear(producto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creado);
    }

    // PUT /api/productos/1
    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizar(
            @PathVariable Long id,
            @RequestBody Producto producto) {

        return ResponseEntity.ok(
                productoService.actualizar(id, producto)
        );
    }

    // PATCH /api/productos/1/disponibilidad?disponible=false
    @PatchMapping("/{id}/disponibilidad")
    public ResponseEntity<Producto> cambiarDisponibilidad(
            @PathVariable Long id,
            @RequestParam boolean disponible) {

        return ResponseEntity.ok(
                productoService.cambiarDisponibilidad(id, disponible)
        );
    }

    // DELETE /api/productos/1
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(
            @PathVariable Long id) {

        productoService.desactivar(id);

        return ResponseEntity.noContent().build();
    }
}
