import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/DashboardAluno';
import Administrador from './pages/Administrador';
import ProtectedRoute from './componentes/ProtectedRoute';
import DashboardOrientador, {
  AgendaOrientador,
  AvaliacoesOrientador,
  ConfigOrientador,
  EntregasOrientador,
  TurmasOrientador,
} from './pages/DashboardOrientador';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/aluno" element={<Dashboard />} />
        <Route path="/dashboard/orientador" element={<DashboardOrientador />} />
        <Route path="/dashboard/orientador/turmas" element={<TurmasOrientador />} />
        <Route path="/dashboard/orientador/entregas" element={<EntregasOrientador />} />
        <Route path="/dashboard/orientador/agenda" element={<AgendaOrientador />} />
        <Route path="/dashboard/orientador/notas" element={<AvaliacoesOrientador />} />
        <Route path="/dashboard/orientador/configuracoes" element={<ConfigOrientador />} />
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
