
import { Ingredient, Meal, MealIngredient, MealPortions, MonthlyReport, IngredientUsage, User, UserRole } from "./types";

// Mock ingredients
export const mockIngredients: Ingredient[] = [
  {
    id: 1,
    name: "Un",
    quantity: 50.0,
    delivery_date: "2025-05-10",
    minimum_quantity: 10.0
  },
  {
    id: 2,
    name: "Go'sht",
    quantity: 30.0,
    delivery_date: "2025-05-12",
    minimum_quantity: 5.0
  },
  {
    id: 3,
    name: "Guruch",
    quantity: 100.0,
    delivery_date: "2025-05-13",
    minimum_quantity: 20.0
  }
];

// Mock meals
export const mockMeals: Meal[] = [
  {
    id: 1,
    name: "Palov",
    ingredients: [
      {
        id: 1,
        ingredient_id: 3,
        quantity: 0.5,
        ingredient: mockIngredients[2]
      },
      {
        id: 2,
        ingredient_id: 2,
        quantity: 0.3,
        ingredient: mockIngredients[1]
      }
    ]
  },
  {
    id: 2,
    name: "Non",
    ingredients: [
      {
        id: 3,
        ingredient_id: 1,
        quantity: 0.2,
        ingredient: mockIngredients[0]
      }
    ]
  }
];

// Mock meal portions
export const mockMealPortions: MealPortions[] = [
  {
    meal_id: 1,
    meal_name: "Palov",
    portions: 30
  },
  {
    meal_id: 2,
    meal_name: "Non",
    portions: 50
  }
];

// Mock monthly report
export const mockMonthlyReport: MonthlyReport = {
  year: 2025,
  month: 5,
  total_served: 340,
  total_possible: 400,
  difference_percentage: 15,
  warning: null
};

// Mock monthly report with warning
export const mockMonthlyReportWithWarning: MonthlyReport = {
  year: 2025,
  month: 4,
  total_served: 300,
  total_possible: 400,
  difference_percentage: 25,
  warning: "Porsiyalar miqdori 25% kam tayyorlangan. Keyingi oy uchun resurslarni tekshiring."
};

// Mock ingredient usage
export const mockIngredientUsage: IngredientUsage[] = [
  {
    ingredient_id: 1,
    ingredient_name: "Un",
    total_used: 45.0,
    delivery_date: "2025-05-10"
  },
  {
    ingredient_id: 2,
    ingredient_name: "Go'sht",
    total_used: 25.0,
    delivery_date: "2025-05-12"
  },
  {
    ingredient_id: 3,
    ingredient_name: "Guruch",
    total_used: 70.0,
    delivery_date: "2025-05-13"
  }
];

// Mock users
export const mockUsers: User[] = [
  {
    id: 1,
    username: "admin",
    role: UserRole.ADMIN
  },
  {
    id: 2,
    username: "chef1",
    role: UserRole.CHEF
  },
  {
    id: 3,
    username: "manager1",
    role: UserRole.MANAGER
  }
];

// Mock logs
export const mockLogs = [
  {
    id: 1,
    action: "USER_LOGIN",
    user_id: 1,
    user_username: "admin",
    details: "User logged in",
    timestamp: "2025-05-15T10:30:00Z"
  },
  {
    id: 2,
    action: "INGREDIENT_ADD",
    user_id: 1,
    user_username: "admin",
    details: "Added 50kg of Un",
    timestamp: "2025-05-15T11:15:00Z"
  },
  {
    id: 3,
    action: "MEAL_SERVE",
    user_id: 2,
    user_username: "chef1",
    details: "Served 2 portions of Palov",
    timestamp: "2025-05-15T12:00:00Z"
  },
  {
    id: 4,
    action: "INGREDIENT_UPDATE",
    user_id: 3,
    user_username: "manager1",
    details: "Updated Go'sht quantity to 30kg",
    timestamp: "2025-05-15T14:20:00Z"
  },
  {
    id: 5,
    action: "MEAL_ADD",
    user_id: 1,
    user_username: "admin",
    details: "Added new meal: Shorva",
    timestamp: "2025-05-15T15:45:00Z"
  },
  {
    id: 6,
    action: "USER_ADD",
    user_id: 1,
    user_username: "admin",
    details: "Added new user: cook1 with CHEF role",
    timestamp: "2025-05-16T09:10:00Z"
  },
  {
    id: 7,
    action: "MEAL_SERVE",
    user_id: 2,
    user_username: "chef1",
    details: "Served 5 portions of Non",
    timestamp: "2025-05-16T11:30:00Z"
  }
];
