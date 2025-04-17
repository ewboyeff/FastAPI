
import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface BagFilters {
  store_name?: string;
}

interface BagFilterFormProps {
  onFilter: (filters: BagFilters) => void;
}

const BagFilterForm: React.FC<BagFilterFormProps> = ({ onFilter }) => {
  const [store_name, setStore_name] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const filters: BagFilters = {};
    
    if (store_name) filters.store_name = store_name;
    
    onFilter(filters);
  };

  const handleClear = () => {
    setStore_name('');
    onFilter({});
  };

  return (
    <div className="max-w-[600px] mx-auto mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          placeholder="Filter by store name"
          value={store_name}
          onChange={(e) => setStore_name(e.target.value)}
          className="flex-grow rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        />
        <div className="flex gap-2">
          <Button 
            type="submit" 
            className="bg-[#28a745] hover:bg-[#218838] text-white font-medium rounded-lg hover:scale-105 transition-transform"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button 
            type="button"
            onClick={handleClear}
            variant="secondary"
            className="bg-[#6c757d] hover:bg-[#5a6268] text-white font-medium rounded-lg hover:scale-105 transition-transform"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BagFilterForm;
