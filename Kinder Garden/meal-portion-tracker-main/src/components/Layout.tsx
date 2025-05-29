
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FileText, LogOut, Utensils, Beef, BarChart, Users, ChefHat, AlertCircle } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const AppSidebar = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-kitchen-primary" />
          <span className="font-bold text-lg">Kitchen Manager</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/dashboard")}>
                  <ChefHat className="w-5 h-5 mr-2" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/ingredients")}>
                  <Beef className="w-5 h-5 mr-2" />
                  <span>Ingredients</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/meals")}>
                  <Utensils className="w-5 h-5 mr-2" />
                  <span>Meals</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/served-meals")}>
                  <FileText className="w-5 h-5 mr-2" />
                  <span>Served Meals</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {hasPermission([UserRole.ADMIN, UserRole.MANAGER]) && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/reports")}>
                    <BarChart className="w-5 h-5 mr-2" />
                    <span>Reports</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {hasPermission([UserRole.ADMIN, UserRole.MANAGER]) && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/logs")}>
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>Logs</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {hasPermission([UserRole.ADMIN]) && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/users")}>
                    <Users className="w-5 h-5 mr-2" />
                    <span>Users</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {user && (
          <div className="space-y-2">
            <div className="text-sm">
              Logged in as <span className="font-medium">{user.username}</span>
              <div className="text-xs text-muted-foreground">{user.role}</div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 md:p-8 pt-4">
          <div className="flex items-center">
            <SidebarTrigger />
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};
