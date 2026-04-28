import { useState } from 'react'
import Header from './components/Header'
import Login from './pages/login'


function App() {
  const [count, setCount] = useState(0)

  return (
    <Login/>
  )
}

export default App
