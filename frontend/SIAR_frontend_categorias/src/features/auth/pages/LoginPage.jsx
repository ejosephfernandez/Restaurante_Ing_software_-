import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SiarIcon from "../../../components/ui/SiarIcon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { puedeAccederRuta, rutaInicio } from "../../../config/roles.js";
import "../../../styles/login.css";

const MODULOS = [
    { icon: "clipboard", titulo: "Pedidos y cocina", texto: "Comandas digitales del salón a la cocina." },
    { icon: "table", titulo: "Mesas y reservas", texto: "Ocupación del salón en tiempo real." },
    { icon: "receipt", titulo: "Facturación", texto: "Cobros, pagos mixtos y comprobantes." }
];

// Traduce los mensajes del backend a textos para el usuario
function mensajeDeError(error) {
    const texto = String(error?.message || "");

    if (error?.status === 401 && /inactivo/i.test(texto)) {
        return "Tu usuario está inactivo. Comunícate con el administrador.";
    }
    if (error?.status === 401) {
        return "Usuario o contraseña incorrectos.";
    }
    if (error?.status === 400) {
        return "Escribe tu usuario y tu contraseña.";
    }
    return texto || "No fue posible iniciar sesión. Intenta de nuevo.";
}

export default function LoginPage() {
    const { login, aviso, limpiarAviso } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [usuario, setUsuario] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [verContrasena, setVerContrasena] = useState(false);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    async function iniciarSesion(evento) {
        evento.preventDefault();
        limpiarAviso();

        if (!usuario.trim() || !contrasena) {
            setError("Escribe tu usuario y tu contraseña.");
            return;
        }

        setError("");
        setCargando(true);

        try {
            const sesion = await login(usuario.trim(), contrasena);

            // Vuelve a la ruta que se intentaba abrir, si el rol tiene acceso
            const desde = location.state?.desde;
            const destino = desde && puedeAccederRuta(sesion.rol, desde)
                ? desde
                : rutaInicio(sesion.rol);

            navigate(destino, { replace: true });
        } catch (err) {
            setError(mensajeDeError(err));
            setCargando(false);
        }
    }

    return (
        <div className="login-page">
            <aside className="login-brand-panel">
                <div className="login-brand">
                    <div className="login-logo">✣</div>
                    <div>
                        <h1>SIAR</h1>
                        <p>Sistema Integral de Administración de Restaurantes</p>
                    </div>
                </div>

                <div className="login-brand-copy">
                    <h2>Todo tu restaurante, conectado.</h2>
                    <p>Salón, cocina y caja trabajando sobre la misma información.</p>
                </div>

                <ul className="login-modules">
                    {MODULOS.map((modulo) => (
                        <li key={modulo.titulo}>
                            <span className="login-module-icon">
                                <SiarIcon name={modulo.icon} size="md" />
                            </span>
                            <div>
                                <strong>{modulo.titulo}</strong>
                                <span>{modulo.texto}</span>
                            </div>
                        </li>
                    ))}
                </ul>

                <footer className="login-brand-footer">
                    SIAR © Sistema Integral de Administración para Restaurantes
                </footer>
            </aside>

            <main className="login-form-panel">
                <section className="login-card" aria-labelledby="login-title">
                    <div className="login-card-mobile-brand">
                        <div className="login-logo">✣</div>
                        <strong>SIAR</strong>
                    </div>

                    <span className="eyebrow">BIENVENIDO</span>
                    <h2 id="login-title">Inicia sesión</h2>
                    <p className="login-subtitle">
                        Ingresa con tu usuario o correo para acceder al panel.
                    </p>

                    {aviso && !error && (
                        <div className="login-alert login-alert-info" role="status">
                            <SiarIcon name="warning" size="sm" />
                            <span>{aviso}</span>
                        </div>
                    )}

                    {error && (
                        <div className="login-alert login-alert-error" role="alert">
                            <SiarIcon name="warning" size="sm" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={iniciarSesion} noValidate>
                        <label className="field-label" htmlFor="login-usuario">
                            Usuario o correo <span>*</span>
                        </label>
                        <div className="login-input">
                            <SiarIcon name="user" size="sm" />
                            <input
                                id="login-usuario"
                                className="text-input"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                placeholder="Ej. mesero o mesero@siar.local"
                                autoComplete="username"
                                autoFocus
                                disabled={cargando}
                            />
                        </div>

                        <label className="field-label" htmlFor="login-contrasena">
                            Contraseña <span>*</span>
                        </label>
                        <div className="login-input">
                            <SiarIcon name="lock" size="sm" />
                            <input
                                id="login-contrasena"
                                className="text-input"
                                type={verContrasena ? "text" : "password"}
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                placeholder="Tu contraseña"
                                autoComplete="current-password"
                                disabled={cargando}
                            />
                            <button
                                type="button"
                                className="login-toggle-password"
                                onClick={() => setVerContrasena((ver) => !ver)}
                                aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                                title={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                <SiarIcon name={verContrasena ? "eyeOff" : "eye"} size="sm" />
                            </button>
                        </div>

                        <button
                            className="button button-primary login-submit"
                            type="submit"
                            disabled={cargando}
                        >
                            {cargando ? <span className="spinner" /> : <SiarIcon name="arrowRight" size="sm" />}
                            {cargando ? "Ingresando…" : "Ingresar"}
                        </button>
                    </form>

                    <p className="login-help">
                        ¿Olvidaste tu contraseña? Comunícate con el administrador del sistema.
                    </p>
                </section>
            </main>
        </div>
    );
}
