import React from 'react';

const ProfileGallery = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Gallery</h2>
      <div className="grid grid-cols-3 gap-4">
        <img
          className="h-48 w-full object-cover rounded-lg"
          src="https://via.placeholder.com/300"
          alt="Gallery"
        />
        <img
          className="h-48 w-full object-cover rounded-lg"
          src="https://via.placeholder.com/300"
          alt="Gallery"
        />
        <img
          className="h-48 w-full object-cover rounded-lg"
          src="https://via.placeholder.com/300"
          alt="Gallery"
        />
      </div>
    </div>
  );
};

export default ProfileGallery;
