import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { userApi } from '@/services/api';
import { DecodedToken, UserUpdate } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
}).refine((data) => {
  return data.name || data.email || data.phone || data.password;
}, {
  message: "At least one field must be provided to update",
  path: ["name"],
});

interface UserProfileProps {
  onProfileUpdate?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onProfileUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
      });
    }
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setUpdateSuccess(false);
      
      // Filter out unchanged values
      const changedValues: UserUpdate = {};
      if (values.name && values.name !== user?.name) changedValues.name = values.name;
      if (values.email && values.email !== user?.email) changedValues.email = values.email;
      if (values.phone && values.phone !== user?.phone) changedValues.phone = values.phone;
      if (values.password) changedValues.password = values.password;
      
      // If nothing changed, don't make the request
      if (Object.keys(changedValues).length === 0) {
        toast({
          title: "No changes detected",
          description: "Please modify at least one field to update your profile",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Sending profile update:', changedValues);
      await userApi.updateProfile(changedValues);
      
      setUpdateSuccess(true);
      toast({
        title: "Profile updated successfully",
        description: "Your profile has been updated",
      });
      
      // Reset password field
      form.reset({ 
        name: values.name, 
        email: values.email, 
        phone: values.phone, 
        password: "" 
      });
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Could not update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">{user?.name || 'Not available'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{user?.email || 'Not available'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{user?.phone || 'Not available'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Role:</span>
            <span className="font-medium capitalize">{user?.role || 'Not available'}</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-4 text-center">Update Your Profile</h3>
        
        {updateSuccess && (
          <div className="bg-[#d4edda] text-[#155724] border border-[#c3e6cb] rounded-md p-3 mb-4">
            Profile updated successfully!
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your name" 
                      className="rounded-lg focus:border-[#28a745] focus:ring focus:ring-green-100" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your email" 
                      className="rounded-lg focus:border-[#28a745] focus:ring focus:ring-green-100" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your phone number" 
                      className="rounded-lg focus:border-[#28a745] focus:ring focus:ring-green-100" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter new password (leave blank to keep current)" 
                      className="rounded-lg focus:border-[#28a745] focus:ring focus:ring-green-100" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#28a745] hover:bg-[#218838] transition-all hover:scale-[1.02] text-white font-medium py-2 rounded-lg"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default UserProfile;
