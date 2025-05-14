
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense } from "@/types/expense";
import { formatDate } from "@/utils/formatDate";

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
}

const ExpenseList = ({ expenses, isLoading }: ExpenseListProps) => {
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Xarajatlar</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-64"></div>
          </div>
          <p className="mt-4 text-gray-500">Yuklanmoqda...</p>
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Xarajatlar</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Hech qanday xarajat yo'q</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Xarajatlar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 border-b">Nomi</th>
                <th className="px-4 py-2 border-b">Summa</th>
                <th className="px-4 py-2 border-b">Kategoriya</th>
                <th className="px-4 py-2 border-b">Sana</th>
                <th className="px-4 py-2 border-b">Tavsif</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">{expense.title}</td>
                  <td className="px-4 py-3 border-b font-medium">
                    {new Intl.NumberFormat('uz-UZ').format(expense.amount)} so'm
                  </td>
                  <td className="px-4 py-3 border-b">{expense.category || "—"}</td>
                  <td className="px-4 py-3 border-b">{formatDate(expense.created_at)}</td>
                  <td className="px-4 py-3 border-b">
                    {expense.description || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseList;
