import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/login'
import './index.css'


function Router() {
  return (
    <Routes>
      {/* Quando a URL for /login, mostra o componente Login */}
      <Route path="/login" element={<Login />} />

      {/* Quando a URL for a raiz /, mostra o Dashboard */}
      <Route path="/" element={<Dashboard/>} />

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
