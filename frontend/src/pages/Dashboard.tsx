import Header from "../componentes/Header";
import  {Button}  from "../componentes/Button/Button";

function Dashboard() {
  return (
    <body>
        <Header />
    
    <main>
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
    <Button variant="primary" size="md">
      Clique aqui
    </Button>
    </main>
        
    </body>
  );
}

export default Dashboard;