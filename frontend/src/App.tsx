import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";

import Dashboard from "./pages/DashboardAluno";
import DashboardOrientador from "./pages/DashboardOrientador";
import ProtectedRoute from "./componentes/ProtectedRoute";
import NotasAluno from "./pages/Notas";
import Config from "./componentes/configurações/config";
import RelatoriosAluno from "./pages/Relatoriosaluno";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard/aluno"
          element={
            <ProtectedRoute allowedRoles={["aluno"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/orientador"
          element={
            <ProtectedRoute allowedRoles={["orientador"]}>
              <DashboardOrientador />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/coordenacao"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <div>Coordenação</div>
            </ProtectedRoute>
          }
        />
      <Route
        path="/dashboard/aluno/configuracoes"
        element={
           <ProtectedRoute allowedRoles={["aluno"]}>
            <Config />
           </ProtectedRoute>
          }
          />

          <Route path="/dashboard/aluno/notas" element={<NotasAluno />} />
          <Route path="/dashboard/aluno/relatorios" element={<RelatoriosAluno />} />

      </Routes>
       
   
    </BrowserRouter>
  );
}

export default App;