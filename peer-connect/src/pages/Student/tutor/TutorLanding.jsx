
import { ArrowUpRight, Calendar, Heart, GraduationCap, Star, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TutorLanding = () => {
    const navigate = useNavigate();

    const handleSignUp = () => {
        navigate('/tutor/signup');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-900 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">PeerConnect</span>
                    </div>
                    <nav className="hidden md:flex space-x-8">
                        <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How it Works</a>
                        <a href="#benefits" className="hover:text-blue-400 transition-colors">Benefits</a>
                        <a href="#testimonials" className="hover:text-blue-400 transition-colors">Testimonials</a>
                    </nav>
                    <button 
                        onClick={handleSignUp}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Sign Up
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gray-800 px-6 py-16">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                <ArrowUpRight className="w-4 h-4" />
                                <span>Start tutoring in days</span>
                            </div>
                            
                            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                                Share your skills.<br />
                                Earn, grow, and make an impact.
                            </h1>
                            
                            <p className="text-xl text-gray-300 leading-relaxed">
                                Join PeerConnect to tutor classmates on subjects you know best. 
                                Build confidence, strengthen your resume, and get paid for helping others succeed.
                            </p>
                            
                            <div className="flex items-center space-x-6">
                                <button 
                                    onClick={handleSignUp}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center space-x-2 transition-colors"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    <span>Become a Tutor</span>
                                </button>
                                <span className="text-sm text-gray-400">
                                    It's free to join. No long applications.
                                </span>
                            </div>
                        </div>

                        {/* Right Content - Image Grid */}
                        <div className="bg-blue-900 p-8 rounded-2xl">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-700 h-32 rounded-lg flex items-center justify-center">
                                    <div className="text-gray-400 text-sm">Laptop Study</div>
                                </div>
                                <div className="bg-gray-700 h-32 rounded-lg flex items-center justify-center">
                                    <div className="text-gray-400 text-sm">Coding Session</div>
                                </div>
                                <div className="bg-gray-700 h-32 rounded-lg flex items-center justify-center">
                                    <div className="text-gray-400 text-sm">Study Group</div>
                                </div>
                                <div className="bg-gray-700 h-32 rounded-lg flex items-center justify-center">
                                    <div className="text-gray-400 text-sm">Learning Materials</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Tutor Section */}
            <section id="benefits" className="bg-blue-900 px-6 py-16">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-4">Why tutor with PeerConnect</h2>
                    <p className="text-xl text-blue-100 mb-12">
                        Flexible, meaningful, and rewarding. Turn your knowledge into impact and income.
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gray-800 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6 mx-auto">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Earn on your schedule</h3>
                            <p className="text-gray-300">
                                Set your availability and rates. Get paid quickly for each session.
                            </p>
                        </div>
                        
                        <div className="bg-gray-800 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6 mx-auto">
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Help your peers</h3>
                            <p className="text-gray-300">
                                Make a real difference by guiding classmates through tough topics.
                            </p>
                        </div>
                        
                        <div className="bg-gray-800 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6 mx-auto">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Build real skills</h3>
                            <p className="text-gray-300">
                                Develop communication, leadership, and problem-solving abilities.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="bg-gray-800 px-6 py-16">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">How it works</h2>
                        <p className="text-xl text-gray-300">Get started in four simple steps.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="bg-gray-700 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
                                <span className="text-xl font-bold">1</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Create your profile</h3>
                            <p className="text-gray-300">
                                Tell us your subjects, strengths, and availability.
                            </p>
                        </div>
                        
                        <div className="bg-gray-700 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
                                <span className="text-xl font-bold">2</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Get matched</h3>
                            <p className="text-gray-300">
                                We connect you with students who need your expertise.
                            </p>
                        </div>
                        
                        <div className="bg-gray-700 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
                                <span className="text-xl font-bold">3</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Tutor online or on campus</h3>
                            <p className="text-gray-300">
                                Meet in person or via video using our tools and resources.
                            </p>
                        </div>
                        
                        <div className="bg-gray-700 p-8 rounded-xl">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
                                <span className="text-xl font-bold">4</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Get paid</h3>
                            <p className="text-gray-300">
                                Secure payments with transparent rates and no surprises.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="bg-gray-900 px-6 py-16">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gray-800 rounded-2xl p-12 text-center">
                        <h2 className="text-4xl font-bold mb-6">
                            Ready to make an impact and get paid?
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Join thousands of student tutors building experience and confidence.
                        </p>
                        <button 
                            onClick={handleSignUp}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center space-x-2 mx-auto transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Become a Tutor</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-800 px-6 py-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">PeerConnect</span>
                    </div>
                    <p className="text-gray-400">
                        © 2024 PeerConnect. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default TutorLanding;