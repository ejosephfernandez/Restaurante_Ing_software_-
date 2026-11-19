
import { Client } from "@stomp/stompjs";

export function probarWebSocket(
    token,
    destino = "/topic/productos/disponibilidad"
) {
    const protocolo =
        window.location.protocol === "https:" ? "wss" : "ws";

    const cliente = new Client({
        brokerURL: `${protocolo}://${window.location.hostname}:8080/ws`,

        connectHeaders: token
            ? { Authorization: `Bearer ${token}` }
            : {},

        reconnectDelay: 0,

        debug: (mensaje) => {
            if (mensaje.includes("Authorization:")) {
                console.log("[STOMP] Encabezado de autenticación recibido.");
                return;
            }

            console.log("[STOMP]", mensaje);
        },

        onConnect: () => {
            console.log("✅ Conexión STOMP autenticada.");

            console.log("Suscribiéndose a:", destino);

            cliente.subscribe(destino, (mensaje) => {
                console.log("📩 Mensaje recibido:", mensaje.body);

                try {
                    console.log(JSON.parse(mensaje.body));
                } catch {
                    console.log("El mensaje no contiene JSON válido.");
                }
            });

            console.log("✅ Suscripción enviada.");
        },

        onStompError: (frame) => {
            console.error("❌ Error STOMP:", frame.headers.message);
            console.error(frame.body);
        },

        onWebSocketError: (error) => {
            console.error("❌ Error WebSocket:", error);
        },

        onWebSocketClose: (evento) => {
            console.warn(
                "Conexión WebSocket cerrada:",
                evento.code,
                evento.reason
            );
        }
    });

    cliente.activate();

    return cliente;
}
