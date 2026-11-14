import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Estilos globales: primero Bootstrap y después los de SIAR, para que los
// tokens de color y tipografía del proyecto tengan prioridad.
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.css";
import "./styles/components.css";

import App from "./App.jsx";
import { AuthProvider } from "./features/auth/context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
