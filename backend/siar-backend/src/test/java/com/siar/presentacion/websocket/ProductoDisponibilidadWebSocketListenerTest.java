package com.siar.presentacion.websocket;

import com.siar.negocio.menu.eventos.ProductoDisponibilidadCambiadaEvent;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@SpringBootTest
class ProductoDisponibilidadWebSocketListenerTest {

    private static final String DESTINO =
            "/topic/productos/disponibilidad";

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    @Test
    void noDebeNotificarCuandoLaTransaccionSeRevierte() {

        TransactionTemplate transaction =
                new TransactionTemplate(transactionManager);

        transaction.executeWithoutResult(status -> {

            eventPublisher.publishEvent(
                    new ProductoDisponibilidadCambiadaEvent(
                            8L,
                            false
                    )
            );

            // Simulamos que la operación termina en rollback.
            status.setRollbackOnly();
        });

        // El listener AFTER_COMMIT no debe publicar el mensaje.
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void debeNotificarCuandoLaTransaccionSeConfirma() {

        TransactionTemplate transaction =
                new TransactionTemplate(transactionManager);

        transaction.executeWithoutResult(status -> {

            eventPublisher.publishEvent(
                    new ProductoDisponibilidadCambiadaEvent(
                            8L,
                            false
                    )
            );
        });

        // Después del commit, el listener debe publicar el evento.
        verify(messagingTemplate).convertAndSend(
                eq(DESTINO),
                any(ProductoDisponibilidadCambiadaEvent.class)
        );
    }
}