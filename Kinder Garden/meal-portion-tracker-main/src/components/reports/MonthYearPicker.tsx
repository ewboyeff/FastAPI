
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface MonthYearPickerProps {
  selectedYear: number;
  selectedMonth: number;
  onSelect: (year: number, month: number) => void;
}

export const MonthYearPicker = ({ 
  selectedYear, 
  selectedMonth, 
  onSelect 
}: MonthYearPickerProps) => {
  // Generate years (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  
  // Month names
  const months = [
    { value: 1, label: "Yanvar" },
    { value: 2, label: "Fevral" },
    { value: 3, label: "Mart" },
    { value: 4, label: "Aprel" },
    { value: 5, label: "May" },
    { value: 6, label: "Iyun" },
    { value: 7, label: "Iyul" },
    { value: 8, label: "Avgust" },
    { value: 9, label: "Sentyabr" },
    { value: 10, label: "Oktyabr" },
    { value: 11, label: "Noyabr" },
    { value: 12, label: "Dekabr" },
  ];

  const handleYearChange = (value: string) => {
    onSelect(parseInt(value), selectedMonth);
  };

  const handleMonthChange = (value: string) => {
    onSelect(selectedYear, parseInt(value));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Yil</label>
        <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger>
            <SelectValue placeholder="Yilni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Oy</label>
        <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger>
            <SelectValue placeholder="Oyni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
