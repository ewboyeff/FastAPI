import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { IngredientCreate, IngredientUpdate } from "@/lib/types";

// Define the form schema with validation
const ingredientSchema = z.object({
  name: z.string().min(1, "Name is required").transform(val => val.toLowerCase()), // Transform to lowercase
  quantity: z.number().min(0, "Please enter a valid number").optional().or(z.literal(0)), // Allow empty or 0
  minimum_quantity: z.number().min(0, "Please enter a valid number").optional().or(z.literal(0)), // Allow empty or 0
  delivery_date: z.string().min(1, "Delivery date is required"),
});

type FormValues = z.infer<typeof ingredientSchema>;

interface IngredientFormProps {
  initialData?: IngredientCreate | IngredientUpdate;
  onSubmit: (data: IngredientCreate | IngredientUpdate) => void;
}

const IngredientForm: React.FC<IngredientFormProps> = ({ 
  initialData, 
  onSubmit 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set default values for the form
  const defaultValues: FormValues = {
    name: initialData?.name ? initialData.name.toLowerCase() : "",
    quantity: initialData?.quantity !== undefined ? initialData.quantity : undefined, // undefined bo‘lsa bo‘sh qoldir
    minimum_quantity: initialData?.minimum_quantity !== undefined ? initialData.minimum_quantity : undefined, // undefined bo‘lsa bo‘sh qoldir
    delivery_date: initialData?.delivery_date || new Date().toISOString().split('T')[0],
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues,
  });
  
  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure all required fields are present before submitting
      const submissionData: IngredientCreate | IngredientUpdate = {
        name: values.name,
        quantity: values.quantity || 0, // Agar bo‘sh bo‘lsa, 0 sifatida yuborilsin
        delivery_date: values.delivery_date,
        minimum_quantity: values.minimum_quantity || 0, // Agar bo‘sh bo‘lsa, 0 sifatida yuborilsin
      };
      
      await onSubmit(submissionData);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingredient Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter ingredient name (lowercase only)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity (g)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter a number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} // Bo‘sh bo‘lsa undefined
                  value={field.value === undefined ? "" : field.value} // Undefined bo‘lsa bo‘sh qoldir
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="minimum_quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Quantity (g)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter a number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} // Bo‘sh bo‘lsa undefined
                  value={field.value === undefined ? "" : field.value} // Undefined bo‘lsa bo‘sh qoldir
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="delivery_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Saving..." : initialData ? "Update Ingredient" : "Add Ingredient"}
        </Button>
      </form>
    </Form>
  );
};

export default IngredientForm;