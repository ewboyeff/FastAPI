
import { useToast } from './use-toast';
import { SurpriseBagUpdate } from '@/types/api';

export const useFormValidation = () => {
  const { toast } = useToast();

  const validateBagForm = (formData: SurpriseBagUpdate): boolean => {
    if (formData.title && !formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title cannot be empty',
        variant: 'destructive',
      });
      return false;
    }
    
    if (formData.description && !formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Description cannot be empty',
        variant: 'destructive',
      });
      return false;
    }
    
    if (formData.contents && !formData.contents.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Contents cannot be empty',
        variant: 'destructive',
      });
      return false;
    }
    
    if (formData.original_price && formData.original_price <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Original price must be greater than 0',
        variant: 'destructive',
      });
      return false;
    }
    
    if (formData.discount_price && formData.discount_price <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Discount price must be greater than 0',
        variant: 'destructive',
      });
      return false;
    }
    
    if (formData.original_price && formData.discount_price && 
        formData.discount_price >= formData.original_price) {
      toast({
        title: 'Validation Error',
        description: 'Discount price must be less than original price',
        variant: 'destructive',
      });
      return false;
    }
    
    if (formData.quantity && formData.quantity <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Quantity must be greater than 0',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };
  
  const validateImageFile = (file: File | null): boolean => {
    if (!file) return true; // No file is valid (image is optional)
    
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Validation Error',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return false;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Validation Error',
        description: 'Only JPG, PNG, GIF, and WebP images are allowed',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };

  return { validateBagForm, validateImageFile };
};
