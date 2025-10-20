import { useState } from 'react'
import './App.css'
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import Landing from './pages/student/Landing.jsx';
import StudentAuthForm from './components/auth/StudentAuthForm.jsx';
import StudentProfileCreation from './components/StudentProfileCreation.jsx';
import PasswordResetModal from './components/PasswordResetModal.jsx';
import Homes from './pages/student/HomesSection.jsx';


import TutorLanding from './pages/student/tutor/TutorLanding.jsx';
import TutorAuthForm from './components/auth/TutorAuthForm.jsx';
import TutorProfileCreation from './components/tutor/TutorProfileCreation.jsx';
import TutorHomes from './pages/student/tutor/Homes.jsx';

function App() {

  const googleClientId='1005670572674-7vq1k5ndj4lt4pon7ojp1spvamikfmiu.apps.googleusercontent.com';
return( 
      <GoogleOAuthProvider clientId={googleClientId}>
        <Router>
          <Routes>
              {/* Student Routes */}
              <Route path="/student/landing" element={<Landing />} />
              <Route path="/student/signup" element={<StudentAuthForm />} />
              <Route path="/student/profileCreation" element={<StudentProfileCreation />} />
              <Route path="/student/resetPassword" element={<PasswordResetModal />} />
              <Route path="/student/home" element={<Homes />} />
              
              {/* Tutor Routes */}
              <Route path="/tutor/landing" element={<TutorLanding />} />
              <Route path="/tutor/signup" element={<TutorAuthForm />} />
              <Route path="/tutor/profileCreation" element={<TutorProfileCreation />} />
              <Route path="/tutor/resetPassword" element={<PasswordResetModal />} />
              <Route path="/tutor/home" element={<TutorHomes />} />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/student/landing" replace />} />
          </Routes>
        </Router>
    </GoogleOAuthProvider>
);
}

export default App;
