import { Settings } from 'lucide-react'
import { Button } from './Button/Button'

const Header = () => {
  return (
    <header className="bg-sectec-900 text-white p-4 flex justify-between items-center shadow-lg">
      {/* Logo */}
            <div className="flex justify-center">
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-2 gap-1">
                  <span className="h-8 w-8 rounded-lg bg-sectec-700" />
                  <span className="h-8 w-8 rounded-lg bg-sectec-100" />
                  <span className="h-8 w-8 rounded-lg bg-sectec-600" />
                  <span className="h-8 w-8 rounded-lg bg-sectec-700" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl font-extrabold text-green-600">SECTEC</h1>
                  <p className="text-lg text-green-100">Projeto Escolar</p>
                </div>
              </div>
            </div>
      <nav>
        <ul className="flex space-x-8 items-center">
          <li><a href="/" className="font-medium hover:text-sectec-100 transition-colors">Início</a></li>
          <li><a href="/sobre" className="font-medium hover:text-sectec-100 transition-colors">Sobre</a></li>
          <li><a href="/contato" className="font-medium hover:text-sectec-100 transition-colors">Contato</a></li>
          <li><a href="/login" className="font-medium hover:text-sectec-100 transition-colors">Login</a></li>
           <li>
            <Button size="sm" aria-label="Configurações">
              <Settings size={16} />
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;