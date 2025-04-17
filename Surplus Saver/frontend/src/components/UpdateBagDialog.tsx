
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SurpriseBagResponse, SurpriseBagUpdate } from '@/types/api';
import { surpriseBagApi } from '@/services/api';
import { useFormValidation } from '@/hooks/useFormValidation';
import { Image } from 'lucide-react';

interface UpdateBagDialogProps {
  bag: SurpriseBagResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const UpdateBagDialog = ({ bag, isOpen, onClose, onSuccess }: UpdateBagDialogProps) => {
  const { toast } = useToast();
  const { validateBagForm } = useFormValidation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<SurpriseBagUpdate>({
    title: bag.title,
    description: bag.description,
    contents: bag.contents,
    original_price: bag.original_price,
    discount_price: bag.discount_price,
    quantity: bag.quantity
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(bag.image_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (['original_price', 'discount_price', 'quantity'].includes(name)) {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only JPG, PNG, GIF, and WebP images are allowed',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!validateBagForm(formData)) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare FormData
      const submitFormData = new FormData();
      
      // Only add fields that have changed
      if (formData.title !== bag.title) {
        submitFormData.append('title', formData.title || '');
      }
      
      if (formData.description !== bag.description) {
        submitFormData.append('description', formData.description || '');
      }
      
      if (formData.contents !== bag.contents) {
        submitFormData.append('contents', formData.contents || '');
      }
      
      if (formData.original_price !== bag.original_price) {
        submitFormData.append('original_price', formData.original_price?.toString() || '');
      }
      
      if (formData.discount_price !== bag.discount_price) {
        submitFormData.append('discount_price', formData.discount_price?.toString() || '');
      }
      
      if (formData.quantity !== bag.quantity) {
        submitFormData.append('quantity', formData.quantity?.toString() || '');
      }
      
      // Add image if changed
      if (imageFile) {
        submitFormData.append('image', imageFile);
      }
      
      // If image was removed but there was one before
      if (!imagePreview && bag.image_url) {
        submitFormData.append('remove_image', 'true');
      }
      
      // Check if any fields were changed
      if (submitFormData.entries().next().done) {
        toast({
          title: 'No changes detected',
          description: 'Please modify at least one field to update',
        });
        return;
      }
      
      console.log(`Sending update for bag ${bag.id}`);
      await surpriseBagApi.update(bag.id, submitFormData);
      
      toast({
        title: 'Success',
        description: 'Surprise bag updated successfully',
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating surprise bag:', error);
      
      let errorMessage = 'Failed to update surprise bag';
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Surprise Bag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={handleInputChange}
              placeholder="Fresh Vegetables Mix"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="A mix of fresh vegetables that would otherwise go to waste"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contents">Contents</Label>
            <Input
              id="contents"
              name="contents"
              value={formData.contents || ''}
              onChange={handleInputChange}
              placeholder="Tomatoes, cucumbers, bell peppers, carrots"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original_price">Original Price</Label>
              <Input
                id="original_price"
                name="original_price"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.original_price || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discount_price">Discount Price</Label>
              <Input
                id="discount_price"
                name="discount_price"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.discount_price || ''}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              value={formData.quantity || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Image (Optional)</Label>
            <div className="flex flex-col space-y-2">
              {imagePreview && (
                <div className="relative w-full h-48 mb-2 border rounded-md overflow-hidden">
                  <img 
                    src={imagePreview.startsWith('http') ? imagePreview : imagePreview}
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    Remove
                  </Button>
                </div>
              )}
              
              {!imagePreview && (
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md">
                  <div className="flex flex-col items-center">
                    <Image className="w-8 h-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">No image selected</span>
                  </div>
                </div>
              )}
              
              <Input
                id="image"
                name="image"
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">Max size: 5MB. Formats: JPG, PNG, GIF, WebP</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Bag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBagDialog;
