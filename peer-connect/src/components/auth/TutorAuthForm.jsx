import { auth, storeSession, } from '../../utils/auth.js';
import {apiClient} from '../../utils/api.js'
import {useNavigate, Link} from 'react-router-dom';
import { useState } from 'react';
import { User, GraduationCapIcon, AlertTriangle, Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PasswordResetModal from '../PasswordResetModal.jsx';

const TutorAuthForm = () => {

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

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [rateLimitInfo, setRateLimitInfo] = useState({
    isRateLimited: false,
    lockoutSeconds: 0,
    lockoutMinutes: 0
  });
  const [loginError, setLoginError] = useState('');
  const [showForgotPasswordSuggestion, setShowForgotPasswordSuggestion] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const checkUserProfile = async() => {
        try {
            const response = await apiClient.get('/api/tutor/profile');
            console.log('Profile check response:', response);

            // Check if response exists and has content
            if(response && Object.keys(response).length > 0) {
                console.log('Profile exists:', response);
                return response;
            }
            else {
                console.log('Profile response is empty');
                return null;
            }
        }
        catch (error) {
            console.log('Profile check error:', error.message);
            
            // Handle profile not found errors (404 or specific messages)
            if(error.message.includes('404') || 
            error.message.includes('Tutor profile not found') ||
            error.message.includes('Profile not found') || 
            error.message.includes('not found') ||
            error.message.includes('Please complete your profile setup') ||
            error.message.includes('Profile not exists!')) {
                console.log('Profile not found - redirecting to profile creation');
                navigate('/tutor/profileCreation');
                return null;
            }
            
            // Re-throw other errors (authentication, network, etc.)
            console.error('Unexpected error checking profile:', error);
            throw error;
        }
    }

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        console.log('Login form submitted with data:', formData);
        try {
            const role = 'tutor';
            console.log('Calling auth.login...');
            const res = await auth.login(formData.email, formData.password, role);
            console.log('Login response:', res);
            storeSession(res);
            
            //CHECK USER PROFILE AFTER SUCCESSFUL LOGIN
            const profile = await checkUserProfile();
            console.log('Check if profile exists', profile)
            if(profile) {
                alert('Account logged in successfully!');
                navigate('/tutor/home');
            }
            else {
                alert('Please complete your profile setup');
                navigate('/tutor/profileCreation'); 
                console.log('Form submitted:', formData, );
            } 
            


            //RESET ATTEMPT TRACKING ON SUCCESSFUL LOGIN
            setLoginAttempts(0);
            setIsAccountLocked(false);
            setLockoutTime(0);
            setLoginError('');
        }   
        catch (err) {
            console.error('Login error:', err);
            alert(err.message || 'login failed');
        
            //HANDLE DIFFERENT TYPES OF LOGIN ERROR

            // Add this function before handleLoginSubmit:
            const parseAttemptsFromError = (errorMessage) => {
            // Look for patterns like "X attempts remaining" or similar
            const match = errorMessage.match(/(\d+)\s+attempts?\s+remaining/i);
            return match ? parseInt(match[1]) : null;
            };

            // To:
            const attemptsLeft = parseAttemptsFromError(err.message);

            if(rateLimitInfo.isRateLimited) {
                //ACCOUNT IS LOCKED DUE TO RATE LIMITING 
                setIsAccountLocked(true);
                setLockoutTime(rateLimitInfo.lockoutSeconds);
                setLoginError(`Account locked for ${rateLimitInfo.lockoutMinutes} minutes due to too many failed attempts.`);
                setShowForgotPasswordSuggestion(true);

                //START COUNTDOWN 
                startLockoutCountdown(rateLimitInfo.lockoutSeconds);
            }
            else if (attemptsLeft !== null) {
                //FAILED ATTEMPT BUT NOT LOCKED YET     
                setLoginAttempts(prev => prev + 1);
                setRemainingAttempts(attemptsLeft);
                setLoginError(`Invalid email or password. ${attemptsLeft} attempts remaining.`);

                //SHOW IF FORGOT PASSWORD SUGGESTIONS AFTER 2 FAILED ATTEMPTS
                if(!attemptsLeft <= 3){
                    setShowForgotPasswordSuggestion(true);
                }
            }
            else if (err.message.toLowerCase().includes('Invalid email or password')){
                //GENERIC INVALID CREDENTIALS ERROR
                setLoginAttempts(prev => prev + 1);
                setLoginError('Invalid email or password. Please check your credentials');

                //SHOW FORGOT PASSWORD SUGGESTION 2 FAILED ATTEMPTS
                if(loginAttempts >= 2) {
                    setShowForgotPasswordSuggestion(true);
                } 
            }
            else {
                //OTHER ERRORS
                setLoginError(err.message);
            }
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        console.log('Signup form submitted with data:', formData);
        try {
            console.log('Entering...')
            const tutorPayload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                password: formData.password,
                role: 'tutor',
                providers: 'local'
            };
            console.log('Calling auth.register with payload:', tutorPayload);
            const res = await auth.register(tutorPayload);
            console.log('Register response:', res);

            //CHECK TOKENS IF SUCCESSFULLY STORED
            const hasTokens = localStorage.getItem('pc_access_token') && localStorage.getItem('pc_user');
            if(!hasTokens){
                throw new Error('Failed to store tokens');
            }

            // Simple success handling - let auth.register handle token storage
            navigate('/tutor/profileCreation');
            toast.success('Account created successfully!');
        }
        catch(err){
            console.error('Signup error:', err);
            alert(err.message || 'Signup failed');
        }
    }

    const startLockoutCountdown = (seconds) => {
        setLockoutTime(seconds);
        const timer = setInterval(() => {
            setLockoutTime(prev => {
                if(prev <= 1) {
                    clearInterval(timer);
                    setIsAccountLocked(false);
                    setLockoutTime(0);
                    setRemainingAttempts(5);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    const formatLockoutTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

  const handleForgotPasswordClick  = () => {
        setShowPasswordResetModal(true);
        setShowForgotPasswordSuggestion(false);
    }

    const handlePasswordResetSuccess = () => {
        alert('Password reset successful! Please login with your new password');
        setActiveTab('login');

        setLoginAttempts(0);
        setRemainingAttempts(5);
        setIsAccountLocked(false);
        setLoginError('');
        setShowForgotPasswordSuggestion(false);
    }

    const handleForgotPassword = () => {
        setShowPasswordResetModal(true);
        setShowForgotPasswordSuggestion(false);
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-900 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <GraduationCapIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">PeerConnect</span>
                    </div>
                    <nav className="hidden md:flex space-x-8">
                        <Link to="/tutor/landing" className="hover:text-blue-400 transition-colors">How it Works</Link>
                        <Link to="/tutor/landing#benefits" className="hover:text-blue-400 transition-colors">Benefits</Link>
                        <Link to="/tutor/landing#testimonials" className="hover:text-blue-400 transition-colors">Testimonials</Link>
                    </nav>
                    <Link 
                        to="/tutor/landing"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </header>

            <main className="min-h-screen flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">Join as a Tutor</h1>
                        <p className="text-gray-400">Set up your account in a few quick steps</p>
                    </div>
                        
                    {/* Login/Signup Toggle */}
                    <div className="grid grid-cols-2 mb-8 bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                            activeTab === 'login'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setActiveTab('signup')}
                            className={`py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                            activeTab === 'signup'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/*Login Form */}
                    {activeTab === 'login' && (
                        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>
                            
                            <div className="space-y-6">
                                <form onSubmit={handleLoginSubmit}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Enter your email"
                                            required
                                            disabled={isAccountLocked}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                                                placeholder="Enter your password"
                                                required
                                                disabled={isAccountLocked}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                                disabled={isAccountLocked}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        
                                        {/* Login Error Display */}
                                        {loginError && (
                                            <div className="mt-3 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                                                <div className="flex items-center space-x-2 text-red-400 text-sm">
                                                    {isAccountLocked ? <Lock size={16} /> : <AlertTriangle size={16} />}
                                                    <span>{loginError}</span>
                                                </div>
                                                
                                                {/* Lockout Countdown */}
                                                {isAccountLocked && lockoutTime > 0 && (
                                                    <div className="mt-2 text-orange-400 text-xs">
                                                        Account unlocks in: {formatLockoutTime(lockoutTime)}
                                                    </div>
                                                )}
                                                
                                                {/* Remaining Attempts */}
                                                {!isAccountLocked && remainingAttempts < 5 && (
                                                    <div className="mt-2 text-yellow-400 text-xs">
                                                        {remainingAttempts} attempts remaining
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Forgot Password Suggestion */}
                                        {showForgotPasswordSuggestion && !isAccountLocked && (
                                            <div className="mt-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2 text-blue-400 text-sm">
                                                        <AlertTriangle size={16} />
                                                        <span>Having trouble logging in?</span>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={handleForgotPasswordClick}
                                                        className="text-blue-400 hover:text-blue-300 text-sm font-medium underline"
                                                    >
                                                        Reset Password
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button 
                                                type="button"
                                                onClick={() => setShowPasswordResetModal(true)}
                                                className='text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors'
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isAccountLocked}
                                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        {isAccountLocked ? 'Account Locked' : 'Sign In'}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/*Sign Up Form */}
                    {activeTab === 'signup' && (
                    <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Your Account</h2>
                        
                        <div className="space-y-6">
                            <form onSubmit={handleSignupSubmit}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="First name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Last name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">School Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="your.email@university.edu"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                                                placeholder="Create password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                                                placeholder="Confirm password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        Create Account
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                            <div className="text-center mt-8">
                                <span className="text-gray-400">Already have an account? </span>
                                <button
                                    onClick={() => setActiveTab('login')}
                                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    Sign In
                                </button>
                            </div>

                            <div className="text-center mt-6 text-xs text-gray-500">
                                <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
                            </div>
                    </div>
                    )}
                    </div>
            </main>

            {/* Password Reset Modal */}
            <PasswordResetModal
                isOpen={showPasswordResetModal}
                onClose={() => setShowPasswordResetModal(false)}
                onSuccess={handlePasswordResetSuccess}
            />
        </div>
    );
};

export default TutorAuthForm;