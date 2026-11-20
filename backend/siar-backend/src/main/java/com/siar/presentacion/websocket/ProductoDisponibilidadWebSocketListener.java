package com.siar.presentacion.websocket;

import com.siar.negocio.menu.eventos.ProductoDisponibilidadCambiadaEvent;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class ProductoDisponibilidadWebSocketListener {

    private static final String DESTINO =
            "/topic/productos/disponibilidad";

    private final SimpMessagingTemplate messagingTemplate;

    public ProductoDisponibilidadWebSocketListener(
            SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void notificar(
            ProductoDisponibilidadCambiadaEvent evento) {

        messagingTemplate.convertAndSend(
                DESTINO,
                evento
        );
    }
}
