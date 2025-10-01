import { useState } from 'react'
import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Landing from './pages/Student/Landing.jsx';
import StudentAuthForm from './components/auth/StudentAuthForm.jsx';
import Homes from './pages/student/Homes.jsx';

function App() {

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />}/>
          <Route path="/signup" element={<StudentAuthForm />}/>
          <Route path="/student/home" element={<Homes />}/>
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  )
}

export default App
