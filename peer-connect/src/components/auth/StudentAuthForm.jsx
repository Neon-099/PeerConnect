import { auth, storeSession} from '../../utils/auth.js';
import {useNavigate, Link} from 'react-router-dom';
import {GoogleLogin} from '@react-oauth/google';
import { GraduationCapIcon } from "lucide-react";
import { useEffect } from "react";
import { useState } from 'react';
import { User, GraduationCap, CheckCircle, Eye, EyeOff } from 'lucide-react';


const StudentSignup = () => {

  const [activeTab, setActiveTab] = useState('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    providers: ''
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    console.log('Login form submitted with data:', formData);
    try {
        const role = 'student';
        console.log('Calling auth.login...');
        const res = await auth.login(formData.email, formData.password, role);
        console.log('Login response:', res);
        storeSession(res);
        navigate('/student/home'); //ADJUST WHEN DASHBOARD IS READY
        console.log('Form submitted:', formData, );
        alert('Account logged in successfully!');
    }
    catch (err) {
        console.error('Login error:', err);
        alert(err.message || 'login failed');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    console.log('Signup form submitted with data:', formData);
    try {
        const payload = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            password: formData.password,
            role: 'student',
        };
        console.log('Calling auth.register with payload:', payload);
        const res = await auth.register(payload);
        console.log('Register response:', res);
        storeSession(res);
        alert("Account created successfully!");
        setActiveTab('login');
    }
    catch(err){
        console.error('Signup error:', err);
        alert(err.message || 'Signup failed');
    }
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = async(credentialResponse) => {
    try {
        console.log('Google authentication response:', credentialResponse);

        if(!credentialResponse.credential) {
            throw new Error('No credential received form Google');
        }

        const google_token = credentialResponse.credential;
        console.log('Calling backend with google token...');

        const res = await auth.googleAuth(google_token, 'student');
        console.log('Google auth response', res);

        storeSession(res);
        alert('Google authentication successful');
        navigate('/student/home');
    }
    catch(err) {
        console.error('Google authentication error', err);
        alert(err.message || 'Google authentication failed');
    }
  }

  const handleGoogleError = (err) => {
    console.error('Google authentication error:', err);
    alert('Google authentication failed. Please try again!');
  }

    return (
        <div>
            <header className={`py-3 flex items-center justify-between transition-all duration shadow-md`}>
                    <div className='flex items-center  gap-4 pl-10'>
                        <GraduationCapIcon className="h-6 w-6" />
                        <h1 className='font-bold text-2xl'>PeerConnect</h1>
                        <Link>Find Tutor</Link>
                        <Link>Find Student</Link>
                        <Link>How it works</Link>
                    </div>
                    <div className='flex items-center  gap-4 pr-9'>
                        <Link to="/signup">Signin</Link>
                        <Link className='bg-orange-400 p-3 text-white rounded-full'>Get Started</Link>
                    </div>

            </header>


            <main >
                <div className="min-h-screen flex items-center justify-center ">
                    <div>

                    </div>
                    <div className="w-full max-w-md">
                        <p className="text-gray-400">Set up your account in a few quick steps</p>
                        
                        {/* Login/Signup Toggle */}
                        <div className="grid grid-cols-2 mb-6">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`py-3 px-4 text-sm font-medium rounded-l-lg border border-r-0 border-gray-600 ${
                            activeTab === 'login'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setActiveTab('signup')}
                            className={`py-3 px-4 text-sm font-medium rounded-r-lg border border-l-0 border-gray-600 ${
                            activeTab === 'signup'
                                ? 'bg-blue-600 text-white border-gray-600'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            Sign Up
                        </button>
                        </div>

                        {/*Login Form */}
                        {activeTab === 'login' && (
                        <div className="bg-gray-800 rounded-lg p-6 h-[675px]">
                        <h2 className="text-lg font-semibold text-white mb-4"> Login your account</h2>
                        
                        <div className="space-y-4">
                            <form onSubmit={handleLoginSubmit}>
                                <div className="text-sm text-gray-300 mb-4">Basic Info</div>
                                
                                <div>
                                <label className="block text-sm text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                </div>

                                <div className="pb-9">
                                    <label className="block text-sm text-gray-300 mb-2">Password</label>
                                    <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                    </div>
                                </div>


                                <button
                                type="submit"
                                className=" w-full bg-blue-600 hover:bg-blue-700 text-white py-3  px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    Login
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                </button>
                            </form>
                        </div>
                        </div>
                        )}

                        {/*Sign Up Form */}
                        {activeTab === 'signup' && (
                        <div className="bg-gray-800 rounded-lg p-6 h-[675px]">
                        <h2 className="text-lg font-semibold text-white mb-4">Create your account</h2>
                        
                        <div className="space-y-4">
                            <form onSubmit={handleSignupSubmit}>
                                <div className="text-sm text-gray-300 mb-4">Basic Info</div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">First Name</label>
                                    <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">Last Name</label>
                                    <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    />
                                </div>
                                </div>

                                <div>
                                <label className="block text-sm text-gray-300 mb-2">School Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">Password</label>
                                    <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">Confirm Password</label>
                                    <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                    </div>
                                </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                    Sign in
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                            <div className="flex items-center my-6">
                                <div className="flex-1 border-t border-gray-600"></div>
                                <span className="px-4 text-gray-400 text-sm">or</span>
                                <div className="flex-1 border-t border-gray-600"></div>
                            </div>

                            <div className="flex items-center justify-center">
                                 {googleClientId && googleClientId !== 'your-google-client-id-here' ? (
                                        <GoogleLogin 
                                        clientId={googleClientId}
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        useOneTap={false}
                                        cookiePolicy={'single_host_origin'}
                                        theme="outline"
                                        size="large"
                                        text="signup_with"
                                        shape="rectangular"
                                        />
                                    ) : (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            Google authentication is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
                                        </p>
                                        </div>
                                    )}
                            </div>
                           
                            <div className="text-center mt-6">
                                <span className="text-gray-400">Already have an account? </span>
                                <button
                                onClick={() => setActiveTab('login')}
                                className="text-blue-400 hover:text-blue-300 font-medium"
                                >
                                Login
                                </button>
                            </div>

                            <div className="items-center mt-4 text-xs text-gray-500 ">
                                <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default StudentSignup;