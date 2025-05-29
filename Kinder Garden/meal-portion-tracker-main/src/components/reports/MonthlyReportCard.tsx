
import { MonthlyReport } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, ChefHat, AlertTriangle } from "lucide-react";

interface MonthlyReportCardProps {
  report: MonthlyReport | null;
  isLoading: boolean;
}

export const MonthlyReportCard = ({ report, isLoading }: MonthlyReportCardProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <Alert variant="destructive">
        <AlertTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Hisobot mavjud emas
        </AlertTitle>
        <AlertDescription>
          Tanlangan oy va yil uchun hisobot ma'lumotlari topilmadi.
        </AlertDescription>
      </Alert>
    );
  }
  
  const { total_served, total_possible, difference_percentage, warning, year, month } = report;
  
  // Format month name
  const monthNames = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
  ];
  const monthName = monthNames[month - 1];

  const isWarning = difference_percentage > 15;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {monthName} {year}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <ChefHat className="h-6 w-6 mx-auto text-kitchen-primary" />
              <h4 className="font-medium text-sm">Tayyorlangan porsiyalar</h4>
              <p className="text-3xl font-bold">{total_served}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <BarChart className="h-6 w-6 mx-auto text-kitchen-primary" />
              <h4 className="font-medium text-sm">Mumkin bo'lgan porsiyalar</h4>
              <p className="text-3xl font-bold">{total_possible}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className={isWarning ? "border-red-500" : ""}>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                {isWarning && <AlertTriangle className="h-6 w-6 text-red-500" />}
                {!isWarning && <span className="h-6 w-6 text-green-500">%</span>}
              </div>
              <h4 className="font-medium text-sm">Farq foizi</h4>
              <p className={`text-3xl font-bold ${isWarning ? "text-red-500" : ""}`}>
                {difference_percentage}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {isWarning && warning && (
        <Alert variant="destructive">
          <AlertTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Ehtiyotkorlik kerak
          </AlertTitle>
          <AlertDescription>
            {warning}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
