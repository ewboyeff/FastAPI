
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, decodeToken } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { DecodedToken, LoginRequest, UserCreate } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: DecodedToken | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for token and validate on initial load
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = decodeToken(token);
      if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
        setUser(decodedToken);
      } else {
        // Token expired
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      const response = await authApi.login(credentials);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      
      const decodedToken = decodeToken(access_token);
      setUser(decodedToken);
      
      // Navigate based on user role
      if (decodedToken.role === 'store') {
        navigate('/store');
      } else {
        navigate('/customer');
      }
      
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${decodedToken.name}!`,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'Incorrect email or password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserCreate) => {
    try {
      setLoading(true);
      await authApi.register(userData);
      toast({
        title: 'Registration Successful',
        description: 'You can now log in with your credentials',
      });
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      const errorMsg = error.response?.data?.detail || 'Registration failed';
      let description = '';
      
      if (Array.isArray(errorMsg)) {
        description = errorMsg.map(err => err.msg).join(', ');
      } else {
        description = errorMsg;
      }
      
      toast({
        title: 'Registration Failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
