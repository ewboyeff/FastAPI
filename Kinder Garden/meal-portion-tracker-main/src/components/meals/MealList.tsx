
import { Meal } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface MealListProps {
  meals: Meal[];
  onEdit: (meal: Meal) => void;
  onDelete: (id: number) => void;
}

const MealList = ({ meals, onEdit, onDelete }: MealListProps) => {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Ingredients</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meals.map((meal) => (
            <TableRow key={meal.id}>
              <TableCell className="font-medium">{meal.name}</TableCell>
              <TableCell>
                <ul className="list-disc list-inside">
                  {meal.ingredients && meal.ingredients.map((item) => (
                    <li key={item.id}>
                      {item.ingredient && item.ingredient.name ? `${item.ingredient.name}: ${item.quantity}g` : `Ingredient ID ${item.ingredient_id}: ${item.quantity}g`}
                    </li>
                  ))}
                </ul>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" onClick={() => onEdit(meal)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => onDelete(meal.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MealList;
