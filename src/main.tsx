import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import LinksPage from "./LinksPage";

// El panel de métricas se carga aparte: quien entra por los links no descarga nada de más.
const AdminPage = lazy(() => import("./AdminPage"));

const esAdmin = window.location.pathname.replace(/\/+$/, "") === "/admin";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {esAdmin ? (
      <Suspense fallback={<div className="center muted">…</div>}>
        <AdminPage />
      </Suspense>
    ) : (
      <LinksPage />
    )}
  </StrictMode>
);
