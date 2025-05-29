
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Ingredient, Meal, MealPortions } from "@/lib/types";
import { fetchWithAuth } from "@/lib/api";
import { AlertCircle, AlertTriangle, Utensils, ChefHat } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { mockIngredients, mockMeals, mockMealPortions } from "@/lib/mockData";

const Dashboard = () => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [portions, setPortions] = useState<MealPortions[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Try to fetch from API, fall back to mock data if API fails
        try {
          const [ingredientsData, mealsData, portionsData] = await Promise.all([
            fetchWithAuth("/ingredients/"),
            fetchWithAuth("/meals/"),
            fetchWithAuth("/api/portions/")
          ]);
          setIngredients(ingredientsData);
          setMeals(mealsData);
          setPortions(portionsData);
        } catch (error) {
          console.error("Failed to fetch from API, using mock data:", error);
          // Use mock data when API fails
          setIngredients(mockIngredients);
          setMeals(mockMeals);
          setPortions(mockMealPortions);
          
          // Show toast only in production or when not using mock data intentionally
          toast({
            title: "Using offline data",
            description: "Connected to local mock data instead of backend.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Ingredient warnings (below minimum quantity)
  const lowIngredients = ingredients.filter(
    (ingredient) => ingredient.quantity < ingredient.minimum_quantity
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.username}</h1>
          <p className="text-muted-foreground">
            Here's an overview of your kitchen management system
          </p>
        </div>

        {isLoading ? (
          <div className="grid place-items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kitchen-primary"></div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Ingredients</CardTitle>
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ingredients.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Available in inventory
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
                  <ChefHat className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{meals.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Available recipes
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Low Ingredients</CardTitle>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lowIngredients.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Need restocking soon
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Critical Warnings</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lowIngredients.filter(i => i.quantity === 0).length}</div>
                  <p className="text-xs text-muted-foreground">
                    Out of stock ingredients
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Low Ingredients Warning */}
            {lowIngredients.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-800 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Low Ingredient Warnings
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    The following ingredients are running low and need restocking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lowIngredients.slice(0, 5).map((ingredient) => (
                      <div key={ingredient.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{ingredient.name}</span>
                          <span className={`text-sm ${ingredient.quantity === 0 ? "text-destructive" : "text-amber-700"}`}>
                            {ingredient.quantity} g left
                          </span>
                        </div>
                        <Progress 
                          value={(ingredient.quantity / ingredient.minimum_quantity) * 100} 
                          className={cn("h-2 bg-amber-200", ingredient.quantity === 0 ? "bg-red-500" : "bg-amber-500")} 
                        />
                      </div>
                    ))}
                    {lowIngredients.length > 5 && (
                      <p className="text-sm text-amber-700 italic mt-2">
                        And {lowIngredients.length - 5} more items...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Portions */}
            <Card>
              <CardHeader>
                <CardTitle>Available Portions</CardTitle>
                <CardDescription>
                  Maximum portions that can be prepared with current ingredients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!portions || portions.length === 0 ? (
                  <p className="text-muted-foreground">No meal data available</p>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(portions) ? portions.map((item) => (
                      <div key={item.meal_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.meal_name}</span>
                          <span>{item.portions} portions</span>
                        </div>
                        <Progress 
                          value={Math.min(item.portions * 10, 100)} 
                          className={cn(
                            "h-2",
                            item.portions === 0 ? "bg-red-500" : 
                            item.portions < 5 ? "bg-amber-500" : 
                            "bg-green-500"
                          )} 
                        />
                      </div>
                    )) : (
                      <p className="text-muted-foreground">Invalid portions data format</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
