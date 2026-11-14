import { useAuth } from "../../features/auth/context/AuthContext.jsx";
import { iniciales, nombreRol } from "../../config/roles.js";

// Bloque de perfil de la barra superior de cada página (avatar, nombre y rol
// del usuario que inició sesión). Usa los estilos .profile-block de components.css.
export default function UsuarioActual() {
    const { sesion } = useAuth();

    if (!sesion) return null;

    return (
        <div className="profile-block">
            <div className="avatar">{iniciales(sesion.nombre)}</div>
            <div className="profile-details">
                <strong>{sesion.nombre}</strong>
                <small>{nombreRol(sesion.rol)}</small>
            </div>
        </div>
    );
}
