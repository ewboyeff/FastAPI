
import React, { useState, useEffect } from 'react';
import { SurpriseBagResponse } from '@/types/api';
import { surpriseBagApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SurpriseBagCard from './SurpriseBagCard';
import BagFilterForm from './BagFilterForm';

interface AvailableBagsProps {
  onPurchaseSuccess: () => void;
}

interface BagFilters {
  store_name?: string;
}

const AvailableBags: React.FC<AvailableBagsProps> = ({ onPurchaseSuccess }) => {
  const { toast } = useToast();
  const [bags, setBags] = useState<SurpriseBagResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<BagFilters>({});
  
  const fetchBags = async (currentFilters: BagFilters = {}) => {
    try {
      setLoading(true);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (currentFilters.store_name) {
        queryParams.append('store_name', currentFilters.store_name);
      }
      
      const queryString = queryParams.toString();
      const url = queryString ? `?${queryString}` : '';
      
      const response = await surpriseBagApi.getAll(url);
      const availableBags = response.data.filter(bag => 
        bag.status === 'available' && bag.quantity > 0
      );
      setBags(availableBags);
    } catch (error) {
      console.error('Error fetching bags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available bags. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBags(filters);
  }, []);

  const handleBagPurchased = () => {
    fetchBags(filters);
    if (onPurchaseSuccess) {
      onPurchaseSuccess();
    }
  };
  
  const handleFilter = (newFilters: BagFilters) => {
    setFilters(newFilters);
    fetchBags(newFilters);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <ShoppingBag className="mr-2 h-5 w-5 text-[#28a745]" />
          Available Surprise Bags
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchBags(filters)}
          disabled={loading}
          className="hover:scale-105 transition-transform"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-[#28a745] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading available bags...</p>
        </div>
      ) : bags.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No surprise bags available at the moment.</p>
          <p className="text-gray-500 text-sm mt-1">Check back later for new offers!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bags.map((bag) => (
            <SurpriseBagCard 
              key={bag.id} 
              bag={bag} 
              onPurchaseSuccess={handleBagPurchased} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableBags;
