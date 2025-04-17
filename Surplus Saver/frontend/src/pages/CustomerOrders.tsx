
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { Order } from '@/types/api';
import { orderApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import { API_URL } from '@/services/api';
import { format } from 'date-fns';

const CustomerOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#ffc107] text-black';
      case 'confirmed':
        return 'bg-[#28a745] text-white';
      case 'completed':
        return 'bg-[#007bff] text-white';
      case 'cancelled':
        return 'bg-[#dc3545] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy, h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  const handleOrderAction = async (orderId: number, action: 'cancel' | 'confirm' | 'complete' | 'refund') => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'cancel':
          await orderApi.cancel(orderId);
          toast({ title: "Order cancelled!" });
          break;
        case 'confirm':
          await orderApi.confirm(orderId);
          toast({ title: "Order confirmed!" });
          break;
        case 'complete':
          await orderApi.complete(orderId);
          toast({ title: "Order completed!" });
          break;
        case 'refund':
          await orderApi.refund(orderId);
          toast({ title: "Order refunded!" });
          break;
      }
      
      // Refresh orders after action
      fetchOrders();
    } catch (error) {
      console.error(`Error with ${action} action on order:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
            <Button 
              variant="outline"
              onClick={fetchOrders}
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
              <p>Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">You don't have any orders yet.</p>
              <p className="text-gray-500 text-sm mt-1">Browse our available bags to place an order!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                      <div>
                        <p className="font-semibold text-lg">Order #{order.id}</p>
                        <p className="text-gray-500 text-sm">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center mt-2 md:mt-0">
                        <span className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusBadgeClass(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className="ml-4 font-semibold">${order.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mt-4 border-t pt-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4">
                          {item.surprise_bag ? (
                            <>
                              <div className="flex-shrink-0">
                                {item.surprise_bag.image_url ? (
                                  <img 
                                    src={`${API_URL}${item.surprise_bag.image_url}`}
                                    alt={item.surprise_bag.title}
                                    className="w-[50px] h-[50px] object-cover rounded-md"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = '/placeholder.svg';
                                    }}
                                  />
                                ) : (
                                  <div className="w-[50px] h-[50px] bg-gray-100 flex items-center justify-center rounded-md">
                                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium">{item.surprise_bag.title}</p>
                                <p className="text-sm text-gray-500">{item.surprise_bag.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-sm">Qty: {item.quantity}</span>
                                  <span className="text-sm text-[#28a745]">${item.surprise_bag.discount_price.toFixed(2)}</span>
                                  {item.surprise_bag.original_price > item.surprise_bag.discount_price && (
                                    <span className="text-sm line-through text-gray-400">
                                      ${item.surprise_bag.original_price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex-grow py-2 text-gray-500 italic">
                              Surprise Bag no longer available
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Order action buttons */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOrderAction(order.id, 'cancel')}
                            className="bg-[#dc3545] hover:bg-[#c82333] hover:scale-105 transition-transform"
                          >
                            Cancel Order
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOrderAction(order.id, 'confirm')}
                            className="bg-[#28a745] hover:bg-[#218838] hover:scale-105 transition-transform"
                          >
                            Confirm Order
                          </Button>
                        </>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOrderAction(order.id, 'complete')}
                          className="bg-[#007bff] hover:bg-[#0069d9] hover:scale-105 transition-transform"
                        >
                          Complete Order
                        </Button>
                      )}
                      
                      {order.status === 'completed' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOrderAction(order.id, 'refund')}
                          className="bg-[#fd7e14] hover:bg-[#e96b02] hover:scale-105 transition-transform"
                        >
                          Refund
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

export default CustomerOrders;
