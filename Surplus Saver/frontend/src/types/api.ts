
export interface LoginRequest {
  username: string; // Email is used as username
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserCreate {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'store' | 'customer';
  balance: number;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export interface DecodedToken {
  sub: string; // User ID
  name: string;
  email: string;
  phone: string;
  role: 'store' | 'customer';
  balance: number;
  exp: number; // Expiration time
}

export interface BalanceResponse {
  balance: number;
}

export interface DepositRequest {
  amount: number;
}

export interface SurpriseBagCreate {
  title: string;
  description: string;
  contents: string;
  original_price: number;
  discount_price: number;
  quantity: number;
}

export interface SurpriseBagUpdate {
  title?: string;
  description?: string;
  contents?: string;
  original_price?: number;
  discount_price?: number;
  quantity?: number;
}

export interface SurpriseBagResponse {
  id: number;
  title: string;
  description: string;
  contents: string;
  original_price: number;
  discount_price: number;
  quantity: number;
  status: 'available' | 'sold';
  store_id: number;
  store_name?: string; // Added store_name field
  created_at: string;
  image_url?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  surprise_bag: SurpriseBagResponse;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  customer_id: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_price: number;
  created_at: string;
  items: OrderItem[];
}

export interface OrderCreate {
  surprise_bag_id: number;
  quantity: number;
}

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'store' | 'customer';
  balance: number;
  created_at?: string; // Make this optional since it's not always returned
}
