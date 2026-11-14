import { Navigate } from "react-router-dom";

import { useAuth } from "../features/auth/context/AuthContext.jsx";
import { rutaInicio } from "../config/roles.js";

// Pantallas solo para usuarios sin sesión (login): si ya hay sesión,
// se envía al inicio de su rol.
export default function RutaPublica({ children }) {
    const { sesion } = useAuth();

    if (sesion) {
        return <Navigate to={rutaInicio(sesion.rol)} replace />;
    }

    return children;
}
