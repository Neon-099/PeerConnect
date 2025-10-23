import {Bell} from 'lucide-react';

const Header = ({userProfile, userProfilePictureUrl}) => {
    return (
        <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
                
            </button>
                <img 
                src={userProfilePictureUrl}
                alt={userProfile || 'Tutor'} 
                className="w-10 h-10 rounded-lg object-cover"
                />
        </div>
    )
}
export default Header;