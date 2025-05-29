
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchWithAuth } from "@/lib/api";
import { Ingredient, MealCreate, MealIngredientCreate } from "@/lib/types";
import { X } from "lucide-react";

interface AddMealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MealCreate) => void;
}

// Define form schema
const mealSchema = z.object({
  name: z.string().min(1, "Meal name is required"),
});

const AddMealDialog = ({ isOpen, onClose, onSubmit }: AddMealDialogProps) => {
  const [ingredients, setIngredients] = useState<MealIngredientCreate[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);

  // Fetch available ingredients for selection
  const { data: availableIngredients } = useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      return await fetchWithAuth("/ingredients/") as Ingredient[];
    }
  });

  const form = useForm<{ name: string }>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleAddIngredient = () => {
    if (!selectedIngredient || quantity <= 0) return;
    
    const selectedId = parseInt(selectedIngredient);
    
    // Check if ingredient already exists in the list
    if (ingredients.some(i => i.ingredient_id === selectedId)) {
      // Update quantity if it exists
      setIngredients(prev => prev.map(i => 
        i.ingredient_id === selectedId 
          ? { ...i, quantity: i.quantity + quantity } 
          : i
      ));
    } else {
      // Add new ingredient
      setIngredients(prev => [
        ...prev,
        { 
          ingredient_id: selectedId, 
          quantity 
        }
      ]);
    }
    
    // Reset selection
    setSelectedIngredient("");
    setQuantity(0);
  };

  const handleRemoveIngredient = (ingredientId: number) => {
    setIngredients(prev => prev.filter(i => i.ingredient_id !== ingredientId));
  };

  const handleFormSubmit = (values: { name: string }) => {
    if (ingredients.length === 0) {
      form.setError("name", { 
        type: "manual", 
        message: "At least one ingredient is required" 
      });
      return;
    }
    
    onSubmit({
      name: values.name,
      ingredients: ingredients
    });
    
    // Reset form
    form.reset();
    setIngredients([]);
  };

  const getIngredientName = (id: number) => {
    if (!availableIngredients) return `Ingredient #${id}`;
    const ingredient = availableIngredients.find(i => i.id === id);
    return ingredient ? ingredient.name : `Ingredient #${id}`;
  };

  const onDialogClose = () => {
    form.reset();
    setIngredients([]);
    setSelectedIngredient("");
    setQuantity(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Meal</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meal name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Ingredients</h3>
              
              <div className="flex gap-2">
                <div className="flex-grow">
                  <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIngredients?.map(ingredient => (
                        <SelectItem 
                          key={ingredient.id} 
                          value={String(ingredient.id)}
                          disabled={ingredients.some(i => i.ingredient_id === ingredient.id)}
                        >
                          {ingredient.name} ({ingredient.quantity}g available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={quantity || ""}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={1}
                  />
                </div>
                <Button type="button" onClick={handleAddIngredient} disabled={!selectedIngredient || quantity <= 0}>
                  Add
                </Button>
              </div>

              {ingredients.length === 0 && (
                <div className="text-center py-4 border border-dashed rounded-md text-muted-foreground">
                  No ingredients added yet
                </div>
              )}

              {ingredients.length > 0 && (
                <div className="space-y-2 mt-2">
                  <h4 className="text-sm">Added Ingredients:</h4>
                  <ul className="border rounded-md divide-y">
                    {ingredients.map((ingredient) => (
                      <li key={ingredient.ingredient_id} className="flex justify-between items-center p-2">
                        <span>
                          {getIngredientName(ingredient.ingredient_id)}: {ingredient.quantity}g
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveIngredient(ingredient.ingredient_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onDialogClose}>
                Cancel
              </Button>
              <Button type="submit">Create Meal</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMealDialog;
