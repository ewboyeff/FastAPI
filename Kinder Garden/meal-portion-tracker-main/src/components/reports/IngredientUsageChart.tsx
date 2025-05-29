
import { useState } from "react";
import { IngredientUsage } from "@/lib/types";
import { 
  BarChart as LucideBarChart,
  AlertTriangle 
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface IngredientUsageChartProps {
  data: IngredientUsage[];
  isLoading: boolean;
}

export const IngredientUsageChart = ({ data, isLoading }: IngredientUsageChartProps) => {
  const [chartType, setChartType] = useState<"all" | "byDate">("all");
  
  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }
  
  if (!data || data.length === 0) {
    return (
      <Alert>
        <AlertTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Ma'lumot mavjud emas
        </AlertTitle>
        <AlertDescription>
          Ingredient iste'moli bo'yicha ma'lumotlar topilmadi.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Format data for the chart
  const chartData = data.map(item => ({
    ...item,
    name: item.ingredient_name,
    date: format(parseISO(item.delivery_date), 'dd-MM-yyyy')
  }));

  // Group data by date for the date-based chart
  const groupedByDate = chartData.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = {};
    }
    acc[item.date][item.ingredient_name] = item.total_used;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // Convert grouped data to format for stacked bar chart
  const dateChartData = Object.entries(groupedByDate).map(([date, values]) => ({
    date,
    ...values
  }));
  
  // Get all unique ingredient names for the stacked chart
  const allIngredientNames = [...new Set(data.map(item => item.ingredient_name))];
  
  // Generate colors for each ingredient
  const colors = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", 
    "#00C49F", "#FFBB28", "#FF8042", "#a4de6c"
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Ingredient iste'moli</h3>
        
        <Select 
          value={chartType} 
          onValueChange={(value) => setChartType(value as "all" | "byDate")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Grafik turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha ingredientlar</SelectItem>
            <SelectItem value="byDate">Sana bo'yicha</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="h-[400px] w-full">
        {chartType === "all" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_used" name="Ishlatilgan miqdor" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dateChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              {allIngredientNames.map((name, index) => (
                <Bar 
                  key={name} 
                  dataKey={name} 
                  stackId="a" 
                  fill={colors[index % colors.length]} 
                  name={name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
