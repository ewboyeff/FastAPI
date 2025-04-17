
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Menu, 
  X, 
  Home, 
  ShoppingBag, 
  Package, 
  User, 
  Wallet, 
  LeafIcon 
} from 'lucide-react';
import { useState, ReactNode } from 'react';

interface NavBarProps {
  children?: ReactNode;
}

const NavBar = ({ children }: NavBarProps) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-[#28a745] text-white shadow-md shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to={user?.role === 'store' ? '/store' : '/customer'} className="flex items-center space-x-2 hover:opacity-90 transition">
            <LeafIcon className="h-6 w-6" />
            <span className="font-bold text-lg">SurplusSaver</span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user?.role === 'customer' && (
              <>
                <Link 
                  to="/customer" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive('/customer') 
                      ? 'bg-[#1e7e34] text-white' 
                      : 'hover:bg-[#218838] hover:text-white'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                
                <Link 
                  to="/customer/orders" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive('/customer/orders') 
                      ? 'bg-[#1e7e34] text-white' 
                      : 'hover:bg-[#218838] hover:text-white'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span>Orders</span>
                </Link>
                
                <Link 
                  to="/customer/balance" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive('/customer/balance') 
                      ? 'bg-[#1e7e34] text-white' 
                      : 'hover:bg-[#218838] hover:text-white'
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  <span>Balance</span>
                </Link>
                
                <Link 
                  to="/customer/profile" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive('/customer/profile') 
                      ? 'bg-[#1e7e34] text-white' 
                      : 'hover:bg-[#218838] hover:text-white'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                
                <Button 
                  variant="outline" 
                  onClick={logout}
                  className="bg-white hover:bg-gray-100 text-[#28a745] border-transparent hover:text-[#218838] hover:scale-105 transition-transform"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
            
            {children}
            
            {!isAuthenticated && (
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-white/90 text-[#28a745] font-medium border-transparent"
                  asChild
                >
                  <Link to="/login">Login</Link>
                </Button>
                
                <Button 
                  className="bg-white hover:bg-white/90 text-[#28a745] font-medium border-transparent"
                  asChild
                >
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={toggleMenu} 
            className="md:hidden text-white focus:outline-none"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-3 space-y-2 animate-fade-in">
            {isAuthenticated && user?.role === 'customer' && (
              <>
                <Link 
                  to="/customer" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                    isActive('/customer') ? 'bg-[#1e7e34]' : 'hover:bg-[#218838]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </Link>

                <Link 
                  to="/customer/orders" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                    isActive('/customer/orders') ? 'bg-[#1e7e34]' : 'hover:bg-[#218838]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package className="h-5 w-5" />
                  <span>Orders</span>
                </Link>
                
                <Link 
                  to="/customer/balance" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                    isActive('/customer/balance') ? 'bg-[#1e7e34]' : 'hover:bg-[#218838]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Wallet className="h-5 w-5" />
                  <span>Balance</span>
                </Link>
                
                <Link 
                  to="/customer/profile" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                    isActive('/customer/profile') ? 'bg-[#1e7e34]' : 'hover:bg-[#218838]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                
                <button 
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }} 
                  className="w-full text-left px-3 py-2 hover:bg-[#218838] rounded-md flex items-center space-x-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            )}
            
            {!isAuthenticated && (
              <div className="space-y-2 px-3">
                <Button 
                  variant="outline" 
                  className="w-full bg-white hover:bg-white/90 text-[#28a745] mb-2"
                  asChild
                >
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                </Button>
                
                <Button 
                  className="w-full bg-white hover:bg-white/90 text-[#28a745]"
                  asChild
                >
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
