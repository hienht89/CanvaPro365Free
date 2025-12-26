import { useState } from 'react';
import { useLinks, useCreateLink, useUpdateLink, useDeleteLink } from '@/hooks/useLinks';
import { useCategories } from '@/hooks/useCategories';
import { useAuditLog } from '@/hooks/useAuditLog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus, Pencil, Trash2, Copy, ExternalLink, Link2, Clock, AlertTriangle, Download, MoreHorizontal, Pause, Play, CheckSquare } from 'lucide-react';
import { Link, ProtectionType } from '@/types/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function AdminLinks() {
  const { data: links, isLoading } = useLinks();
  const { data: categories } = useCategories();
  const createLink = useCreateLink();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const auditLog = useAuditLog();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    title: '',
    description: '',
    canva_url: '',
    short_code: '',
    category_id: '',
    protection_type: 'countdown' as ProtectionType,
    ad_url: '',
    countdown_seconds: 30,
    max_slots: '',
    is_active: true,
    expires_at: '',
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      canva_url: '',
      short_code: '',
      category_id: '',
      protection_type: 'countdown',
      ad_url: '',
      countdown_seconds: 30,
      max_slots: '',
      is_active: true,
      expires_at: '',
    });
    setEditingLink(null);
  };

  const generateShortCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, short_code: result }));
  };

  const handleCreate = async () => {
    if (!form.title || !form.canva_url || !form.short_code) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const newLink = await createLink.mutateAsync({
      title: form.title,
      description: form.description || null,
      canva_url: form.canva_url,
      short_code: form.short_code,
      category_id: form.category_id || null,
      protection_type: form.protection_type,
      ad_url: form.ad_url || null,
      countdown_seconds: form.countdown_seconds,
      max_slots: form.max_slots ? parseInt(form.max_slots) : null,
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    });

    auditLog.mutate({
      action: 'create',
      entity_type: 'link',
      entity_id: newLink?.id,
      new_value: { title: form.title, short_code: form.short_code },
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingLink) return;

    await updateLink.mutateAsync({
      id: editingLink.id,
      title: form.title,
      description: form.description || null,
      canva_url: form.canva_url,
      short_code: form.short_code,
      category_id: form.category_id || null,
      protection_type: form.protection_type,
      ad_url: form.ad_url || null,
      countdown_seconds: form.countdown_seconds,
      max_slots: form.max_slots ? parseInt(form.max_slots) : null,
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    });

    auditLog.mutate({
      action: 'update',
      entity_type: 'link',
      entity_id: editingLink.id,
      old_value: { title: editingLink.title },
      new_value: { title: form.title, is_active: form.is_active },
    });

    setEditingLink(null);
    resetForm();
  };

  const handleEdit = (link: Link) => {
    setEditingLink(link);
    setForm({
      title: link.title,
      description: link.description || '',
      canva_url: link.canva_url,
      short_code: link.short_code,
      category_id: link.category_id || '',
      protection_type: link.protection_type,
      ad_url: link.ad_url || '',
      countdown_seconds: link.countdown_seconds,
      max_slots: link.max_slots?.toString() || '',
      is_active: link.is_active,
      expires_at: link.expires_at ? format(new Date(link.expires_at), "yyyy-MM-dd'T'HH:mm") : '',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa link này?')) {
      const link = links?.find(l => l.id === id);
      await deleteLink.mutateAsync(id);
      auditLog.mutate({
        action: 'delete',
        entity_type: 'link',
        entity_id: id,
        old_value: { title: link?.title },
      });
    }
  };

  const copyToClipboard = (shortCode: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/link/${shortCode}`);
    toast.success('Đã sao chép link!');
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getExpirationStatus = (link: Link) => {
    if (!link.expires_at) return null;
    const expiresDate = new Date(link.expires_at);
    const now = new Date();
    if (expiresDate < now) {
      return { label: 'Đã hết hạn', variant: 'destructive' as const };
    }
    const hoursUntilExpiry = (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilExpiry <= 24) {
      return { label: 'Sắp hết hạn', variant: 'outline' as const };
    }
    return null;
  };

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked && links) {
      setSelectedIds(new Set(links.map(l => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkPause = async () => {
    for (const id of selectedIds) {
      await updateLink.mutateAsync({ id, is_active: false });
    }
    auditLog.mutate({
      action: 'update',
      entity_type: 'link',
      new_value: { bulk_action: 'pause', count: selectedIds.size },
    });
    toast.success(`Đã tạm dừng ${selectedIds.size} link`);
    setSelectedIds(new Set());
  };

  const handleBulkResume = async () => {
    for (const id of selectedIds) {
      await updateLink.mutateAsync({ id, is_active: true });
    }
    auditLog.mutate({
      action: 'update',
      entity_type: 'link',
      new_value: { bulk_action: 'resume', count: selectedIds.size },
    });
    toast.success(`Đã kích hoạt ${selectedIds.size} link`);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.size} link?`)) return;
    for (const id of selectedIds) {
      await deleteLink.mutateAsync(id);
    }
    auditLog.mutate({
      action: 'delete',
      entity_type: 'link',
      new_value: { bulk_action: 'delete', count: selectedIds.size },
    });
    toast.success(`Đã xóa ${selectedIds.size} link`);
    setSelectedIds(new Set());
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!links || links.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    const headers = ['ID', 'Tiêu đề', 'Mã link', 'Danh mục', 'Slots hiện tại', 'Slots tối đa', 'Trạng thái', 'Ngày tạo', 'Hết hạn'];
    const rows = links.map(link => [
      link.id,
      link.title,
      link.short_code,
      link.category?.name || '',
      link.current_slots,
      link.max_slots || 'Không giới hạn',
      link.is_active ? 'Hoạt động' : 'Tắt',
      format(new Date(link.created_at), 'dd/MM/yyyy HH:mm'),
      link.expires_at ? format(new Date(link.expires_at), 'dd/MM/yyyy HH:mm') : 'Không',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvapro365free-links-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file CSV');
  };

  const linkFormContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Canva Pro Team..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Danh mục</Label>
          <Select 
            value={form.category_id} 
            onValueChange={(v) => setForm(prev => ({ ...prev, category_id: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Mô tả về link..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="canva_url">Link Canva *</Label>
        <Input
          id="canva_url"
          value={form.canva_url}
          onChange={(e) => setForm(prev => ({ ...prev, canva_url: e.target.value }))}
          placeholder="https://www.canva.com/brand/join?..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="short_code">Mã link *</Label>
          <div className="flex gap-2">
            <Input
              id="short_code"
              value={form.short_code}
              onChange={(e) => setForm(prev => ({ ...prev, short_code: e.target.value }))}
              placeholder="abc123"
            />
            <Button type="button" variant="outline" onClick={generateShortCode}>
              Tạo mã
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="protection">Loại bảo vệ</Label>
          <Select 
            value={form.protection_type} 
            onValueChange={(v: ProtectionType) => setForm(prev => ({ ...prev, protection_type: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="countdown">Đếm ngược</SelectItem>
              <SelectItem value="redirect">Chuyển hướng QC</SelectItem>
              <SelectItem value="both">Cả hai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="countdown">Thời gian đếm ngược (giây)</Label>
          <Input
            id="countdown"
            type="number"
            value={form.countdown_seconds}
            onChange={(e) => setForm(prev => ({ ...prev, countdown_seconds: parseInt(e.target.value) || 30 }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_slots">Giới hạn slot (để trống = không giới hạn)</Label>
          <Input
            id="max_slots"
            type="number"
            value={form.max_slots}
            onChange={(e) => setForm(prev => ({ ...prev, max_slots: e.target.value }))}
            placeholder="100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expires_at" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Thời gian hết hạn
        </Label>
        <Input
          id="expires_at"
          type="datetime-local"
          value={form.expires_at}
          onChange={(e) => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
          min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
        />
        {form.expires_at && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => setForm(prev => ({ ...prev, expires_at: '' }))}
          >
            Xóa thời gian hết hạn
          </Button>
        )}
      </div>

      {(form.protection_type === 'redirect' || form.protection_type === 'both') && (
        <div className="space-y-2">
          <Label htmlFor="ad_url">Link quảng cáo</Label>
          <Input
            id="ad_url"
            value={form.ad_url}
            onChange={(e) => setForm(prev => ({ ...prev, ad_url: e.target.value }))}
            placeholder="https://example.com/ad"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Kích hoạt link</Label>
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Link</h1>
          <p className="text-muted-foreground">Thêm, sửa, xóa các link Canva</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Xuất CSV
          </Button>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={resetForm}>
                <Plus className="w-4 h-4" />
                Thêm link mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm link mới</DialogTitle>
              </DialogHeader>
              {linkFormContent}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
                <Button onClick={handleCreate} disabled={createLink.isPending}>
                  {createLink.isPending ? 'Đang tạo...' : 'Tạo link'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <span className="font-medium">Đã chọn {selectedIds.size} link</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkPause} className="gap-1">
                  <Pause className="w-4 h-4" />
                  Tạm dừng
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkResume} className="gap-1">
                  <Play className="w-4 h-4" />
                  Kích hoạt
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1">
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Bỏ chọn
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa link</DialogTitle>
          </DialogHeader>
          {linkFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLink(null)}>Hủy</Button>
            <Button onClick={handleUpdate} disabled={updateLink.isPending}>
              {updateLink.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Links Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Danh sách link ({links?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : links && links.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={links.length > 0 && selectedIds.size === links.length}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Mã link</TableHead>
                    <TableHead>Slots</TableHead>
                    <TableHead>Hết hạn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => {
                    const expirationStatus = getExpirationStatus(link);
                    const expired = isExpired(link.expires_at);
                    
                    return (
                      <TableRow key={link.id} className={cn(expired && "opacity-60")}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(link.id)}
                            onCheckedChange={(checked) => handleSelectOne(link.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {link.title}
                            {expired && <AlertTriangle className="w-4 h-4 text-destructive" />}
                          </div>
                        </TableCell>
                        <TableCell>{link.category?.name || '-'}</TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-muted rounded text-sm">{link.short_code}</code>
                        </TableCell>
                        <TableCell>
                          {link.max_slots 
                            ? `${link.current_slots}/${link.max_slots}`
                            : link.current_slots
                          }
                        </TableCell>
                        <TableCell>
                          {link.expires_at ? (
                            <div className="space-y-1">
                              <span className="text-xs">
                                {format(new Date(link.expires_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                              </span>
                              {expirationStatus && (
                                <Badge variant={expirationStatus.variant} className="text-xs block w-fit">
                                  {expirationStatus.label}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Không giới hạn</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={link.is_active && !expired ? "default" : "secondary"}>
                            {expired ? 'Hết hạn' : link.is_active ? 'Hoạt động' : 'Tắt'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyToClipboard(link.short_code)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Sao chép link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/link/${link.short_code}`, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Xem trước
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(link)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(link.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Chưa có link nào. Bấm "Thêm link mới" để bắt đầu.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
