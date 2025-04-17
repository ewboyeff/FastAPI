
import React, { useState } from 'react';
import { SurpriseBagResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Store } from 'lucide-react';
import { surpriseBagApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/services/api';

interface SurpriseBagCardProps {
  bag: SurpriseBagResponse;
  onPurchaseSuccess: () => void;
}

const SurpriseBagCard: React.FC<SurpriseBagCardProps> = ({ bag, onPurchaseSuccess }) => {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const calculateSavings = () => {
    if (bag.original_price === 0) return 0;
    return Math.round(((bag.original_price - bag.discount_price) / bag.original_price) * 100);
  };

  const handleBuy = async () => {
    if (quantity < 1 || quantity > bag.quantity) {
      toast({
        title: "Invalid quantity",
        description: `Please select between 1 and ${bag.quantity} items`,
        variant: "destructive"
      });
      return;
    }

    try {
      setPurchasing(true);
      await surpriseBagApi.buy(bag.id, quantity);
      
      toast({
        title: "Success!",
        description: "Added to order!"
      });
      
      onPurchaseSuccess();
    } catch (error) {
      console.error('Error purchasing bag:', error);
      // Toast message is handled by the axios interceptor
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Card className="w-full max-w-[250px] mx-auto overflow-hidden hover:shadow-md hover:scale-105 transition-all duration-200">
      <div className="aspect-video relative overflow-hidden bg-gray-100">
        {bag.image_url ? (
          <img 
            src={`${API_URL}${bag.image_url}`} 
            alt={bag.title}
            className="h-[150px] w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="h-[150px] w-full flex items-center justify-center bg-gray-100">
            <ShoppingBag className="h-16 w-16 text-gray-300" />
            <span className="sr-only">No image available</span>
          </div>
        )}
        {calculateSavings() > 0 && (
          <div className="absolute top-2 left-2 bg-[#28a745] text-white px-3 py-1 text-sm font-medium rounded-full">
            Save {calculateSavings()}%
          </div>
        )}
      </div>
      
      <CardContent className="space-y-2 text-center pt-4">
        <h3 className="text-base font-bold line-clamp-1">{bag.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{bag.description}</p>
        <p className="text-sm">
          <span className="font-medium">Contents:</span> {bag.contents}
        </p>
        {bag.store_name && (
          <p className="text-sm italic text-gray-500 flex items-center justify-center">
            <Store className="h-3 w-3 mr-1" />
            <span>Store: {bag.store_name}</span>
          </p>
        )}
        <div className="flex items-center justify-center space-x-2 mt-2">
          <span className="text-lg font-bold text-[#28a745]">${formatPrice(bag.discount_price)}</span>
          <span className="text-sm line-through text-gray-400">${formatPrice(bag.original_price)}</span>
        </div>
        <p className="text-sm text-gray-500">
          {bag.quantity} available
        </p>
        
        <div className="pt-3 flex flex-col space-y-2">
          <div className="flex items-center w-full gap-2">
            <div className="w-1/3">
              <Input 
                type="number" 
                min={1} 
                max={bag.quantity}
                value={quantity} 
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                disabled={purchasing}
                className="w-full text-center rounded-md"
              />
            </div>
            <Button 
              variant="default"
              onClick={handleBuy}
              disabled={purchasing || bag.quantity < 1}
              className="w-2/3 bg-[#28a745] hover:bg-[#218838] hover:scale-105 transition-all duration-200"
            >
              {purchasing ? (
                <>
                  <span className="mr-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Purchasing...
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Buy Now
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SurpriseBagCard;
