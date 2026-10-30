package com.siar.presentacion;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

// Respuestas de error JSON uniformes para toda la API, con el mismo formato
// que usa la seguridad (RespuestaErrorSeguridad): {estado, error, mensaje}.
@RestControllerAdvice
public class ManejadorErrores {

    // Errores de negocio lanzados con ResponseStatusException (404, 409, 400...)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> estadoHttp(ResponseStatusException ex) {
        return respuesta(ex.getStatusCode(), ex.getReason());
    }

    // Validaciones @Valid de los cuerpos de las peticiones
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validacion(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return respuesta(HttpStatus.BAD_REQUEST, mensaje);
    }

    // JSON mal formado o valor invalido en un enum (ej. metodo de pago inexistente)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> cuerpoInvalido(HttpMessageNotReadableException ex) {
        return respuesta(HttpStatus.BAD_REQUEST, "El cuerpo de la peticion no es valido");
    }

    // Parametro de URL con tipo invalido (ej. estado=XYZ o id=abc)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> parametroInvalido(MethodArgumentTypeMismatchException ex) {
        return respuesta(HttpStatus.BAD_REQUEST,
                "Valor invalido para el parametro '" + ex.getName() + "': " + ex.getValue());
    }

    private ResponseEntity<Map<String, Object>> respuesta(HttpStatusCode codigo, String mensaje) {
        HttpStatus estado = HttpStatus.resolve(codigo.value());

        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("estado", codigo.value());
        cuerpo.put("error", estado != null ? estado.getReasonPhrase() : "Error");
        cuerpo.put("mensaje", mensaje);

        return ResponseEntity.status(codigo).body(cuerpo);
    }
}
