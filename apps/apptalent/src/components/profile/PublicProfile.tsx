import React from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileAbout from './ProfileAbout';
import ProfileStats from './ProfileStats';
import ProfileGallery from './ProfileGallery';

const PublicProfile = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <ProfileHeader />
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <ProfileAbout />
            <div className="mt-4">
              <ProfileGallery />
            </div>
          </div>
          <div>
            <ProfileStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
