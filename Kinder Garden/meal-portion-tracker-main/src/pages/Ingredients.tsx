import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";
import { Ingredient, IngredientCreate, IngredientUpdate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import IngredientForm from "@/components/ingredients/IngredientForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Ingredients = () => {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // Fetch ingredients from API
  const fetchIngredients = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithAuth("/ingredients/");
      // Group ingredients by name and sum quantities
      const groupedIngredients = data.reduce((acc: Ingredient[], curr: Ingredient) => {
        const existing = acc.find(ing => ing.name.toLowerCase() === curr.name.toLowerCase());
        if (existing) {
          existing.quantity += curr.quantity;
        } else {
          acc.push({ ...curr });
        }
        return acc;
      }, []);
      setIngredients(groupedIngredients);
    } catch (error) {
      console.error("Failed to fetch ingredients:", error);
      toast({
        title: "Error",
        description: "Failed to load ingredients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load ingredients on component mount
  useEffect(() => {
    fetchIngredients();
  }, []);

  // Handle adding a new ingredient
  const handleAddIngredient = async (ingredientData: IngredientCreate) => {
    try {
      // Convert name to lowercase
      const normalizedData = { ...ingredientData, name: ingredientData.name.toLowerCase() };

      // Check if ingredient with same name already exists (case insensitive)
      const existingIngredient = ingredients.find(
        ing => ing.name.toLowerCase() === normalizedData.name
      );

      if (existingIngredient) {
        // Update existing ingredient with combined quantity
        const updatedIngredient = {
          ...existingIngredient,
          quantity: existingIngredient.quantity + normalizedData.quantity,
        };

        await fetchWithAuth(`/ingredients/${existingIngredient.id}/`, {
          method: "PUT",
          body: JSON.stringify(updatedIngredient),
        });

        toast({
          title: "Success",
          description: `Updated quantity of ${existingIngredient.name}`,
        });
      } else {
        // Add new ingredient with lowercase name
        await fetchWithAuth("/ingredients/", {
          method: "POST",
          body: JSON.stringify(normalizedData),
        });

        toast({
          title: "Success",
          description: "New ingredient added successfully",
        });
      }

      setIsAddDialogOpen(false);
      fetchIngredients();
    } catch (error) {
      console.error("Failed to add/update ingredient:", error);
      toast({
        title: "Error",
        description: "Failed to add/update ingredient",
        variant: "destructive",
      });
    }
  };

  // Handle updating an ingredient
  const handleUpdateIngredient = async (ingredientData: IngredientUpdate) => {
    if (!selectedIngredient) return;

    try {
      const normalizedData = { ...ingredientData, name: ingredientData.name.toLowerCase() };
      await fetchWithAuth(`/ingredients/${selectedIngredient.id}/`, {
        method: "PUT",
        body: JSON.stringify(normalizedData),
      });

      toast({
        title: "Success",
        description: "Ingredient updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedIngredient(null);
      fetchIngredients();
    } catch (error) {
      console.error("Failed to update ingredient:", error);
      toast({
        title: "Error",
        description: "Failed to update ingredient",
        variant: "destructive",
      });
    }
  };

  // Handle deleting an ingredient
  const handleDeleteIngredient = async () => {
    if (!selectedIngredient) return;

    try {
      await fetchWithAuth(`/ingredients/${selectedIngredient.id}/`, {
        method: "DELETE",
      });

      toast({
        title: "Success",
        description: "Ingredient deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setSelectedIngredient(null);
      fetchIngredients();
    } catch (error) {
      console.error("Failed to delete ingredient:", error);
      toast({
        title: "Error",
        description: "Failed to delete ingredient",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog and set the selected ingredient
  const openEditDialog = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsEditDialogOpen(true);
  };

  // Open delete dialog and set the selected ingredient
  const openDeleteDialog = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsDeleteDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ingredients Management</h1>
            <p className="text-muted-foreground">
              View and manage your kitchen ingredients
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Ingredient
          </Button>
        </div>

        {isLoading ? (
          <div className="grid place-items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kitchen-primary"></div>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableCaption>List of all kitchen ingredients</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity (g)</TableHead>
                  <TableHead>Minimum Quantity (g)</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No ingredients found. Add some ingredients to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  ingredients.map((ingredient) => (
                    <TableRow key={ingredient.id} className={ingredient.quantity < ingredient.minimum_quantity ? "bg-amber-50" : ""}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell className={ingredient.quantity < ingredient.minimum_quantity ? "text-amber-700 font-medium" : ""}>
                        {ingredient.quantity}
                      </TableCell>
                      <TableCell>{ingredient.minimum_quantity}</TableCell>
                      <TableCell>{formatDate(ingredient.delivery_date)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(ingredient)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog(ingredient)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Ingredient Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ingredient</DialogTitle>
            </DialogHeader>
            <IngredientForm onSubmit={handleAddIngredient} />
          </DialogContent>
        </Dialog>

        {/* Edit Ingredient Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Ingredient</DialogTitle>
            </DialogHeader>
            {selectedIngredient && (
              <IngredientForm 
                onSubmit={handleUpdateIngredient} 
                initialData={{
                  name: selectedIngredient.name,
                  quantity: selectedIngredient.quantity,
                  delivery_date: selectedIngredient.delivery_date,
                  minimum_quantity: selectedIngredient.minimum_quantity,
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the ingredient "{selectedIngredient?.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteIngredient} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Ingredients;