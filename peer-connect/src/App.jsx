import { useState } from 'react'
import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Landing from './pages/Student/Landing.jsx';
import StudentSignup from './pages/auth/StudentSignup.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />}/>
        <Route path="/signup" element={<StudentSignup />}/>
      </Routes>
    </Router>
  )
}

export default App
