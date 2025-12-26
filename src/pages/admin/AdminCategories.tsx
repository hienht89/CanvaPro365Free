import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, FolderOpen, Crown, GraduationCap } from 'lucide-react';
import { Category, LinkType } from '@/types/database';
import { toast } from 'sonner';

export default function AdminCategories() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    link_type: 'canva_pro' as LinkType,
    icon: 'crown',
    display_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      link_type: 'canva_pro',
      icon: 'crown',
      display_order: 0,
      is_active: true,
    });
    setEditingCategory(null);
  };

  const handleCreate = async () => {
    if (!form.name) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    await createCategory.mutateAsync({
      name: form.name,
      description: form.description || null,
      link_type: form.link_type,
      icon: form.icon,
      display_order: form.display_order,
      is_active: form.is_active,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;

    await updateCategory.mutateAsync({
      id: editingCategory.id,
      name: form.name,
      description: form.description || null,
      link_type: form.link_type,
      icon: form.icon,
      display_order: form.display_order,
      is_active: form.is_active,
    });

    setEditingCategory(null);
    resetForm();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || '',
      link_type: category.link_type,
      icon: category.icon || 'crown',
      display_order: category.display_order,
      is_active: category.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa danh mục này? Tất cả link trong danh mục cũng sẽ bị xóa.')) {
      await deleteCategory.mutateAsync(id);
    }
  };

  const categoryFormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên danh mục *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Canva Pro Team..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Mô tả danh mục..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="link_type">Loại link</Label>
          <Select 
            value={form.link_type} 
            onValueChange={(v: LinkType) => setForm(prev => ({ ...prev, link_type: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="canva_pro">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Canva Pro
                </div>
              </SelectItem>
              <SelectItem value="canva_edu">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Canva Education
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_order">Thứ tự hiển thị</Label>
          <Input
            id="display_order"
            type="number"
            value={form.display_order}
            onChange={(e) => setForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Hiển thị danh mục</Label>
        <Switch
          id="is_active"
          checked={form.is_active}
          onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Quản lý Danh mục</h1>
          <p className="text-muted-foreground">Thêm, sửa, xóa các danh mục link</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-primary text-primary-foreground" onClick={resetForm}>
              <Plus className="w-4 h-4" />
              Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm danh mục mới</DialogTitle>
            </DialogHeader>
            {categoryFormContent}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
              <Button onClick={handleCreate} disabled={createCategory.isPending}>
                {createCategory.isPending ? 'Đang tạo...' : 'Tạo danh mục'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
          </DialogHeader>
          {categoryFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>Hủy</Button>
            <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Danh sách danh mục ({categories?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thứ tự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.link_type === 'canva_pro' ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                          {category.link_type === 'canva_pro' 
                            ? <Crown className="w-4 h-4 text-primary" />
                            : <GraduationCap className="w-4 h-4 text-secondary" />
                          }
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {category.link_type === 'canva_pro' ? 'Canva Pro' : 'Canva Edu'}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.display_order}</TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? 'Hiển thị' : 'Ẩn'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Chưa có danh mục nào.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
