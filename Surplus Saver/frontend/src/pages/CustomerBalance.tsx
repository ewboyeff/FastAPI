
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NavBar from '@/components/NavBar';
import Balance from '@/components/Balance';
import DepositForm from '@/components/DepositForm';

const CustomerBalance = () => {
  const [balance, setBalance] = useState<number | null>(null);

  const handleBalanceUpdate = (newBalance: number) => {
    setBalance(newBalance);
  };

  const handleDepositSuccess = (newBalance: number) => {
    setBalance(newBalance);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          Manage Balance
        </h1>
        
        <div className="max-w-md mx-auto">
          <Card className="mb-8 shadow-md rounded-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Balance</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <Balance 
                onBalanceUpdate={handleBalanceUpdate} 
                showRefreshButton={true} 
              />
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Deposit Balance</h3>
                <DepositForm onSuccess={handleDepositSuccess} />
              </div>
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

export default CustomerBalance;
