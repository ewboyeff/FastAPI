
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { UserList } from "@/components/users/UserList";
import { AddUserForm } from "@/components/users/AddUserForm";
import { User } from "@/lib/types";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithAuth("/users/");
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Foydalanuvchilar yuklanmadi",
        description: error instanceof Error ? error.message : "Foydalanuvchilar ro'yxatini olishda xatolik yuz berdi",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserAdded = () => {
    fetchUsers();
    toast({
      title: "Foydalanuvchi qo'shildi",
      description: "Yangi foydalanuvchi muvaffaqiyatli qo'shildi",
    });
  };

  const handleUserDeleted = () => {
    fetchUsers();
    toast({
      title: "Foydalanuvchi o'chirildi",
      description: "Foydalanuvchi muvaffaqiyatli o'chirildi",
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Foydalanuvchilar</h1>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <UserList 
              users={users} 
              isLoading={isLoading} 
              onUserDeleted={handleUserDeleted}
            />
          </div>
          
          <div>
            <AddUserForm onUserAdded={handleUserAdded} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Users;
