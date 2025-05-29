
// User types
export enum UserRole {
  ADMIN = "ADMIN",
  CHEF = "CHEF",
  MANAGER = "MANAGER",
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface UserCreate {
  username: string;
  password: string;
  role?: UserRole;
}

// Ingredient types
export interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  delivery_date: string;
  minimum_quantity: number;
}

export interface IngredientCreate {
  name: string;
  quantity: number;
  delivery_date: string;
  minimum_quantity?: number;
}

export interface IngredientUpdate {
  name: string;
  quantity: number;
  delivery_date: string;
  minimum_quantity?: number;
}

// Meal types
export interface MealIngredient {
  id: number;
  ingredient_id: number;
  quantity: number;
  ingredient: Ingredient;
}

export interface MealIngredientCreate {
  ingredient_id: number;
  quantity: number;
}

export interface Meal {
  id: number;
  name: string;
  ingredients: MealIngredient[];
}

export interface MealCreate {
  name: string;
  ingredients: MealIngredientCreate[];
}

export interface MealUpdate {
  name: string;
  ingredients: MealIngredientCreate[];
}

export interface MealPortions {
  meal_id: number;
  meal_name: string;
  portions: number;
}

// Meal serving
export interface MealServe {
  id: number;
  meal_id: number;
  served_at: string;
  user_id: number;
  meal: Meal;
  user: User;
}

export interface MealServeCreate {
  meal_id: number;
}

// Reports
export interface MonthlyReport {
  year: number;
  month: number;
  total_served: number;
  total_possible: number;
  difference_percentage: number;
  warning: string | null;
}

export interface IngredientUsage {
  ingredient_id: number;
  ingredient_name: string;
  total_used: number;
  delivery_date: string;
}

// Auth
export interface LoginResponse {
  access_token: string;
  token_type: string;
}
