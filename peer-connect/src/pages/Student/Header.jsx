import {MessageSquare, Bell} from 'lucide-react';

const Header = ({userProfile, userProfilePictureUrl}) => {
    return (
        <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-teal-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-teal-600" />
            </button>
                <img 
                src={userProfilePictureUrl}
                alt={userProfile || 'Student'} 
                className="w-10 h-10 rounded-lg object-cover"
                />
        </div>
    )
}
export default Header;