package com.siar.presentacion.menu;

import com.siar.negocio.menu.CategoriaService;
import com.siar.persistencia.menu.Categoria;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {
    
    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    // GET: consultar todas las categorias
    @GetMapping
    public ResponseEntity<List<Categoria>> listarTodas() {
        return ResponseEntity.ok(
                categoriaService.listarTodas()
        );
    }

    // GET: consultar categorias activas
    @GetMapping("/activas")
    public ResponseEntity<List<Categoria>> listarActivas() {
        return ResponseEntity.ok(
                categoriaService.listarActivas()
        );
    }

    // GET: consultar categoria por ID
    @GetMapping("/{id}")
    public ResponseEntity<Categoria> obtenerPorId(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                categoriaService.obtenerPorId(id)
        );
    }

    // POST: crear categoria
    @PostMapping
    public ResponseEntity<Categoria> crear(
            @RequestBody Categoria categoria) {

        Categoria creada = categoriaService.crear(categoria);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creada);
    }

    // PUT: actualizar categoria
    @PutMapping("/{id}")
    public ResponseEntity<Categoria> actualizar(
            @PathVariable Long id,
            @RequestBody Categoria categoria) {

        return ResponseEntity.ok(
                categoriaService.actualizar(id, categoria)
        );
    }

    // DELETE: desactivar categoria sin borrarla de MySQL
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(
            @PathVariable Long id) {

        categoriaService.desactivar(id);

        return ResponseEntity.noContent().build();
    }
}
