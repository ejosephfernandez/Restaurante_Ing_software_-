package com.siar.presentacion.g_mesas;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.siar.negocio.g_mesas.MesaService;
import com.siar.persistencia.g_mesas.Mesa;
import com.siar.persistencia.g_mesas.Reserva;

import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("api/mesas")
public class MesaController {

    private final MesaService mesaService;

    public MesaController(MesaService mesaService) {
        this.mesaService = mesaService;
    }

    // GET: Consultar todas las mesas
    @GetMapping
    public ResponseEntity<List<Mesa>> listaMesas() {
        return ResponseEntity.ok(
                mesaService.listaMesas());
    }

    // GET: consultar mesa por ID
    @GetMapping("/{id}")
    public ResponseEntity<Mesa> getMesaPorId(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                mesaService.getMesaPorId(id));
    }

    // POST: Crear mesa
    @PostMapping
    public ResponseEntity<Mesa> crear(@RequestBody Mesa mesa) {
        Mesa creada = mesaService.crear (mesa);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    // PUT: Actualizar mesa
    @PutMapping("/{id}")
    public ResponseEntity<Mesa> actualizar(
            @PathVariable Long id, @RequestBody Mesa mesa) {
        return ResponseEntity.ok(
                mesaService.actualizar(id, mesa));

    }

    // PUT: cambiar estado de la mesa
    @PutMapping("/{id}/estado")
    public ResponseEntity<Void> cambiarEstado(
            @PathVariable Long id,
            @RequestParam String nuevoEstado) {
        mesaService.cambiarEstado(id, nuevoEstado);
        return ResponseEntity.ok().build();
    }

    // GET: verificar si la mesa está disponible
    @GetMapping("/{id}/disponible")
    public ResponseEntity<Boolean> estaDisponible(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                mesaService.estaDisponible(id));
    }
//Revisar Endpoint
    // GET: Obtener reservas de la mesa
    @GetMapping("/{id}/reservas")
    public ResponseEntity<List<Reserva>> obtenerReservas(@PathVariable Long id) {
        return ResponseEntity.ok(
                mesaService.obtenerReservas(id));
    }
}