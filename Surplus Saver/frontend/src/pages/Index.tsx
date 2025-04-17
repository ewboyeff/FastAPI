
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LeafIcon, ShoppingBag, Store, ArrowRight } from 'lucide-react';
import NavBar from '@/components/NavBar';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-green-50 to-white pt-12 pb-24 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <LeafIcon className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome to SurplusSaver!
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Buy surprise bags at a discount and save food from going to waste!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-md">
                <Link to="/login">
                  Login
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-md">
                <Link to="/register">
                  Register
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-green-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-green-100 p-4 rounded-full mb-4">
                      <Store className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">For Store Owners</h3>
                    <p className="text-gray-600">
                      Reduce food waste by listing your surplus food items as surprise bags. 
                      Set your own prices and help the environment while earning from products 
                      that would otherwise go to waste.
                    </p>
                    <Button asChild className="mt-6" variant="outline">
                      <Link to="/register">Register as a Store Owner</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-green-100 p-4 rounded-full mb-4">
                      <ShoppingBag className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">For Customers</h3>
                    <p className="text-gray-600">
                      Discover amazing deals on food items at a fraction of the original price.
                      Shop sustainably, save money, and join the movement to reduce food waste
                      in your community.
                    </p>
                    <Button asChild className="mt-6" variant="outline">
                      <Link to="/register">Register as a Customer</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="py-16 px-4 bg-green-100">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
            <p className="text-lg text-gray-700 mb-8">
              Join SurplusSaver today and be part of the solution to food waste.
              Every bag saved makes a difference!
            </p>
            <Button asChild size="lg">
              <Link to="/register">Get Started Now</Link>
            </Button>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">© 2025 SurplusSaver - All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
