import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/DashboardAluno';
import Administrador from './pages/Administrador';
import ProtectedRoute from './componentes/ProtectedRoute';
import { getRoleRedirect, type BackendRole } from './lib/api';
import DashboardOrientador, {
  AgendaOrientador,
  AvaliacoesOrientador,
  ConfigOrientador,
  EntregasOrientador,
  TurmasOrientador,
} from './pages/DashboardOrientador';

function App() {
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
  }));

  useEffect(() => {
    const readAuth = () =>
      setAuth({
        token: localStorage.getItem('token'),
        role: localStorage.getItem('role'),
      });

    readAuth();
    window.addEventListener('storage', readAuth);
    window.addEventListener('auth-change', readAuth);

    return () => {
      window.removeEventListener('storage', readAuth);
      window.removeEventListener('auth-change', readAuth);
    };
  }, []);

  const { token, role } = auth;
  const isBackendRole = (value: string | null): value is BackendRole =>
    value === 'aluno' || value === 'orientador' || value === 'coordenador';
  const backendRole = isBackendRole(role) ? role : null;
  const isLoggedIn = Boolean(token && backendRole);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            isLoggedIn && backendRole ? (
              <Navigate to={getRoleRedirect(backendRole)} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/dashboard/aluno"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/orientador"
          element={
            <ProtectedRoute allowedRoles={['orientador']}>
              <DashboardOrientador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/orientador/turmas"
          element={
            <ProtectedRoute allowedRoles={['orientador']}>
              <TurmasOrientador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/orientador/entregas"
          element={
            <ProtectedRoute allowedRoles={['orientador']}>
              <EntregasOrientador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/orientador/agenda"
          element={
            <ProtectedRoute allowedRoles={['orientador']}>
              <AgendaOrientador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/orientador/notas"
          element={
            <ProtectedRoute allowedRoles={['orientador']}>
              <AvaliacoesOrientador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/orientador/configuracoes"
          element={
            <ProtectedRoute allowedRoles={['orientador']}>
              <ConfigOrientador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenacao/*"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <Administrador />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
