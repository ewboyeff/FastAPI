import { toast } from "@/hooks/use-toast";
import { mockIngredients, mockMeals, mockMealPortions, mockMonthlyReport, mockMonthlyReportWithWarning, mockIngredientUsage, mockUsers, mockLogs } from "./mockData";
import { Ingredient, Meal, MealPortions, MonthlyReport, IngredientUsage } from "./types";

const API_URL = "http://127.0.0.1:8000";

// Flag to track if we're using mock data
let useMockData = false;

// Store the token in memory
let accessToken: string | null = null;

export interface ApiErrorResponse {
  detail: string | {
    msg: string;
  }[];
}

export const login = async (username: string, password: string) => {
  try {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Authentication failed");
    }

    const data = await response.json();
    // Store the token
    accessToken = data.access_token;
    return data;
  } catch (error) {
    console.error("Login error:", error);
    toast({
      title: "Login Failed",
      description: error instanceof Error ? error.message : "Failed to login. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

export const logout = () => {
  accessToken = null;
  useMockData = false;
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  if (!accessToken) {
    throw new Error("Authentication required");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...(options.headers || {}),
  };

  try {
    console.log(`Making authenticated request to: ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const statusCode = response.status;
      console.error(`Request failed with status: ${statusCode}`);
      
      // If we get a 401 Unauthorized, throw a specific error
      if (statusCode === 401) {
        throw new Error("Authentication required: 401 Unauthorized");
      }
      
      // If we get a 404 for certain endpoints, use mock data
      if (statusCode === 404) {
        console.log(`Endpoint not found: ${endpoint}, using mock data`);
        useMockData = true;
        
        // Return mock data based on the endpoint
        if (endpoint === "/users/me/") {
          throw new Error("User not found"); // We'll handle this in AuthContext
        }
        else if (endpoint === "/ingredients/") {
          return mockIngredients;
        }
        else if (endpoint === "/meals/") {
          return mockMeals;
        }
        else if (endpoint.includes("/portions/")) {
          const mealId = parseInt(endpoint.split("/")[2]);
          return mockMealPortions.find(p => p.meal_id === mealId) || { 
            meal_id: mealId, 
            meal_name: "Unknown Meal",
            portions: 0 
          };
        }
        else if (endpoint === "/api/portions/") {
          return mockMealPortions;
        }
        else if (endpoint.includes("/reports/monthly/")) {
          const parts = endpoint.split("/");
          const month = parseInt(parts[parts.length - 1]);
          // Return different mock data based on the month
          return month === 4 ? mockMonthlyReportWithWarning : mockMonthlyReport;
        }
        else if (endpoint === "/reports/ingredient-usage/") {
          return mockIngredientUsage;
        }
        else if (endpoint === "/users/") {
          return mockUsers;
        }
        else if (endpoint === "/logs/") {
          console.log("Returning mock logs for all logs");
          return mockLogs;
        }
        else if (endpoint === "/logs/user/") {
          console.log("Returning mock logs for user logs");
          // Filter logs for user actions if needed
          return mockLogs.filter(log => log.action.toLowerCase().includes("user") || 
                                        log.details.toLowerCase().includes("user"));
        }
        else if (endpoint === "/logs/meal/") {
          console.log("Returning mock logs for meal logs");
          // Filter logs for meal actions
          return mockLogs.filter(log => log.action.toLowerCase().includes("ovqat") || 
                                        log.details.toLowerCase().includes("meal"));
        }
        else if (endpoint === "/logs/ingredient/") {
          console.log("Returning mock logs for ingredient logs");
          // Filter logs for ingredient actions
          return mockLogs.filter(log => log.action.toLowerCase().includes("ingredient") || 
                                        log.details.toLowerCase().includes("ingredient"));
        }
        else if (endpoint === "/serve-meals/me/") {
          // Return mock served meals with correct meal information
          return mockMeals.map(meal => ({
            id: meal.id,
            meal_id: meal.id,
            served_at: new Date().toISOString(),
            user_id: 1,
            portions: 1,
            meal: meal,  // Include the complete meal object
            user: { id: 1, username: "admin", role: "ADMIN" }
          }));
        }
        else if (endpoint.includes("/serve-meal/") && options.method === "POST") {
          // Simulating meal serving
          const body = JSON.parse((options.body as string) || '{}');
          const mealId = parseInt(endpoint.split('/')[2]);
          
          // If portions exceed 10, throw an error
          if (body.portions && body.portions > 10) {
            throw new Error("Not enough ingredients available for this many portions");
          }
          return { success: true, meal_id: mealId };
        }
      }
      
      const errorData: ApiErrorResponse = await response.json();
      
      // Format error message
      let errorMessage = "An error occurred";
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map(item => item.msg).join(', ');
      }
      
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("API request failed:", error);
    
    // If we're already using mock data or this is a new 404,
    // return appropriate mock data based on the endpoint
    if (useMockData || error.message?.includes("Failed to fetch")) {
      useMockData = true;
      console.log(`Using mock data for endpoint: ${endpoint}`);
      
      if (endpoint === "/ingredients/") {
        return mockIngredients;
      }
      else if (endpoint === "/meals/") {
        return mockMeals;
      }
      else if (endpoint.includes("/portions/")) {
        const mealId = parseInt(endpoint.split("/")[2]);
        return mockMealPortions.find(p => p.meal_id === mealId) || { 
          meal_id: mealId, 
          meal_name: "Unknown Meal",
          portions: 0 
        };
      }
      else if (endpoint === "/api/portions/") {
        return mockMealPortions;
      }
      else if (endpoint.includes("/reports/monthly/")) {
        const parts = endpoint.split("/");
        const month = parseInt(parts[parts.length - 1]);
        // Return different mock data based on the month
        return month === 4 ? mockMonthlyReportWithWarning : mockMonthlyReport;
      }
      else if (endpoint === "/reports/ingredient-usage/") {
        return mockIngredientUsage;
      }
      else if (endpoint === "/users/") {
        return mockUsers;
      }
      else if (endpoint === "/logs/") {
        console.log("Returning mock logs for all logs");
        return mockLogs;
      }
      else if (endpoint === "/logs/user/") {
        console.log("Returning mock logs for user logs");
        // Filter logs for user actions if needed
        return mockLogs.filter(log => log.action.toLowerCase().includes("user") || 
                                     log.details.toLowerCase().includes("user"));
      }
      else if (endpoint === "/logs/meal/") {
        console.log("Returning mock logs for meal logs");
        // Filter logs for meal actions
        return mockLogs.filter(log => log.action.toLowerCase().includes("ovqat") || 
                                     log.details.toLowerCase().includes("meal"));
      }
      else if (endpoint === "/logs/ingredient/") {
        console.log("Returning mock logs for ingredient logs");
        // Filter logs for ingredient actions
        return mockLogs.filter(log => log.action.toLowerCase().includes("ingredient") || 
                                     log.details.toLowerCase().includes("ingredient"));
      }
      else if (endpoint.includes("/users/") && options.method === "POST") {
        // Simulating user creation
        return { id: mockUsers.length + 1, ...JSON.parse((options.body as string) || '{}') };
      }
      else if (endpoint.includes("/users/") && options.method === "DELETE") {
        // Simulating user deletion
        return { success: true };
      }
      else if (endpoint.includes("/serve-meal/") && options.method === "POST") {
        // Simulating meal serving
        const body = JSON.parse((options.body as string) || '{}');
        if (body.portions && body.portions > 10) {
          throw new Error("Not enough ingredients available for this many portions");
        }
        return { success: true };
      }
      else if (endpoint === "/serve-meals/me/") {
        // Return mock served meals with correct meal information
        return mockMeals.map(meal => ({
          id: meal.id,
          meal_id: meal.id,
          served_at: new Date().toISOString(),
          user_id: 1,
          portions: 1,
          meal: meal,  // Include the complete meal object
          user: { id: 1, username: "admin", role: "ADMIN" }
        }));
      }
      else if (endpoint.includes("/serve-meal/") && options.method === "POST") {
        // Simulating meal serving with meal data
        const body = JSON.parse((options.body as string) || '{}');
        const mealId = parseInt(endpoint.split('/')[2]);
        
        // If portions exceed 10, throw an error
        if (body.portions && body.portions > 10) {
          throw new Error("Not enough ingredients available for this many portions");
        }
        return { success: true, meal_id: mealId };
      }
      
      // For other endpoints that we don't have mock data for
      toast({
        title: "Backend Not Available",
        description: "This feature requires a connected backend.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Failed to complete the request.",
        variant: "destructive",
      });
    }
    
    throw error;
  }
};

export const setAuthToken = (token: string) => {
  accessToken = token;
};

export const getAuthToken = () => accessToken;

export const isUsingMockData = () => useMockData;
