const API_BASE_URL = "/api";

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("siar_token");

    const headers = {
        Accept: "application/json",
        ...options.headers
    };

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    } catch {
        throw new Error(
            "No se pudo conectar con el backend. " +
            "Verifica que Spring Boot esté ejecutándose."
        );
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

        throw new Error(
            detalle || `Error HTTP ${response.status}`
        );
    }

    return datos;
}