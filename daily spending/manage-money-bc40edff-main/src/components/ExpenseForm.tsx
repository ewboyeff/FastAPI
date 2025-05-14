
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Expense } from "@/types/expense";

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, "id" | "created_at" | "category">) => Promise<void>;
}

const ExpenseForm = ({ onAddExpense }: ExpenseFormProps) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
    amount: "",
  });

  const validateForm = () => {
    const newErrors = {
      title: "",
      amount: "",
    };
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = "Xarajat nomini kiriting";
      isValid = false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Musbat raqam kiriting";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddExpense({
        title,
        amount: parseFloat(amount),
        description: description || null,
      });
      
      // Reset form after successful submission
      setTitle("");
      setAmount("");
      setDescription("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Yangi xarajat qo'shish</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Xarajat nomi *
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`mt-1 block w-full ${errors.title ? "border-red-500" : ""}`}
              placeholder="Masalan: Oziq-ovqat"
              disabled={isSubmitting}
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Summa *
            </label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`mt-1 block w-full ${errors.amount ? "border-red-500" : ""}`}
              placeholder="50000"
              min="0"
              step="0.01"
              disabled={isSubmitting}
            />
            {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Tavsif (ixtiyoriy)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full"
              placeholder="Qo'shimcha ma'lumot kiriting..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-expense-blue hover:bg-blue-700 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;
