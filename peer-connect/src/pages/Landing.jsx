import {GraduationCapIcon} from 'lucide-react';
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
            </main>
        </div>
    )
}

export default Landing;