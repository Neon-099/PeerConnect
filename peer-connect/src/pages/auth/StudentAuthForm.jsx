import { GraduationCapIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from 'react';
import { User, GraduationCap, CheckCircle, Eye, EyeOff } from 'lucide-react';
import {GoogleLogin} from '@react-oauth/google';


const StudentSignup = () => {

  const [activeTab, setActiveTab] = useState('signup');
  const [currentStep, setCurrentStep] = useState('account');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleContinue = () => {
    if (currentStep === 'account') {
      setCurrentStep('school');
    } else if (currentStep === 'school') {
      setCurrentStep('confirm');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData, );
    alert('Account created successfully!');
  };

  const handleLoginSubmit = () => {
    console.log('Login submitted:', formData);
    alert('Login successful!');
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
                            {currentStep === 'account' && (
                            <form>
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
                                type="button"
                                onClick={handleContinue}
                                className=" w-full bg-blue-600 hover:bg-blue-700 text-white py-3  px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    Login
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                </button>
                            </form>
                            )}

                        </div>
                        </div>
                        )}

                        {/*Sign Up Form */}
                        {activeTab === 'signup' && (
                        <div className="bg-gray-800 rounded-lg p-6 h-[675px]">
                        <h2 className="text-lg font-semibold text-white mb-4">Create your account</h2>
                        
                        <div className="space-y-4">
                            {currentStep === 'account' && (
                            <form>
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
                                    type="button"
                                    onClick={handleContinue}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                    Sign in
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    </button>
                                </div>
                            </form>
                            )}

                            
                        </div>

                        {currentStep === 'account' && (
                            <>
                            <div className="flex items-center my-6">
                                <div className="flex-1 border-t border-gray-600"></div>
                                <span className="px-4 text-gray-400 text-sm">or</span>
                                <div className="flex-1 border-t border-gray-600"></div>
                            </div>

                            <button className="w-full bg-white hover:bg-gray-100 text-gray-900 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Sign up with Google
                                <GoogleLogin
  onSuccess={credentialResponse => {
    fetch("/api/auth/google-login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: credentialResponse.credential })
    })
  }}
  onError={() => {
    console.log('Login Failed');
  }}
/>
                            </button>

                            <div className="text-center mt-6">
                                <span className="text-gray-400">Already have an account? </span>
                                <button
                                onClick={() => setActiveTab('login')}
                                className="text-blue-400 hover:text-blue-300 font-medium"
                                >
                                Login
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-4 text-xs text-gray-500 ">
                                <input 
                                    className="h-[40px] w-[15px] cursor-pointer pt-10 pb-43"
                                    type="checkbox" />
                                <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
                            </div>
                            </>
                        )}
                        </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default StudentSignup;