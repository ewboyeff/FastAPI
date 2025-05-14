
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlySummaryProps {
  total: number;
}

const MonthlySummary = ({ total }: MonthlySummaryProps) => {
  return (
    <Card className="shadow-md bg-gradient-to-br from-expense-lightBlue to-blue-50">
      <CardHeader>
        <CardTitle className="text-center text-gray-700">Oylik hisobot</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-gray-600">Oxirgi 30 kun</p>
        <div className="mt-2 font-bold text-3xl text-expense-blue">
          {new Intl.NumberFormat('uz-UZ').format(total)} so'm
        </div>
        <p className="mt-4 text-xs text-gray-500">Jami xarajatlar summasi</p>
      </CardContent>
    </Card>
  );
};

export default MonthlySummary;
