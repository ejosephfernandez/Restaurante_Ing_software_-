package com.siar.presentacion.mesas;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siar.negocio.mesas.ReservaService;
import com.siar.persistencia.mesas.Reserva;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    // Inyección de dependencias por constructor
    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

   
    // MÉTODOS CRUD BÁSICOS

    // GET: Listar todas las reservas
    @GetMapping
    public ResponseEntity<List<Reserva>> listarTodas() {
        return ResponseEntity.ok(reservaService.listarTodas());
    }

    // GET: Obtener una reserva por ID
    @GetMapping("/{id}")
    public ResponseEntity<Reserva> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(reservaService.obtenerPorId(id));
    }

    // POST: Crear una nueva reserva
    @PostMapping
    public ResponseEntity<Reserva> crear(@RequestBody Reserva reserva) {
        Reserva nuevaReserva = reservaService.crear(reserva);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevaReserva);
    }

    // DELETE: Eliminar una reserva
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        reservaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // MÉTODOS DEL DIAGRAMA DE CLASES

    // PUT: Confirmar una reserva (del diagrama)
    @PutMapping("/{id}/confirmar")
    public ResponseEntity<Void> confirmar(@PathVariable Long id) {
        reservaService.confirmar(id);
        return ResponseEntity.ok().build();
    }

    // PUT: Cancelar una reserva (del diagrama)
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Void> cancelar(@PathVariable Long id) {
        reservaService.cancelar(id);
        return ResponseEntity.ok().build();
    }

    // PUT: Actualizar los datos de la reserva (del diagrama)
    @PutMapping("/{id}")
    public ResponseEntity<Reserva> actualizarDatos(@PathVariable Long id, @RequestBody Reserva reserva) {
        Reserva reservaActualizada = reservaService.actualizarDatos(id, reserva);
        return ResponseEntity.ok(reservaActualizada);
    }
}
