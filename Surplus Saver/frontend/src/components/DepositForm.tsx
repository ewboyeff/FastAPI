
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { userApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Banknote, Plus } from 'lucide-react';

const formSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be positive")
    .min(0.01, "Amount must be at least 0.01")
});

interface DepositFormProps {
  onSuccess?: (newBalance: number) => void;
}

const DepositForm: React.FC<DepositFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [isDepositing, setIsDepositing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsDepositing(true);
      const response = await userApi.deposit(values.amount);
      
      if (response && response.data) {
        form.reset();
        
        toast({
          title: 'Deposit Successful',
          description: `Balance deposited successfully! New balance: $${response.data.balance !== undefined ? response.data.balance.toFixed(2) : '0.00'}`,
        });
        
        if (onSuccess) {
          onSuccess(response.data.balance);
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error depositing balance:', error);
      toast({
        title: 'Deposit Failed',
        description: 'There was an error depositing your balance. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Amount to deposit"
                    className="pl-9"
                    min="0.01"
                    step="0.01"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
              </div>
              <FormMessage className="mt-1" />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={isDepositing}
          className="whitespace-nowrap"
        >
          {isDepositing ? (
            <>
              <span className="mr-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Depositing...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Deposit
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default DepositForm;
