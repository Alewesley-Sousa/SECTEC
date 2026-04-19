import { Routes, Route } from 'react-router-dom'

// Componentes de exemplo (você pode criar arquivos separados depois)
const Login = () => <h1 className="p-10 text-2xl">Tela de Login</h1>
const Dashboard = () => <h1 className="p-10 text-2xl text-indigo-600">Painel de Vendas</h1>

function App() {
  return (
    <Routes>
      {/* Quando a URL for /login, mostra o componente Login */}
      <Route path="/login" element={<Login />} />

      {/* Quando a URL for a raiz /, mostra o Dashboard */}
      <Route path="/" element={<Dashboard />} />

      {/* Rota para quando digitar qualquer outra coisa (404) */}
      <Route path="*" element={<h1 className="p-10">404 - Não encontrado</h1>} />
    </Routes>
  )
}

export default App
