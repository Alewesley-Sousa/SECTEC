import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DashboardPage from './pages/DashboardProfessor'
import Login from './pages/login'
import { MainLayout } from './componentes/SideBarUniversal'
import './index.css'


function Router() {
  const userRole = 'Professor' as const

  return (
    <Routes>
      {/* Quando a URL for /login, mostra o componente Login */}
      <Route path="/login" element={<Login />} />

      {/* Rota padrão: professor vê o dashboard do professor */}
      <Route
        path="/"
        element={
          <MainLayout userRole={userRole}>
            {userRole === 'Professor' ? <DashboardPage /> : <Dashboard />}
          </MainLayout>
        }
      />

      <Route
        path="/professor"
        element={
          <MainLayout userRole={userRole}>
            <DashboardPage />
          </MainLayout>
        }
      />

      {/* Rota para quando digitar qualquer outra coisa (404) */}
      <Route path="*" element={<h1 className="p-10">404 - Não encontrado</h1>} />
    </Routes>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  </React.StrictMode>,
)
