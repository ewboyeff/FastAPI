
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import NavBar from '@/components/NavBar';
import UserProfile from '@/components/UserProfile';

const CustomerProfile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <NavBar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-[600px] mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            Your Profile
          </h1>
          
          <Card className="shadow-md rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <UserProfile onProfileUpdate={() => {}} />
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 mt-8 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <p className="text-gray-500 text-center text-sm">
            © 2025 SurplusSaver. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerProfile;
