import React from 'react';

const CloudinaryImage = ({ 
  src, 
  alt = 'Image', 
  width = 300, 
  height = 300, 
  crop = 'fill', 
  gravity = 'face', 
  quality = 'auto', 
  format = 'auto',
  className = '',
  ...props 
}) => {
  if (!src) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400">No Image</span>
      </div>
    );
  }

  // If it's already a Cloudinary URL, optimize it
  if (src.includes('cloudinary.com')) {
    const optimizedUrl = src.replace(
      '/upload/',
      `/upload/w_${width},h_${height},c_${crop},g_${gravity},q_${quality},f_${format}/`
    );
    
    return (
      <img
        src={optimizedUrl}
        alt={alt}
        className={className}
        loading="lazy"
        {...props}
      />
    );
  }

  // For non-Cloudinary URLs (fallback)
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      {...props}
    />
  );
};

export default CloudinaryImage;