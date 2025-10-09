import { useState } from 'react'
import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Landing from './pages/Student/Landing.jsx';

import StudentAuthForm from './components/auth/StudentAuthForm.jsx';
import Homes from './pages/student/Homes.jsx';
import PasswordResetModal from './components/PasswordResetModal.jsx';
import StudentProfileCreation from './components/StudentProfileCreation.jsx';

function App() {

  const googleClientId = '1005670572674-7vq1k5ndj4lt4pon7ojp1spvamikfmiu.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={googleClientId}
    // Add these props to fix COOP issues
      popupType="window"
      ux_mode="popup" >
      <Router>
        <Routes>
          <Route path="/" element={<Landing />}/>
          <Route path="/signup" element={<StudentAuthForm />}/>
          <Route path="/student/profileCreation" element={<StudentProfileCreation />}/>
          <Route path="/resetPassword" element={<PasswordResetModal />}/>
          <Route path="/student/home" element={<Homes />}/>
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  )
}

export default App
