import React from 'react';
import CloudinaryImage from './CloudinaryImage';
import { User } from 'lucide-react';

const ProfileImage = ({ 
  src, 
  alt = 'Profile', 
  size = 150, 
  className = '',
  showFallback = true 
}) => {
  if (!src && showFallback) {
    return (
      <div 
        className={`bg-gray-200 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <User className="text-gray-400" style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
    );
  }

  return (
    <CloudinaryImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      crop="fill"
      gravity="face"
      quality="auto"
      format="auto"
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default ProfileImage;