import { useState } from 'react'
import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Landing from './pages/Student/Landing.jsx';
import StudentAuthForm from './pages/auth/StudentAuthForm.jsx';

function App() {
  const [count, setCount] = useState(0)

  const googleClientId = import.meta.env.GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />}/>
          <Route path="/signup" element={<StudentAuthForm />}/>
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  )
}

export default App
