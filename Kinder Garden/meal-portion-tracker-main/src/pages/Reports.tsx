
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { fetchWithAuth } from "@/lib/api";
import { MonthlyReport, IngredientUsage } from "@/lib/types";
import { MonthlyReportCard } from "@/components/reports/MonthlyReportCard";
import { IngredientUsageChart } from "@/components/reports/IngredientUsageChart";
import { MonthYearPicker } from "@/components/reports/MonthYearPicker";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Reports = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // 1-12
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [ingredientUsage, setIngredientUsage] = useState<IngredientUsage[]>([]);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState<boolean>(false);
  const [isLoadingUsage, setIsLoadingUsage] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchMonthlyReport = async () => {
    setIsLoadingMonthly(true);
    try {
      const data = await fetchWithAuth(`/reports/monthly/${selectedYear}/${selectedMonth}/`);
      setMonthlyReport(data);
    } catch (error) {
      console.error("Failed to fetch monthly report:", error);
      toast({
        title: "Hisobot yuklanmadi",
        description: error instanceof Error ? error.message : "Oylik hisobot ma'lumotlarini olishda xatolik yuz berdi",
        variant: "destructive",
      });
      setMonthlyReport(null);
    } finally {
      setIsLoadingMonthly(false);
    }
  };

  const fetchIngredientUsage = async () => {
    setIsLoadingUsage(true);
    try {
      const data = await fetchWithAuth("/reports/ingredient-usage/");
      setIngredientUsage(data);
    } catch (error) {
      console.error("Failed to fetch ingredient usage:", error);
      toast({
        title: "Ingredient iste'moli yuklanmadi",
        description: error instanceof Error ? error.message : "Ingredient iste'moli ma'lumotlarini olishda xatolik yuz berdi",
        variant: "destructive",
      });
      setIngredientUsage([]);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMonthlyReport();
    fetchIngredientUsage();
  }, []);

  // Re-fetch monthly report when month/year changes
  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedYear, selectedMonth]);

  const handleMonthYearChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Hisobotlar</h1>

        <Tabs defaultValue="monthly" className="w-full">
          <TabsList>
            <TabsTrigger value="monthly">Oylik Hisobotlar</TabsTrigger>
            <TabsTrigger value="usage">Ingredient Iste'moli</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Oylik Hisobot</CardTitle>
                <CardDescription>Tanlangan oy uchun tayyorlangan ovqatlar hisoboti</CardDescription>
              </CardHeader>
              <CardContent>
                <MonthYearPicker
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  onSelect={handleMonthYearChange}
                />
                
                <div className="mt-6">
                  <MonthlyReportCard 
                    report={monthlyReport} 
                    isLoading={isLoadingMonthly} 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Ingredient Iste'moli</CardTitle>
                <CardDescription>Ingredient ishlatilgan miqdorlar bo'yicha grafik</CardDescription>
              </CardHeader>
              <CardContent>
                <IngredientUsageChart 
                  data={ingredientUsage}
                  isLoading={isLoadingUsage}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reports;
