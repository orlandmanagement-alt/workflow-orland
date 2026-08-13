import React from 'react';

const ProfileStats = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Stats</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold">1.2M</p>
          <p className="text-gray-500">Followers</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">5.6%</p>
          <p className="text-gray-500">Engagement</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">12K</p>
          <p className="text-gray-500">Likes</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileStats;
