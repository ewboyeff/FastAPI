
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import AvailableBags from '@/components/AvailableBags';
import BagFilterForm from '@/components/BagFilterForm';

const Customer = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          Welcome, {user?.name || 'Customer'}!
        </h1>
        
        <BagFilterForm onFilter={() => {}} />
        
        <div className="max-w-[1200px] mx-auto">
          <AvailableBags onPurchaseSuccess={() => {}} />
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

export default Customer;
