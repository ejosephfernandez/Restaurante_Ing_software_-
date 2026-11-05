// Persistencia de la sesión en el navegador.
// El token se guarda en "siar_token" porque es la clave que ya lee services/api.js
// para enviar el header Authorization en todas las peticiones.

const CLAVE_TOKEN = "siar_token";
const CLAVE_SESION = "siar_sesion";

// Evento que dispara api.js cuando la API responde 401 (token vencido o inválido)
export const EVENTO_SESION_EXPIRADA = "siar:sesion-expirada";

export function obtenerToken() {
    try {
        return localStorage.getItem(CLAVE_TOKEN);
    } catch {
        return null;
    }
}

export function guardarSesion(token, sesion) {
    try {
        localStorage.setItem(CLAVE_TOKEN, token);
        localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
        // Si el navegador bloquea el almacenamiento, la sesión dura solo
        // mientras la pestaña esté abierta (queda en el estado de React).
    }
}

export function limpiarSesion() {
    try {
        localStorage.removeItem(CLAVE_TOKEN);
        localStorage.removeItem(CLAVE_SESION);
    } catch {
        // Nada que limpiar
    }
}

// Aviso de "sesión expirada": se guarda en sessionStorage para que el login
// lo muestre aunque la página se recargue justo después de cerrar la sesión.
const CLAVE_AVISO = "siar_aviso_sesion";

export function guardarAviso(mensaje) {
    try {
        sessionStorage.setItem(CLAVE_AVISO, mensaje);
    } catch {
        // Sin almacenamiento, el aviso queda solo en memoria
    }
}

export function leerAviso() {
    try {
        return sessionStorage.getItem(CLAVE_AVISO) || "";
    } catch {
        return "";
    }
}

export function limpiarAvisoGuardado() {
    try {
        sessionStorage.removeItem(CLAVE_AVISO);
    } catch {
        // Nada que limpiar
    }
}

export function sesionVencida(sesion) {
    if (!sesion?.expiraEn) return false;
    const vence = Date.parse(sesion.expiraEn);
    return Number.isFinite(vence) && vence <= Date.now();
}

// Devuelve la sesión guardada o null si no existe o ya venció
export function leerSesion() {
    try {
        const token = localStorage.getItem(CLAVE_TOKEN);
        const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || "null");

        if (!token || !sesion?.rol) return null;

        if (sesionVencida(sesion)) {
            limpiarSesion();
            return null;
        }

        return { ...sesion, token };
    } catch {
        limpiarSesion();
        return null;
    }
}
