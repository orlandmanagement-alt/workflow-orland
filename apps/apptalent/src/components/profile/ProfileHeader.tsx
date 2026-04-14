import React from 'react';

const ProfileHeader = () => {
  return (
    <div className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img
            className="h-24 w-24 rounded-full object-cover"
            src="https://via.placeholder.com/150"
            alt="Talent"
          />
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Talent Name</h1>
            <p className="text-sm">Talent Title</p>
          </div>
        </div>
        <div className="flex items-center">
          <a href="#" className="text-gray-400 hover:text-white ml-4">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="#" className="text-gray-400 hover:text-white ml-4">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#" className="text-gray-400 hover:text-white ml-4">
            <i className="fab fa-facebook"></i>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
