import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { authService } from "../services/authService.js";
import {
    EVENTO_SESION_EXPIRADA,
    guardarAviso,
    guardarSesion,
    leerAviso,
    leerSesion,
    limpiarAvisoGuardado,
    limpiarSesion
} from "../sesionStorage.js";

const AuthContext = createContext(null);

// Mensaje que se muestra en el login cuando la sesión terminó sin que el usuario la cerrara
const AVISO_SESION_EXPIRADA = "Tu sesión expiró. Inicia sesión nuevamente.";

export function AuthProvider({ children }) {
    const [sesion, setSesion] = useState(leerSesion);
    const [aviso, setAviso] = useState(leerAviso);

    const expirar = useCallback(() => {
        limpiarSesion();
        guardarAviso(AVISO_SESION_EXPIRADA);
        setSesion(null);
        setAviso(AVISO_SESION_EXPIRADA);
    }, []);

    const limpiarAviso = useCallback(() => {
        limpiarAvisoGuardado();
        setAviso("");
    }, []);

    // api.js avisa cuando la API rechaza el token (401)
    useEffect(() => {
        window.addEventListener(EVENTO_SESION_EXPIRADA, expirar);
        return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, expirar);
    }, [expirar]);

    // Cierra la sesión automáticamente cuando el token llega a su vencimiento
    useEffect(() => {
        if (!sesion?.expiraEn) return undefined;

        const restante = Date.parse(sesion.expiraEn) - Date.now();
        if (!Number.isFinite(restante)) return undefined;

        // setTimeout admite como máximo ~24,8 días
        const espera = Math.min(Math.max(restante, 0), 2_147_000_000);
        const temporizador = window.setTimeout(expirar, espera);

        return () => window.clearTimeout(temporizador);
    }, [sesion, expirar]);

    const login = useCallback(async (usuario, contrasena) => {
        const respuesta = await authService.login(usuario, contrasena);

        const nuevaSesion = {
            idUsuario: respuesta.idUsuario,
            nombre: respuesta.nombre,
            usuario: respuesta.usuario,
            rol: respuesta.rol,
            permisos: respuesta.permisos ?? [],
            expiraEn: respuesta.expiraEn
        };

        guardarSesion(respuesta.token, nuevaSesion);
        limpiarAviso();
        setSesion({ ...nuevaSesion, token: respuesta.token });

        return nuevaSesion;
    }, [limpiarAviso]);

    const logout = useCallback(() => {
        limpiarSesion();
        limpiarAviso();
        setSesion(null);
    }, [limpiarAviso]);

    const valor = useMemo(() => ({
        sesion,
        rol: sesion?.rol ?? null,
        autenticado: Boolean(sesion),
        aviso,
        limpiarAviso,
        login,
        logout
    }), [sesion, aviso, limpiarAviso, login, logout]);

    return (
        <AuthContext.Provider value={valor}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const contexto = useContext(AuthContext);

    if (!contexto) {
        throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
    }

    return contexto;
}
