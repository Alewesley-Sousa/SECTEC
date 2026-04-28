import { Button } from './Button/Button'
const Header = () => {
  
  return (
    <header className="bg-sectec-900 text-white p-4 flex justify-between items-center shadow-lg">
      <Button>Configurações</Button>
      <h1 className="text-2xl font-bold">SECTEC</h1>
        <nav>
          <ul className="flex space-x-4">
            <li><a href="/" className="font-medium hover:text-sectec-100 transition-colors">Início</a></li>
            <li><a href="/sobre" className="font-medium hover:text-sectec-100 transition-colors">Sobre</a></li>
            <li><a href="/contato" className="font-medium hover:text-sectec-100 transition-colors">Contato</a></li>
          </ul>
        </nav>
    </header>
  );
}

export default Header;