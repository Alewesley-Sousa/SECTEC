import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/DashboardAluno';
import DashboardOrientador from './pages/DashboardOrientador';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/aluno" element={<Dashboard />} />
        <Route path="/dashboard/orientador" element={<DashboardOrientador />} />
        <Route path="/dashboard/coordenacao" element={<div>Coordenação</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;