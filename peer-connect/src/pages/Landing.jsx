import {GraduationCapIcon, Search, Calendar, Shield, Star} from 'lucide-react';
import {Link } from 'react-router-dom';

const Landing = () => {
    
    
    return (
        <div>
            <header>
                <nav className='flex items-center justify-between'>
                    <div className='flex items-center  gap-4 p-9'>
                        <GraduationCapIcon className="h-6 w-6" />
                        <h1 className='font-bold text-2xl'>PeerConnect</h1>
                        <Link>Find Tutor</Link>
                        <Link>Find Student</Link>
                        <Link>How it works</Link>
                    </div>
                    <div className='flex items-center  gap-4 p-9'>
                        <button>Signin</button>
                        <button className='bg-orange-400 p-3 text-white rounded-full'>Get Started</button>
                    </div>
                </nav>
            </header>

            <main className=' '>
                <div className='bg-[#E6F0F2] max-w-screen-3xl mx-auto h-[500px] flex justify-center items-center space-x-60'>
                    <div className='space-y-3 '>
                        <p className='text-5xl font-semibold'>Learn with confidence,</p> 
                        <span className='text-5xl text-blue-500'>teach with purpose</span>
                        <p className='text-xl'> Connect with expert tutors for personalized learning experiences. <br />
                        From math to music, find your perfect match and unlock your potential.</p>
                        <button className='text-white p-4 rounded-2xl border-blue-500 bg-blue-400 hover:bg-blue-300 '>Find tutor</button>
                        <button>Title</button>
                    </div>
                    <div>
                        <img className='w-[500px] rounded-[30px]' 
                        src="https://media.istockphoto.com/id/486325400/photo/teacher-asking-her-students-a-question.jpg?s=612x612&w=0&k=20&c=gA6YxA-uGplqjyZfTKBuOcAXEZz7S_KqgGgEGl8YztQ=" alt="" />
                    </div> 
                </div>

                {/**/}
                <div className='my-20'>
                    <div className='flex flex-col justify-center items-center py-10 gap-9'>
                        <h2 className='font-bold text-5xl'>Simple, secure, and affordable</h2>
                        <p className='text-lg'>Everything you need for successful tutoring experience</p>
                    </div>
                    <div className='flex justify-center items-center gap-14 '>
                        <div className='flex justify-center items-center gap-4 flex-col shadow-2xl rounded-2xl w-[350px] h-[250px]'>
                            <div className='bg-blue-200 p-3 w-12 rounded-2xl'>
                                <Search className='font-bold text-blue-500 flex justify-center items-center ' />
                            </div>
                            <div className='flex justify-center items-center flex-col'>
                                <p className='font-bold text-2xl'>Smart Matching</p>
                                <p className='text-center px-5'>Find the perfect tutor based on subject, schedule, and learning style.</p>
                            </div>
                            
                        </div>
                        <div className='flex justify-center items-center gap-4 flex-col shadow-2xl rounded-2xl w-[350px] h-[250px]'>
                            <div className='bg-green-200 p-3 w-12 rounded-2xl'>
                                <Calendar className='font-bold text-green-500 flex justify-center items-center ' />
                            </div>
                            <div className='flex justify-center items-center flex-col'>
                                <p className='font-bold text-2xl'>Easy Booking</p>
                                <p className='text-center px-5'>Schedule sessions with one click and manage you calendar effortlessly.</p>
                            </div>
                        </div>
                        <div className='flex justify-center items-center gap-4 flex-col shadow-2xl rounded-2xl w-[350px] h-[250px]'>
                            <div className='bg-orange-200 p-3 w-12 rounded-2xl'>
                                <Shield className='font-bold text-orange-500 flex justify-center items-center ' />
                            </div>
                            <div className='flex justify-center items-center flex-col'>
                                <p className='font-bold text-2xl'>Secure Payments</p>
                                <p className='text-center px-5'>Safe, encrypted transactions with automatic tutor payouts.</p>
                            </div>
                        </div>
                        <div className='flex justify-center items-center gap-4 flex-col shadow-2xl rounded-2xl w-[350px] h-[250px]'>
                            <div className='bg-blue-200 p-3 w-12 rounded-2xl'>
                                <Star className='font-bold text-blue-500 flex justify-center items-center ' />
                            </div>
                            <div className='flex justify-center items-center flex-col'>
                                <p className='font-bold text-2xl'>Quality Assurance</p>
                                <p className='text-center px-5'>Verified tutors with ratings and reviews from real students</p>
                            </div>
                            
                        </div>
                    </div>
                </div>
                
                <div className='flex flex-col justify-center items-center my-50 gap-7'>
                        <h3 className='font-bold text-4xl'>Ready to start your learning journey?</h3>
                        <p className='text-lg '>Join the community today and start your peer tutoring journey.</p>
                        <button className='bg-blue-500 p-3 text-white rounded-full hover:bg-blue-400'>Get Started</button>
                </div>
                
            </main>
            {/*FOOTER*/}
            <footer className='bg-blue-900 text-white  flex justify-between items-center gap-30'>
                <div className='max-w-screen-3xl mx-auto py-10'>
                    <div className='flex items-center gap-5'>
                        <GraduationCapIcon className='h-12 w-12' />
                        <div className='flex-col '>
                            <h4>PeerConnect</h4>
                            <p className=''>Connecting learners with expert tutors for personalized education experiences.</p>
                        </div>
                           <div className='flex flex-col'>
                            <h5 className='font-bold'>For Students</h5>
                            <a href="#">Find tutors</a>
                            <a href="#">Book Sessions</a>
                            <a href="#">Track Progress</a>
                        </div>
                        <div className='flex flex-col'>
                            <h5 className='font-bold'>Support</h5>
                            <a href="#">Help Center</a>
                            <a href="#">Contact Us</a>
                            <a href="#">Privacy Policy</a>
                        </div>  
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Landing;