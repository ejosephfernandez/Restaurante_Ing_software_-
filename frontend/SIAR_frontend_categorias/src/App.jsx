import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout.jsx";
import RutaProtegida from "./routes/RutaProtegida.jsx";
import RutaPublica from "./routes/RutaPublica.jsx";
import { useAuth } from "./features/auth/context/AuthContext.jsx";
import { rutaInicio } from "./config/roles.js";

import LoginPage from "./features/auth/pages/LoginPage.jsx";
import CategoriasPage from "./features/menu/pages/CategoriasPage.jsx";
import ProductosPage from "./features/menu/pages/ProductosPage.jsx";
import MesasPage from "./features/mesas/pages/MesasPage.jsx";
import ReservasPage from "./features/mesas/pages/ReservasPage.jsx";
import PedidosPage from "./features/pedidos/pages/PedidosPage.jsx";

// Envía al usuario a la pantalla de inicio de su rol
function InicioPorRol() {
    const { rol } = useAuth();
    return <Navigate to={rutaInicio(rol)} replace />;
}

export default function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <RutaPublica>
                        <LoginPage />
                    </RutaPublica>
                }
            />

            {/* Todo el panel requiere sesión; cada sección valida el rol */}
            <Route
                element={
                    <RutaProtegida>
                        <AdminLayout />
                    </RutaProtegida>
                }
            >
                <Route path="/" element={<InicioPorRol />} />

                <Route
                    path="/pedidos"
                    element={<RutaProtegida seccion="pedidos"><PedidosPage /></RutaProtegida>}
                />

                {/* Módulo de menú */}
                <Route
                    path="/productos"
                    element={<RutaProtegida seccion="productos"><ProductosPage /></RutaProtegida>}
                />
                <Route
                    path="/categorias"
                    element={<RutaProtegida seccion="categorias"><CategoriasPage /></RutaProtegida>}
                />

                {/* Módulo de mesas y reservas */}
                <Route
                    path="/mesas"
                    element={<RutaProtegida seccion="mesas"><MesasPage /></RutaProtegida>}
                />
                <Route
                    path="/mesas/reservas"
                    element={<RutaProtegida seccion="reservas"><ReservasPage /></RutaProtegida>}
                />

                <Route path="*" element={<InicioPorRol />} />
            </Route>
        </Routes>
    );
}
