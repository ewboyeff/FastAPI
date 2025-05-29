import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Meal, MealServe } from "@/lib/types";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const ServedMeals = () => {
  const queryClient = useQueryClient();
  const [selectedMealId, setSelectedMealId] = useState<string>("");
  const [portions, setPortions] = useState<number>(1);

  // Query to fetch all available meals
  const {
    data: meals,
    isLoading: mealsLoading,
    isError: mealsError,
    error: mealsErrorData
  } = useQuery({
    queryKey: ["meals"],
    queryFn: async () => {
      return await fetchWithAuth("/meals/") as Meal[];
    }
  });

  // Add new function to combine same meals
  const combineMealPortions = (servedMeals: MealServe[]) => {
    const combined = servedMeals.reduce((acc: MealServe[], current) => {
      const existingMeal = acc.find(meal => meal.meal_id === current.meal_id);
      
      if (existingMeal) {
        existingMeal.portions = (existingMeal.portions || 0) + (current.portions || 0);
        return acc;
      }
      
      return [...acc, current];
    }, []);

    return combined;
  };

  // Query to fetch user's served meals history
  const {
    data: servedMeals,
    isLoading: servedMealsLoading,
    isError: servedMealsError,
    error: servedMealsErrorData
  } = useQuery({
    queryKey: ["served-meals"],
    queryFn: async () => {
      try {
        const result = await fetchWithAuth("/serve-meals/me/") as MealServe[];
        
        if (!result || !Array.isArray(result)) {
          return [];
        }
        
        const processedMeals = result.map(servedMeal => {
          const mealDetails = meals?.find(meal => meal.id === servedMeal.meal_id);
          
          return {
            ...servedMeal,
            meal: servedMeal.meal || {
              id: servedMeal.meal_id,
              name: mealDetails?.name || "Unknown Meal",
              ingredients: mealDetails?.ingredients || []
            },
            user: servedMeal.user || { id: 1, username: "admin", role: "ADMIN" }
          };
        });

        // Combine portions for same meals
        return combineMealPortions(processedMeals);
      } catch (error) {
        console.error("Error fetching served meals:", error);
        return [];
      }
    },
    enabled: !!meals // Only run this query when meals data is available
  });

  // Mutation to serve a meal
  const serveMealMutation = useMutation({
    mutationFn: async ({ mealId, portions }: { mealId: number, portions: number }) => {
      return await fetchWithAuth(`/serve-meal/${mealId}/`, {
        method: "POST",
        body: JSON.stringify({ meal_id: mealId, portions }),
      });
    },
    onSuccess: (_, variables) => {
      // Find the full meal object that was served
      const selectedMeal = meals?.find(meal => meal.id === variables.mealId);
      
      if (!selectedMeal) {
        console.error(`Could not find meal with ID ${variables.mealId}`);
        toast(`Meal served successfully`);
        return;
      }
      
      console.log(`Served meal: ${selectedMeal.name} (ID: ${variables.mealId})`);
      
      // Create a new served meal entry with the complete meal info
      const newServedMeal = {
        id: Date.now(), // Use timestamp as a temporary ID
        meal_id: variables.mealId,
        served_at: new Date().toISOString(),
        user_id: 1, // Assuming current user ID is 1
        portions: variables.portions,
        meal: selectedMeal, // Use the entire meal object
        user: { id: 1, username: "admin", role: "ADMIN" }
      };
      
      // Manually update the query cache to immediately show the new served meal
      const currentData = queryClient.getQueryData<MealServe[]>(["served-meals"]) || [];
      queryClient.setQueryData(["served-meals"], [newServedMeal, ...currentData]);
      
      // Also invalidate the queries to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["served-meals"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] }); // Invalidate ingredients as they might change
      
      toast(`Successfully served ${selectedMeal.name}`);
      setSelectedMealId("");
      setPortions(1);
    },
    onError: (error) => {
      toast("Failed to serve meal", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  });

  const handleServeMeal = () => {
    if (!selectedMealId) {
      toast("Please select a meal first");
      return;
    }
    
    if (portions < 1) {
      toast("Please enter a valid number of portions (minimum 1)");
      return;
    }
    
    serveMealMutation.mutate({ 
      mealId: parseInt(selectedMealId),
      portions: portions
    });
  };

  const handlePortionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setPortions(isNaN(value) ? 1 : Math.max(1, value));
  };

  const isLoading = mealsLoading || servedMealsLoading || serveMealMutation.isPending;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Served Meals</h1>

        {(mealsError || servedMealsError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {mealsError && (mealsErrorData instanceof Error ? mealsErrorData.message : "Failed to load meals")}
              {servedMealsError && (servedMealsErrorData instanceof Error ? servedMealsErrorData.message : "Failed to load served meals history")}
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-md p-4 space-y-4">
          <h2 className="text-xl font-semibold">Serve a New Meal</h2>
          
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Select Meal</label>
              <Select value={selectedMealId} onValueChange={setSelectedMealId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a meal to serve" />
                </SelectTrigger>
                <SelectContent>
                  {meals?.map(meal => (
                    <SelectItem key={meal.id} value={meal.id.toString()}>
                      {meal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium mb-1">Portions</label>
              <Input 
                type="number" 
                value={portions} 
                onChange={handlePortionsChange}
                min={1} 
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleServeMeal} 
              disabled={mealsLoading || servedMealsLoading || serveMealMutation.isPending || !selectedMealId}
            >
              {(mealsLoading || servedMealsLoading || serveMealMutation.isPending) ? 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Serve Meal
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Served Meals History</h2>
          
          {servedMealsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : servedMeals && servedMeals.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meal Name</TableHead>
                    <TableHead>Total Portions</TableHead>
                    <TableHead>Last Served At</TableHead>
                    <TableHead>Served By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servedMeals.map((servedMeal) => (
                    <TableRow key={servedMeal.id}>
                      <TableCell className="font-medium">
                        {servedMeal.meal?.name || "Unknown Meal"}
                      </TableCell>
                      <TableCell>
                        {servedMeal.portions || 0}
                      </TableCell>
                      <TableCell>
                        {servedMeal.served_at ? format(new Date(servedMeal.served_at), "PPpp") : "Unknown Date"}
                      </TableCell>
                      <TableCell>
                        {servedMeal.user?.username || "Unknown User"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed rounded-md text-gray-500">
              No served meals found. Use the form above to serve a meal.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ServedMeals;