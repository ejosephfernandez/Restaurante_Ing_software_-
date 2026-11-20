import { Client } from "@stomp/stompjs";

const DESTINO_DISPONIBILIDAD = "/topic/productos/disponibilidad";

function obtenerBrokerUrl() {
    const urlConfigurada = import.meta.env.VITE_WS_URL;

    if (urlConfigurada) {
        return urlConfigurada;
    }

    const protocolo = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocolo}://${window.location.host}/ws`;
}

/**
 * Abre una conexión STOMP autenticada y escucha los cambios de disponibilidad.
 *
 * @param {string} token JWT de la sesión SIAR.
 * @param {(evento: {idProducto: number, disponible: boolean}) => void | Promise<void>} onEvento
 *        Función que recibe cada cambio confirmado por el backend.
 * @returns {() => void} Función para cerrar la conexión y liberar recursos.
 */
export function suscribirDisponibilidadProductos(token, onEvento) {
    if (!token || typeof onEvento !== "function") {
        return () => {};
    }

    const cliente = new Client({
        brokerURL: obtenerBrokerUrl(),
        connectHeaders: {
            Authorization: `Bearer ${token}`
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        // Evita imprimir encabezados STOMP y el JWT en la consola.
        debug: () => {}
    });

    cliente.onConnect = () => {
        // STOMP vuelve a ejecutar onConnect después de una reconexión,
        // por lo que la suscripción se restaura automáticamente.
        cliente.subscribe(DESTINO_DISPONIBILIDAD, (mensaje) => {
            try {
                const evento = JSON.parse(mensaje.body);

                const idProducto = Number(evento?.idProducto);
                if (!Number.isInteger(idProducto) || idProducto <= 0) {
                    return;
                }

                if (typeof evento.disponible !== "boolean") {
                    return;
                }

                Promise.resolve(
                    onEvento({
                        idProducto,
                        disponible: evento.disponible
                    })
                ).catch((error) => {
                    console.error(
                        "No fue posible procesar el cambio de disponibilidad:",
                        error
                    );
                });
            } catch (error) {
                console.error(
                    "Se recibió un mensaje inválido de disponibilidad:",
                    error
                );
            }
        });
    };

    cliente.onStompError = (frame) => {
        console.error(
            "Error STOMP en la conexión de disponibilidad:",
            frame.headers?.message || "Error del broker"
        );
    };

    cliente.onWebSocketError = () => {
        console.error(
            "No fue posible establecer la conexión WebSocket de disponibilidad."
        );
    };

    cliente.activate();

    return () => {
        // deactivate devuelve una promesa; no bloqueamos el cleanup de React.
        void cliente.deactivate().catch((error) => {
            console.error("Error al cerrar la conexión WebSocket:", error);
        });
    };
}
