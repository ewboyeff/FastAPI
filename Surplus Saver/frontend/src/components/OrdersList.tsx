
import React, { useState } from 'react';
import { Order } from '@/types/api';
import { orderApi, API_URL } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, RefreshCcw, PackageCheck, Clock, ShoppingBag } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface OrdersListProps {
  orders: Order[];
  onOrderUpdate: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ orders, onOrderUpdate, isLoading, onRefresh }) => {
  const { toast } = useToast();
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);

  const formatPrice = (price: number | undefined) => {
    return price !== undefined ? price.toFixed(2) : '0.00';
  };

  const calculateSavings = (original: number | undefined, discount: number | undefined) => {
    if (original === undefined || discount === undefined || original === 0) {
      return '0';
    }
    return ((original - discount) / original * 100).toFixed(0);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      setProcessingOrderId(orderId);
      await orderApi.cancel(orderId);
      
      toast({
        title: 'Success',
        description: 'Order cancelled successfully!',
      });
      
      onOrderUpdate();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleConfirmOrder = async (orderId: number) => {
    try {
      setProcessingOrderId(orderId);
      await orderApi.confirm(orderId);
      
      toast({
        title: 'Success',
        description: 'Order confirmed successfully!',
      });
      
      onOrderUpdate();
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      setProcessingOrderId(orderId);
      await orderApi.complete(orderId);
      
      toast({
        title: 'Success',
        description: 'Order completed successfully!',
      });
      
      onOrderUpdate();
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRefundOrder = async (orderId: number) => {
    try {
      setProcessingOrderId(orderId);
      await orderApi.refund(orderId);
      
      toast({
        title: 'Success',
        description: 'Order refunded successfully!',
      });
      
      onOrderUpdate();
    } catch (error) {
      console.error('Error refunding order:', error);
      toast({
        title: 'Error',
        description: 'Failed to refund order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingOrderId(null);
    }
  };
  
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const otherOrders = orders.filter(order => order.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Orders</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <PackageCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">You haven't placed any orders yet.</p>
          <p className="text-gray-500 text-sm mt-1">Browse available bags and make your first purchase!</p>
        </div>
      ) : (
        <>
          {pendingOrders.length > 0 && (
            <div className="mb-6">
              <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600" />
                <AlertTitle>Pending Orders</AlertTitle>
                <AlertDescription>
                  You have {pendingOrders.length} pending {pendingOrders.length === 1 ? 'order' : 'orders'} that need to be confirmed.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <div className="space-y-6">
            {[...pendingOrders, ...otherOrders].map((order) => (
              <Collapsible key={order.id} className="border rounded-lg overflow-hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className="mr-4">
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()} - {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="font-bold mr-4">${formatPrice(order.total_price)}</p>
                    <svg 
                      className="h-5 w-5 text-gray-400" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Contents</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Original Price</TableHead>
                          <TableHead className="text-right">You Pay</TableHead>
                          <TableHead className="text-right">Savings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                                  {item.surprise_bag?.image_url ? (
                                    <img 
                                      src={`${API_URL}${item.surprise_bag.image_url}`} 
                                      alt={item.surprise_bag.title} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/placeholder.svg';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ShoppingBag className="h-8 w-8 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{item.surprise_bag?.title || 'Surprise Bag no longer available'}</p>
                                  <p className="text-sm text-gray-500">{item.surprise_bag?.description || 'No description available'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.surprise_bag?.contents || 'Contents not available'}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right line-through text-gray-500">
                              ${formatPrice(item.surprise_bag?.original_price)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${formatPrice(item.surprise_bag?.discount_price)}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {calculateSavings(
                                item.surprise_bag?.original_price, 
                                item.surprise_bag?.discount_price
                              )}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4 flex justify-end gap-2">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmOrder(order.id)}
                            disabled={processingOrderId === order.id}
                          >
                            {processingOrderId === order.id ? (
                              <>
                                <span className="mr-2 animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
                                Processing...
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Confirm Order
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={processingOrderId === order.id}
                          >
                            {processingOrderId === order.id ? (
                              <>
                                <span className="mr-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Processing...
                              </>
                            ) : (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                Cancel Order
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleCompleteOrder(order.id)}
                            disabled={processingOrderId === order.id}
                          >
                            {processingOrderId === order.id ? (
                              <>
                                <span className="mr-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Processing...
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Complete Order
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={processingOrderId === order.id}
                          >
                            {processingOrderId === order.id ? (
                              <>
                                <span className="mr-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Processing...
                              </>
                            ) : (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                Cancel Order
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      
                      {order.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefundOrder(order.id)}
                          disabled={processingOrderId === order.id}
                        >
                          {processingOrderId === order.id ? (
                            <>
                              <span className="mr-2 animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              Refund Order
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersList;
