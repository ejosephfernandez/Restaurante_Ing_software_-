import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../features/auth/context/AuthContext.jsx";
import { puedeAcceder, rutaInicio } from "../config/roles.js";

// Sin sesión: redirige al login recordando la ruta que se intentaba abrir.
// Con "seccion": si el rol no tiene acceso, lo lleva a su pantalla de inicio.
export default function RutaProtegida({ seccion, children }) {
    const { sesion } = useAuth();
    const location = useLocation();

    if (!sesion) {
        return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
    }

    if (seccion && !puedeAcceder(sesion.rol, seccion)) {
        return <Navigate to={rutaInicio(sesion.rol)} replace />;
    }

    return children ?? <Outlet />;
}
