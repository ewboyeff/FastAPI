
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please contact an administrator if you believe this is an error.
        </p>
        <div className="space-x-4">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
          >
            Go Back
          </Button>
          <Button 
            onClick={() => navigate("/dashboard")} 
            className="bg-kitchen-primary hover:bg-kitchen-primary/90"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
