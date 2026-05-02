import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/Dashboard';
import DashboardProfessor from './pages/DashboardProfessor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/aluno" element={<Dashboard />} />
        <Route path="/dashboard/orientador" element={<DashboardProfessor />} />
        <Route path="/dashboard/coordenacao" element={<div>Coordenação</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;