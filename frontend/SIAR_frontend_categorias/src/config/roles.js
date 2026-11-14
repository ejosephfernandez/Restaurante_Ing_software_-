// Acceso a las secciones del panel según el rol del usuario.
// Está alineado con las reglas del backend (SecurityConfig): si un rol no puede
// operar un módulo, la sección no se le muestra.
// Para habilitar una sección nueva: agregarla en SECCIONES y en App.jsx.

export const ROLES = {
    ADMINISTRADOR: "ADMINISTRADOR",
    CAJERO: "CAJERO",
    MESERO: "MESERO",
    COCINERO: "COCINERO"
};

export const NOMBRE_ROL = {
    ADMINISTRADOR: "Administrador",
    CAJERO: "Cajero",
    MESERO: "Mesero",
    COCINERO: "Cocinero"
};

const { ADMINISTRADOR, CAJERO, MESERO, COCINERO } = ROLES;

export const SECCIONES = {
    pedidos: { ruta: "/pedidos", roles: [ADMINISTRADOR, MESERO, COCINERO, CAJERO] },
    productos: { ruta: "/productos", roles: [ADMINISTRADOR, COCINERO] },
    categorias: { ruta: "/categorias", roles: [ADMINISTRADOR] },
    mesas: { ruta: "/mesas", roles: [ADMINISTRADOR, MESERO] },
    reservas: { ruta: "/mesas/reservas", roles: [ADMINISTRADOR, MESERO, CAJERO] }
};

// Primera pantalla de cada rol al iniciar sesión
const INICIO_POR_ROL = {
    ADMINISTRADOR: "/pedidos",
    MESERO: "/pedidos",
    COCINERO: "/pedidos",
    CAJERO: "/pedidos"
};

export function puedeAcceder(rol, seccion) {
    return Boolean(rol && SECCIONES[seccion]?.roles.includes(rol));
}

// Indica si el rol puede abrir una ruta (se usa para volver a la ruta
// que el usuario intentaba abrir antes de iniciar sesión)
export function puedeAccederRuta(rol, ruta) {
    return Object.values(SECCIONES).some(
        (seccion) => seccion.ruta === ruta && seccion.roles.includes(rol)
    );
}

export function rutaInicio(rol) {
    return INICIO_POR_ROL[rol] ?? "/pedidos";
}

export function nombreRol(rol) {
    return NOMBRE_ROL[rol] ?? rol ?? "";
}

// "Mesero Prueba" -> "MP"
export function iniciales(nombre) {
    const partes = String(nombre || "").trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return "?";
    const letras = partes.length === 1
        ? partes[0].slice(0, 2)
        : partes[0][0] + partes[partes.length - 1][0];
    return letras.toUpperCase();
}
