
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { userApi } from '@/services/api';
import { Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface BalanceProps {
  onBalanceUpdate?: (balance: number) => void;
  showRefreshButton?: boolean;
}

const Balance: React.FC<BalanceProps> = ({ onBalanceUpdate, showRefreshButton = false }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      if (user?.balance !== undefined) {
        setBalance(user.balance);
        if (onBalanceUpdate) onBalanceUpdate(user.balance);
      } else {
        const response = await userApi.getBalance();
        setBalance(response.data.balance);
        if (onBalanceUpdate) onBalanceUpdate(response.data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  const formatPrice = (price: number | undefined) => {
    return price !== undefined ? price.toFixed(2) : '0.00';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Your Balance</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-emerald-600" />
          {loading ? (
            <span className="text-gray-500">Loading balance...</span>
          ) : (
            <span className="text-2xl font-bold text-emerald-600">
              ${balance !== null ? formatPrice(balance) : '0.00'}
            </span>
          )}
          
          {showRefreshButton && (
            <button 
              className="ml-4 text-sm text-gray-500 hover:text-gray-700"
              onClick={fetchBalance}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Balance;
