
import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import MonthlySummary from "@/components/MonthlySummary";
import { Expense } from "@/types/expense";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Package, CreditCard, Shirt, Utensils, Car, ArrowDown } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Define categories with their corresponding icons
const CATEGORIES = [
  { id: "all", label: "All", icon: <Package className="mr-2" /> },
  { id: "transport", label: "Transport", icon: <Car className="mr-2" /> },
  { id: "food", label: "Food", icon: <Utensils className="mr-2" /> },
  { id: "payment", label: "Payment", icon: <CreditCard className="mr-2" /> },
  { id: "clothing", label: "Clothing", icon: <Shirt className="mr-2" /> },
  { id: "other", label: "Others", icon: <Package className="mr-2" /> },
];

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/expenses/");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Network response was not ok");
      }
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      toast.error("Xarajatlarni olishda xato yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (newExpense: Omit<Expense, "id" | "created_at" | "category">) => {
    try {
      const response = await fetch("http://localhost:8000/expenses/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newExpense),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      toast.success("Xarajat muvaffaqiyatli saqlandi");
      
      // Since fetchExpenses is failing, let's try to add the new expense to our local state
      // by getting it from the POST response
      try {
        const savedExpense = await response.json();
        setExpenses(prev => [...prev, savedExpense]);
      } catch (err) {
        // If we can't parse the response, just try fetching again
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Xarajatni saqlashda xato yuz berdi");
    }
  };

  // Calculate expenses for the last 30 days
  const calculateMonthlyTotal = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    return expenses
      .filter(expense => {
        try {
          const expenseDate = new Date(expense.created_at);
          return expenseDate >= thirtyDaysAgo;
        } catch (err) {
          // In case there's an issue parsing the date
          console.error("Date parsing error:", err);
          return false;
        }
      })
      .reduce((total, expense) => total + expense.amount, 0);
  };

  // Filter expenses by selected category
  const filteredExpenses = expenses.filter(expense => {
    if (selectedCategory === "all") return true;
    return expense.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Xarajatlarni Boshqarish</h1>
          <p className="mt-2 text-gray-600">Kunlik xarajatlaringizni samarali boshqaring</p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Xatolik yuz berdi</AlertTitle>
            <AlertDescription>
              Server bilan bog'lanishda muammo yuz berdi. Xarajatlarni ko'rish imkoni yo'q, ammo siz yangi xarajatlarni saqlay olasiz.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <ExpenseForm onAddExpense={handleAddExpense} />
          </div>
          <div className="md:col-span-1">
            <MonthlySummary total={calculateMonthlyTotal()} />
          </div>
        </div>
        
        <div className="mt-8">
          <div className="flex justify-end mb-4">
            <div className="w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kategoriyani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="flex items-center">
                      <div className="flex items-center">
                        {category.icon}
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ExpenseList expenses={filteredExpenses} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Index;
