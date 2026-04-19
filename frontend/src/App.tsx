import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
      {/* Card Principal */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-slate-200">
        
        <header className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-600">
            Sistema de Vendas
          </h1>
          <p className="mt-2 text-slate-500">
            Stack: NestJS + React + Tailwind
          </p>
        </header>

        <main className="flex flex-col items-center space-y-4">
          <div className="text-sm font-medium px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
            Front-end Conectado
          </div>
          
          <button
            onClick={() => setCount((count) => count + 1)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all active:scale-95 shadow-md shadow-indigo-200"
          >
            Vendas Realizadas: {count}
          </button>
        </main>

        <footer className="pt-6 border-t border-slate-100 text-center">
          <code className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
            src/App.tsx corrigido
          </code>
        </footer>
      </div>
    </div>
  )
}

export default App
