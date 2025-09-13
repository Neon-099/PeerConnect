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

            <main className='bg-[#E6F0F2]'>
                <div>
                    <h1>Test</h1>
                    <p>Isa pa </p>
                </div>
            </main>
        </div>
    )
}

export default Landing;