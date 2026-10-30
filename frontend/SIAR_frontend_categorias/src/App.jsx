import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout.jsx";

import CategoriasPage from "./features/menu/pages/CategoriasPage.jsx";
import ProductosPage from "./features/menu/pages/ProductosPage.jsx";
//import PedidosPage from "./features/pedidos/pages/PedidosPage.jsx";

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

                <Route
                    path="*"
                    element={<Navigate to="/productos" replace />}
                />
            </Route>
        </Routes>
    );
}