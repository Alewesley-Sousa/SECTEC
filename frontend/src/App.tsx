import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/DashboardAluno';
import Administrador from './pages/Administrador';
import RelatorioAlunosCoordenacao from './pages/services/coordenacao/components/RelatorioAlunosCoordenacao';
import NotasAluno from './pages/Notas';
import RelatoriosAluno from './pages/Relatoriosaluno';
import RelatorioStatusAlunos from './pages/RelatorioStatusAlunos';
import Comissao from './pages/Comissao';
import ConfigAluno from './componentes/configurações/config';
import ProtectedRoute from './componentes/ProtectedRoute';
import { getRoleRedirect, type BackendRole } from './lib/api';
import DashboardOrientador, {
  ConfigOrientador,
  EntregasOrientador,
  TurmasOrientador,
} from './pages/DashboardOrientador';
import GerarQRCode from './pages/services/coordenacao/GerarQRCode';
import ImprimirQRCode from './pages/services/coordenacao/ImprimirQrCode';

// Componente da Tarefa 5
import PainelConfiguracaoCoordenacao from './componentes/configurações/PainelConfiguracaoCoordenacao';
import FichaAvaliacao from './pages/FichaAvaliacao';

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
    value === 'aluno' || value === 'orientador' || value === 'coordenador' || value === 'comissao';
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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard/aluno"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/aluno/notas"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <NotasAluno />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/aluno/relatorios"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <RelatoriosAluno />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/aluno/configuracoes"
          element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <ConfigAluno />
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
          path="/dashboard/orientador/configuracoes"
          element={
            <ProtectedRoute allowedRoles={['orientador']}>
              <ConfigOrientador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/comissao"
          element={
            <ProtectedRoute allowedRoles={["comissao"]}>
              <Comissao />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenacao"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <Administrador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenacao/turmas"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <Administrador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenacao/frequencia"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <Administrador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenacao/usuarios"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <Administrador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenacao/eventos"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <Administrador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenacao/projetos"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <Administrador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenacao/configuracoes"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <ConfigAluno userRole="coordenador" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenacao/relatorio-alunos"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <RelatorioStatusAlunos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/coordenacao/gestao-relatorio-alunos"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <RelatorioAlunosCoordenacao />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ficha-avaliacao"
          element={<FichaAvaliacao />}
        />

        {/* Rota da Tarefa 5 protegida para a coordenação */}
        <Route
          path="/dashboard/coordenacao/distribuicao-projetos"
          element={
            <ProtectedRoute allowedRoles={["coordenador"]}>
              <PainelConfiguracaoCoordenacao />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route
          path="/dashboard/coordenacao/qrcode"
          element={
            <ProtectedRoute allowedRoles={['coordenador']}>
              <GerarQRCode />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/coordenacao/qrcode/imprimir"
          element={
            <ProtectedRoute allowedRoles={['coordenador']}>
              <ImprimirQRCode />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;