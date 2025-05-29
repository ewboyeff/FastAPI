import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Meal, MealCreate } from "@/lib/types";
import MealList from "@/components/meals/MealList";
import AddMealDialog from "@/components/meals/AddMealDialog";
import EditMealDialog from "@/components/meals/EditMealDialog";
import { toast } from "sonner";

const Meals = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editMealData, setEditMealData] = useState<Meal | null>(null);
  
  // Query to fetch all meals
  const {
    data: meals,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["meals"],
    queryFn: async () => {
      const response = await fetchWithAuth("/meals/") as Meal[];
      
      // Use Promise.all to handle multiple async operations
      return Promise.all(response.map(async meal => ({
        ...meal,
        ingredients: await Promise.all(meal.ingredients.map(async ingredient => {
          // If ingredient data is nested under ingredient property
          if (ingredient.ingredient?.name) {
            return ingredient;
          }
          
          // If ingredient data is directly on the ingredient object
          if (ingredient.name) {
            return {
              ...ingredient,
              ingredient: {
                id: ingredient.ingredient_id,
                name: ingredient.name,
                quantity: ingredient.quantity || 0,
                delivery_date: ingredient.delivery_date || new Date().toISOString(),
                minimum_quantity: ingredient.minimum_quantity || 0
              }
            };
          }

          // Fetch ingredient details if we only have the ID
          try {
            const ingredientDetails = await fetchWithAuth(`/ingredients/${ingredient.ingredient_id}/`);
            return {
              ...ingredient,
              ingredient: {
                id: ingredient.ingredient_id,
                name: ingredientDetails.name || `Ingredient ${ingredient.ingredient_id}`,
                quantity: ingredientDetails.quantity || 0,
                delivery_date: ingredientDetails.delivery_date || new Date().toISOString(),
                minimum_quantity: ingredientDetails.minimum_quantity || 0
              }
            };
          } catch (error) {
            console.error(`Error fetching ingredient ${ingredient.ingredient_id}:`, error);
            return {
              ...ingredient,
              ingredient: {
                id: ingredient.ingredient_id,
                name: ingredient.name || `Ingredient ${ingredient.ingredient_id}`,
                quantity: 0,
                delivery_date: new Date().toISOString(),
                minimum_quantity: 0
              }
            };
          }
        }))
      })));
    }
  });

  // Mutation to add a new meal
  const addMealMutation = useMutation({
    mutationFn: async (newMeal: MealCreate) => {
      return await fetchWithAuth("/meals/", {
        method: "POST",
        body: JSON.stringify(newMeal),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      toast("Meal added successfully");
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast("Failed to add meal", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  });

  // Mutation to edit a meal
  const editMealMutation = useMutation({
    mutationFn: async ({ id, meal }: { id: number; meal: MealCreate }) => {
      return await fetchWithAuth(`/meals/${id}/`, {
        method: "PUT",
        body: JSON.stringify(meal),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      toast("Meal updated successfully");
      setEditMealData(null);
    },
    onError: (error) => {
      toast("Failed to update meal", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  });

  // Mutation to delete a meal
  const deleteMealMutation = useMutation({
    mutationFn: async (id: number) => {
      return await fetchWithAuth(`/meals/${id}/`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      toast("Meal deleted successfully");
    },
    onError: (error) => {
      toast("Failed to delete meal", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  });

  const handleAddMeal = (data: MealCreate) => {
    addMealMutation.mutate(data);
  };

  const handleEditMeal = (mealId: number, data: MealCreate) => {
    editMealMutation.mutate({ id: mealId, meal: data });
  };

  const handleDeleteMeal = (mealId: number) => {
    if (window.confirm("Are you sure you want to delete this meal?")) {
      deleteMealMutation.mutate(mealId);
    }
  };

  const handleOpenEditDialog = (meal: Meal) => {
    setEditMealData(meal);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Meals Management</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Meal
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load meals"}
            </AlertDescription>
          </Alert>
        )}

        {meals && meals.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No meals found. Click "Add New Meal" to create one.
          </div>
        )}

        {meals && meals.length > 0 && (
          <MealList 
            meals={meals} 
            onEdit={handleOpenEditDialog} 
            onDelete={handleDeleteMeal}
          />
        )}

        <AddMealDialog 
          isOpen={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)} 
          onSubmit={handleAddMeal}
        />

        {editMealData && (
          <EditMealDialog 
            isOpen={!!editMealData} 
            onClose={() => setEditMealData(null)} 
            onSubmit={(data) => handleEditMeal(editMealData.id, data)}
            meal={editMealData}
          />
        )}
      </div>
    </Layout>
  );
};

export default Meals;
