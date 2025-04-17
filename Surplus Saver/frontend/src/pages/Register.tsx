
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { LeafIcon, LockIcon, MailIcon, PhoneIcon, UserIcon, StoreIcon, AlertTriangleIcon, ServerOffIcon, RefreshCwIcon, Wallet } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkServerAvailability } from '@/services/api';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(8, { message: "Please enter a valid phone number" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(["store", "customer"], { 
    required_error: "Please select a role" 
  }),
  balance: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: "Balance cannot be negative" })
  ),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: undefined,
      balance: 0,
    },
  });

  // Check server availability on component mount
  useEffect(() => {
    const checkServer = async () => {
      setServerStatus('checking');
      const isAvailable = await checkServerAvailability();
      setServerStatus(isAvailable ? 'online' : 'offline');
    };
    
    checkServer();
  }, []);

  const handleCheckServer = async () => {
    setServerStatus('checking');
    setApiError(null);
    const isAvailable = await checkServerAvailability();
    setServerStatus(isAvailable ? 'online' : 'offline');
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      console.log('Submitting registration form with values:', values);
      await register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: values.role,
        balance: parseFloat(values.balance.toString()),
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.code === 'ERR_NETWORK') {
        setApiError("Unable to connect to the server. Please check your connection or try again later.");
      } else if (error.response) {
        // Use the error details from the response if available
        const errorData = error.response.data;
        let errorMsg = "Registration failed";
        
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData?.detail) {
          errorMsg = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : 'Registration failed. Please check your input and try again.';
        }
        
        setApiError(errorMsg);
      } else {
        setApiError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow flex items-center justify-center p-4 bg-green-50/50">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-6">
            <LeafIcon className="h-12 w-12 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-800">Join SurplusSaver</h1>
          </div>

          {serverStatus === 'offline' && (
            <Alert variant="destructive" className="mb-4">
              <ServerOffIcon className="h-4 w-4" />
              <AlertTitle>Server Unavailable</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>The backend server is not accessible. Please make sure it's running at http://127.0.0.1:8000</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="self-start" 
                  onClick={handleCheckServer}
                >
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>
                Sign up to start reducing food waste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="flex items-center relative">
                            <UserIcon className="absolute left-3 text-gray-400 h-5 w-5" />
                            <Input 
                              placeholder="John Doe" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="flex items-center relative">
                            <MailIcon className="absolute left-3 text-gray-400 h-5 w-5" />
                            <Input 
                              placeholder="your.email@example.com" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="flex items-center relative">
                            <PhoneIcon className="absolute left-3 text-gray-400 h-5 w-5" />
                            <Input 
                              placeholder="+998901234567" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="flex items-center relative">
                            <LockIcon className="absolute left-3 text-gray-400 h-5 w-5" />
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am a</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="pl-10 relative">
                              <StoreIcon className="absolute left-3 text-gray-400 h-5 w-5" />
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="store">Store Owner</SelectItem>
                            <SelectItem value="customer">Customer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Balance</FormLabel>
                        <FormControl>
                          <div className="flex items-center relative">
                            <Wallet className="absolute left-3 text-gray-400 h-5 w-5" />
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00" 
                              className="pl-10" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === '' ? '0' : e.target.value;
                                field.onChange(value);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || serverStatus === 'offline'}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="mr-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Creating Account...
                      </div>
                    ) : 'Sign Up'}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Register;
