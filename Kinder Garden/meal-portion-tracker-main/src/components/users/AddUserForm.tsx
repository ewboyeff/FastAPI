
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserRole } from "@/lib/types";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface AddUserFormProps {
  onUserAdded: () => void;
}

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Foydalanuvchi nomi kamida 3 ta belgi bo'lishi kerak",
  }),
  password: z.string().min(6, {
    message: "Parol kamida 6 ta belgi bo'lishi kerak",
  }),
  role: z.nativeEnum(UserRole),
});

type FormValues = z.infer<typeof formSchema>;

export const AddUserForm = ({ onUserAdded }: AddUserFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      role: UserRole.CHEF,
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await fetchWithAuth("/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      form.reset();
      onUserAdded();
    } catch (error) {
      console.error("Failed to create user:", error);
      toast({
        title: "Foydalanuvchi yaratilmadi",
        description: error instanceof Error ? error.message : "Foydalanuvchi yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yangi foydalanuvchi</CardTitle>
        <CardDescription>
          Yangi foydalanuvchi ma'lumotlarini kiriting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foydalanuvchi nomi</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parol</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Rol tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                      <SelectItem value={UserRole.MANAGER}>Menejer</SelectItem>
                      <SelectItem value={UserRole.CHEF}>Oshpaz</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Yaratilmoqda..."
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Foydalanuvchi qo'shish
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
