
export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string | null;
  description: string | null;
  created_at: string;
}
