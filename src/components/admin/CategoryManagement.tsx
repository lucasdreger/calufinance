import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('expenses_categories')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    // Sort categories alphabetically by default
    const sortedData = sortCategories(data || [], sortDirection);
    setCategories(sortedData);
  };

  const sortCategories = (data: any[], direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      const comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  const toggleSort = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    setCategories(sortCategories(categories, newDirection));
  };

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      if (mounted) {
        await fetchCategories();
      }
    };

    loadCategories();

    const channel = supabase
      .channel('categories_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses_categories' },
        () => {
          if (mounted) {
            fetchCategories();
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        title: "Missing Category Name",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add categories",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('expenses_categories')
      .insert({
        name: newCategory.trim(),
        user_id: user.id,
      });

    if (error) {
      toast({
        title: "Error saving category",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNewCategory('');
    fetchCategories();
    
    toast({
      title: "Category Added",
      description: "Your category has been saved.",
    });
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('expenses_categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    fetchCategories();
    toast({
      title: "Category Deleted",
      description: "Category has been removed.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Categories</h3>
            <p className="text-sm text-gray-500 mb-4">
              Manage your expense categories to better organize your budget
            </p>
          </div>
          
          <div className="flex gap-3">
            <Input
              placeholder="New Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleAddCategory} className="whitespace-nowrap">
              Add Category
            </Button>
          </div>

          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead 
                    className="font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={toggleSort}
                  >
                    <div className="flex items-center gap-2">
                      Category Name
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                      No categories yet. Add your first category above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};