
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, RefreshCw, LogOut, Pencil, Image as ImageIcon } from 'lucide-react';
import { surpriseBagApi, orderApi } from '@/services/api';
import { SurpriseBagCreate, SurpriseBagResponse, Order } from '@/types/api';
import NavBar from '@/components/NavBar';
import Balance from '@/components/Balance';
import UserProfile from '@/components/UserProfile';
import UpdateBagDialog from '@/components/UpdateBagDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFormValidation } from '@/hooks/useFormValidation';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const bagFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  contents: z.string().min(1, "Contents are required"),
  original_price: z.coerce.number()
    .positive("Original price must be positive")
    .min(0.01, "Original price must be at least 0.01"),
  discount_price: z.coerce.number()
    .positive("Discount price must be positive")
    .min(0.01, "Discount price must be at least 0.01"),
  quantity: z.coerce.number()
    .int("Quantity must be an integer")
    .positive("Quantity must be positive"),
}).refine(data => {
  return data.discount_price < data.original_price;
}, {
  message: "Discount price must be less than original price",
  path: ["discount_price"],
});

const Store: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateImageFile } = useFormValidation();
  
  const [bags, setBags] = useState<SurpriseBagResponse[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingBags, setIsLoadingBags] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSubmittingBag, setIsSubmittingBag] = useState(false);
  const [isDeletingBag, setIsDeletingBag] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [editingBag, setEditingBag] = useState<SurpriseBagResponse | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof bagFormSchema>>({
    resolver: zodResolver(bagFormSchema),
    defaultValues: {
      title: "",
      description: "",
      contents: "",
      original_price: 0,
      discount_price: 0,
      quantity: 1,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!validateImageFile(file)) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fetchBags = async () => {
    try {
      setIsLoadingBags(true);
      const response = await surpriseBagApi.getAll();
      setBags(response.data);
    } catch (error) {
      console.error('Error fetching bags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load surprise bags. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBags(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const response = await orderApi.getStoreOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching store orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchBags();
    fetchOrders();
  }, []);

  const onSubmitBag = async (values: z.infer<typeof bagFormSchema>) => {
    try {
      setIsSubmittingBag(true);
      
      // Create FormData object
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('contents', values.contents);
      formData.append('original_price', values.original_price.toString());
      formData.append('discount_price', values.discount_price.toString());
      formData.append('quantity', values.quantity.toString());
      
      // Add image if one is selected
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      await surpriseBagApi.create(formData);
      
      toast({
        title: 'Success',
        description: 'Surprise bag created successfully!',
      });
      
      // Reset form and image
      form.reset({
        title: "",
        description: "",
        contents: "",
        original_price: 0,
        discount_price: 0,
        quantity: 1,
      });
      
      handleRemoveImage();
      
      fetchBags();
    } catch (error) {
      console.error('Error creating bag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create surprise bag. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingBag(false);
    }
  };

  const handleDeleteBag = async (bagId: number) => {
    try {
      setIsDeletingBag(bagId);
      await surpriseBagApi.delete(bagId);
      
      toast({
        title: 'Success',
        description: 'Surprise bag deleted successfully!',
      });
      
      fetchBags();
    } catch (error) {
      console.error('Error deleting bag:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete surprise bag. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingBag(null);
    }
  };

  const handleEditBag = (bag: SurpriseBagResponse) => {
    setEditingBag(bag);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingBag(null);
  };

  const handleProfileUpdate = () => {
    window.location.reload();
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setBalance(newBalance);
  };

  const formatPrice = (price: number | undefined) => {
    return price !== undefined ? price.toFixed(2) : '0.00';
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

  const getApiImageUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000${path}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar>
        <Button variant="outline" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </NavBar>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          Store Dashboard - Welcome, {user?.name || 'Store Owner'}!
        </h1>
        
        <Tabs defaultValue="bags" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bags">Surprise Bags</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bags" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Balance onBalanceUpdate={handleBalanceUpdate} showRefreshButton={true} />
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Add New Surprise Bag</CardTitle>
                    <CardDescription>
                      Create a new surprise bag to offer to customers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitBag)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Fruit Bag" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="A bag of fresh fruits" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contents"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contents</FormLabel>
                              <FormControl>
                                <Input placeholder="Apples, bananas" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="original_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Original Price</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0.01" 
                                  placeholder="20.00"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="discount_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Price</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0.01" 
                                  placeholder="10.00"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  placeholder="5"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="space-y-2">
                          <Label htmlFor="image">Image (Optional)</Label>
                          <div className="flex flex-col space-y-2">
                            {imagePreview && (
                              <div className="relative w-full h-48 mb-2 border rounded-md overflow-hidden">
                                <img 
                                  src={imagePreview}
                                  alt="Preview" 
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={handleRemoveImage}
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                            
                            {!imagePreview && (
                              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md">
                                <div className="flex flex-col items-center">
                                  <ImageIcon className="w-8 h-8 text-gray-400" />
                                  <span className="mt-2 text-sm text-gray-500">No image selected</span>
                                </div>
                              </div>
                            )}
                            
                            <Input
                              id="image"
                              name="image"
                              type="file"
                              ref={fileInputRef}
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={handleImageChange}
                              className="cursor-pointer"
                            />
                            <p className="text-xs text-gray-500">Max size: 5MB. Formats: JPG, PNG, GIF, WebP</p>
                          </div>
                        </div>
                        
                        <Button type="submit" disabled={isSubmittingBag}>
                          {isSubmittingBag ? (
                            <>
                              <span className="mr-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Bag
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Your Surprise Bags</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchBags} 
                      disabled={isLoadingBags}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingBags ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingBags ? (
                      <div className="text-center py-6">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p>Loading bags...</p>
                      </div>
                    ) : bags.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No surprise bags found. Create one to get started!</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Image</TableHead>
                              <TableHead>Title</TableHead>
                              <TableHead>Original Price</TableHead>
                              <TableHead>Discount Price</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bags.map((bag) => (
                              <TableRow key={bag.id}>
                                <TableCell>
                                  {bag.image_url ? (
                                    <img 
                                      src={getApiImageUrl(bag.image_url)} 
                                      alt={bag.title}
                                      className="w-16 h-16 object-cover rounded-md"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                                      <ImageIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">{bag.title}</TableCell>
                                <TableCell>${formatPrice(bag.original_price)}</TableCell>
                                <TableCell>${formatPrice(bag.discount_price)}</TableCell>
                                <TableCell>{bag.quantity}</TableCell>
                                <TableCell>
                                  <Badge variant={bag.status === 'available' ? 'outline' : 'secondary'}>
                                    {bag.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditBag(bag)}
                                    >
                                      <Pencil className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="destructive" 
                                          size="sm"
                                          disabled={isDeletingBag === bag.id}
                                        >
                                          {isDeletingBag === bag.id ? (
                                            <>
                                              <span className="mr-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                              Deleting...
                                            </>
                                          ) : (
                                            <>
                                              <Trash2 className="h-4 w-4 mr-1" />
                                              Delete
                                            </>
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the surprise bag.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteBag(bag.id)}>
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="orders">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Store Orders</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchOrders} 
                  disabled={isLoadingOrders}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {isLoadingOrders ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No orders found.</p>
                  <p className="text-gray-500 text-sm mt-1">Orders will appear here when customers buy your surprise bags.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Collapsible key={order.id} className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          <div className="mr-4">
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="text-left">
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-gray-500">
                              Customer #{order.customer_id} - {new Date(order.created_at).toLocaleDateString()}
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
                          <h4 className="font-medium mb-2">Order Items</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead>Contents</TableHead>
                                <TableHead>Original Price</TableHead>
                                <TableHead>Discount Price</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    {item.surprise_bag ? (
                                      <div>
                                        <p className="font-medium">{item.surprise_bag.title}</p>
                                        <p className="text-xs text-gray-500">{item.surprise_bag.description}</p>
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 italic">Surprise Bag no longer available</p>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {item.surprise_bag?.image_url ? (
                                      <img 
                                        src={getApiImageUrl(item.surprise_bag.image_url)} 
                                        alt={item.surprise_bag.title}
                                        className="w-16 h-16 object-cover rounded-md"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {item.surprise_bag?.contents || 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    ${formatPrice(item.surprise_bag?.original_price)}
                                  </TableCell>
                                  <TableCell>
                                    ${formatPrice(item.surprise_bag?.discount_price)}
                                  </TableCell>
                                  <TableCell>
                                    {item.quantity}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    ${formatPrice(item.price)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="profile">
            <UserProfile onProfileUpdate={handleProfileUpdate} />
          </TabsContent>
        </Tabs>
      </main>

      {editingBag && (
        <UpdateBagDialog
          bag={editingBag}
          isOpen={isEditDialogOpen}
          onClose={handleEditDialogClose}
          onSuccess={fetchBags}
        />
      )}
    </div>
  );
};

export default Store;
