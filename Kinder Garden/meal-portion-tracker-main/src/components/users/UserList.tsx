
import { User, UserRole } from "@/lib/types";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UserListProps {
  users: User[];
  isLoading: boolean;
  onUserDeleted: () => void;
}

export const UserList = ({ users, isLoading, onUserDeleted }: UserListProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Function to get role badge color
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "destructive";
      case UserRole.MANAGER:
        return "default";
      case UserRole.CHEF:
        return "secondary";
      default:
        return "outline";
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsDeleting(true);
    try {
      await fetchWithAuth(`/users/${selectedUser.id}/`, {
        method: "DELETE",
      });
      onUserDeleted();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Foydalanuvchini o'chirib bo'lmadi",
        description: error instanceof Error ? error.message : "Foydalanuvchini o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setSelectedUser(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="border rounded-md">
        <div className="p-4">
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <div className="border rounded-md p-6 text-center">
        <h3 className="text-lg font-medium">Foydalanuvchilar mavjud emas</h3>
        <p className="text-muted-foreground mt-2">
          Hozirda foydalanuvchilar ro'yxati bo'sh
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableCaption>Ro'yxatda {users.length} ta foydalanuvchi</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Foydalanuvchi nomi</TableHead>
            <TableHead>Roli</TableHead>
            <TableHead className="text-right">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.id}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {currentUser?.id !== user.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedUser(user)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        O'chirish
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>
                          Siz rostdan ham {user.username} foydalanuvchisini o'chirmoqchimisiz? 
                          Bu amalni ortga qaytarib bo'lmaydi.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteUser}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};
