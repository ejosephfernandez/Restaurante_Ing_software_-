import {
    EVENTO_SESION_EXPIRADA,
    limpiarSesion,
    obtenerToken
} from "../features/auth/sesionStorage.js";

const API_BASE_URL = "/api";

// options.autenticado = false: no envía el token (lo usa el login, porque un
// token viejo o inválido haría que Spring Security rechace la petición).
export async function apiRequest(endpoint, options = {}) {
    const { autenticado = true, ...opcionesFetch } = options;
    const token = autenticado ? obtenerToken() : null;

    const headers = {
        Accept: "application/json",
        ...opcionesFetch.headers
    };

    if (opcionesFetch.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...opcionesFetch,
            headers
        });
    } catch {
        throw new Error(
            "No se pudo conectar con el backend. " +
            "Verifica que Spring Boot esté ejecutándose."
        );
    }

    // Token vencido o inválido: se cierra la sesión y AuthContext
    // redirige al login. Solo si el token rechazado sigue siendo el guardado:
    // así una respuesta tardía no cierra una sesión nueva.
    if (response.status === 401 && token && obtenerToken() === token) {
        limpiarSesion();
        window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }

    // Manejar respuestas sin contenido
    if (response.status === 204) {
        return null;
    }

    const texto = await response.text();
    let datos = null;

    if (texto) {
        try {
            datos = JSON.parse(texto);
        } catch {
            datos = texto;
        }
    }

    if (!response.ok) {
        const detalle =
            typeof datos === "object" && datos !== null
                ? datos.mensaje ||
                  datos.message ||
                  datos.error ||
                  datos.detail
                : datos;

        const error = new Error(
            detalle || `Error HTTP ${response.status}`
        );
        error.status = response.status;
        throw error;
    }

    return datos;
}
