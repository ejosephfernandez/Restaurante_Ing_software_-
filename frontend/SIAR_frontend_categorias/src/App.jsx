import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout.jsx";

import CategoriasPage from "./features/menu/pages/CategoriasPage.jsx";
import ProductosPage from "./features/menu/pages/ProductosPage.jsx";
import MesasPage from "./features/mesas/pages/MesasPage.jsx"
import ReservasPage from "./features/mesas/pages/ReservasPage.jsx";
import PedidosPage from "./features/pedidos/pages/PedidosPage.jsx";

export default function App() {
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route
                    path="/"
                    element={<Navigate to="/productos" replace />}
                />

                <Route
                    path="/productos"
                    element={<ProductosPage />}
                />

                <Route
                    path="/categorias"
                    element={<CategoriasPage />}
                />

                 {/* Módulo de mesas */}
                <Route
                    path="/mesas"
                    element={<MesasPage />}
                />

                {/* Módulo de reservas */}
                <Route
                    path="/mesas/reservas"
                    element={<ReservasPage />}
                />


                <Route
                    path="/mesas"
                    element={<MesasPage />}
                />

                <Route
                    path="/pedidos"
                    element={<PedidosPage />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/productos" replace />}
                />
            </Route>
        </Routes>
    );
}
