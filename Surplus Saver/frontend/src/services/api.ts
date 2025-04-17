
import axios from 'axios';
import { 
  LoginRequest, 
  UserCreate, 
  UserUpdate,
  Token, 
  SurpriseBagCreate, 
  SurpriseBagResponse,
  SurpriseBagUpdate,
  Order,
  BalanceResponse,
  DepositRequest,
  OrderCreate,
  UserProfileResponse
} from '@/types/api';
import { toast } from "@/hooks/use-toast";

// Make sure backend URL is accessible
export const API_URL = 'http://127.0.0.1:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Add timeout to prevent long waiting times
  timeout: 10000,
  // Enable CORS credentials
  withCredentials: false
});

// Add request interceptor for adding auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling common errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    
    // Handle different error types
    if (error.code === 'ERR_NETWORK') {
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check if the backend is running at ' + API_URL,
        variant: 'destructive',
      });
    } else if (error.code === 'ECONNABORTED') {
      toast({
        title: 'Request Timeout',
        description: 'The server request timed out. Please try again later.',
        variant: 'destructive',
      });
    } else if (error.response) {
      // The server responded with an error status
      const errorMessage = error.response.data?.detail || 'An error occurred';
      toast({
        title: 'Server Error',
        description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        variant: 'destructive',
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authApi = {
  register: (userData: UserCreate) => {
    console.log('Sending registration data:', userData);
    return api.post('/register/', userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },
  
  login: (credentials: LoginRequest) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    return api.post<Token>('/login/', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }
};

// User profile and balance services
export const userApi = {
  getBalance: () => 
    api.get<BalanceResponse>('/user/balance/'),
  
  deposit: (amount: number) => {
    // Make sure amount is a valid number
    if (isNaN(amount) || amount <= 0) {
      return Promise.reject(new Error('Invalid amount'));
    }
    // Use query parameters instead of request body
    return api.post<BalanceResponse>(`/user/deposit/?amount=${amount}`);
  },

  getProfile: () =>
    api.get<UserProfileResponse>('/user/profile/'),

  updateProfile: (userData: UserUpdate) => {
    // Filter out undefined fields
    const cleanedData = Object.fromEntries(
      Object.entries(userData).filter(([_, v]) => v !== undefined && v !== '')
    );
    
    // Handle potential API response discrepancies
    return api.put<UserProfileResponse>('/user/update/', cleanedData, {
      // Add error handling specific to this request
      validateStatus: function (status) {
        // Consider 2xx responses as successful, even if the schema doesn't fully match
        return status >= 200 && status < 300;
      }
    });
  }
};

// Surprise bag services
export const surpriseBagApi = {
  getAll: (queryString = '') => 
    api.get<SurpriseBagResponse[]>(`/surprise-bags/${queryString}`),
  
  create: (bagData: FormData) => {
    // Use FormData for multipart/form-data to support file uploads
    return api.post('/surprise-bags/', bagData, {
      headers: {
        // Let the browser set the Content-Type header for FormData
        'Content-Type': undefined
      }
    });
  },
  
  update: (bagId: number, bagData: FormData) => {
    console.log(`Updating bag ${bagId} with form data`);
    return api.put(`/surprise-bags/${bagId}/`, bagData, {
      headers: {
        // Let the browser set the Content-Type header for FormData
        'Content-Type': undefined
      }
    });
  },
  
  delete: (bagId: number) => {
    console.log(`Deleting bag with ID: ${bagId}`);
    return api.delete(`/surprise-bags/${bagId}/`);
  },
  
  buy: (bagId: number, quantity: number = 1) =>
    api.post('/orders/', { surprise_bag_id: bagId, quantity })
};

// Order services
export const orderApi = {
  getAll: () => 
    api.get<Order[]>('/orders/'),
  
  getStoreOrders: () =>
    api.get<Order[]>('/store/orders/'),
  
  cancel: (orderId: number) =>
    api.post(`/orders/cancel/${orderId}/`),
  
  confirm: (orderId: number) =>
    api.post(`/orders/confirm/${orderId}/`),
  
  complete: (orderId: number) =>
    api.post(`/orders/complete/${orderId}/`),
    
  refund: (orderId: number) =>
    api.post(`/orders/refund/${orderId}/`)
};

// JWT token utilities
export const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Utility to check if the backend server is available
export const checkServerAvailability = async () => {
  try {
    // Try a simpler GET request without OPTIONS preflight
    await axios.get(`${API_URL}/health-check/`, { 
      timeout: 5000,
      // Skip credential checks for health check
      withCredentials: false,
      // Prevent preflight OPTIONS request by using simple request
      headers: {
        'Accept': 'text/plain'
      }
    });
    return true;
  } catch (error) {
    // If the error is specifically a 400 Bad Request, the server is responding
    // but there's an issue with the request - still consider this "available"
    if (error.response && error.response.status === 400) {
      console.log('Server is available but health-check returned 400');
      return true;
    }
    console.error('Server availability check failed:', error);
    return false;
  }
};

export default api;
