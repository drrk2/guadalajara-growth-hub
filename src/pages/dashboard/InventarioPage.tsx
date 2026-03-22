import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, Package, Plus, RefreshCw, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

const InventarioPage = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const lowStockCount = products.filter(p => p.stock < (p.min_stock || 10)).length;

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      category: formData.get("category") as string,
      stock: Number(formData.get("stock")),
      price: Number(formData.get("price")),
      image: formData.get("image") as string || "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400",
      specs: JSON.stringify({}),
    };

    const { error } = await supabase.from('products').insert([newProduct]);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setIsDialogOpen(false);
      toast({ title: "Producto añadido", description: "Se sincronizó con éxito." });
      fetchInventory();
    }
  };

  const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedProduct = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      category: formData.get("category") as string,
      stock: Number(formData.get("stock")),
      price: Number(formData.get("price")),
      image: formData.get("image") as string,
    };

    const { error } = await supabase.from('products').update(updatedProduct).eq('id', editingProduct.id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setIsEditDialogOpen(false);
      toast({ title: "Producto actualizado", description: "Cambios guardados." });
      fetchInventory();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Producto eliminado" });
      fetchInventory();
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest opacity-50">Conectando con Supabase...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Gestión de Inventario (Real)</h1>
          <p className="text-sm text-muted-foreground">{products.length} productos registrados · {lowStockCount} alertas</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInventory} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo Insumo</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Añadir al Inventario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" name="name" placeholder="Ej. Motor Trifásico" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU / Código</Label>
                    <Input id="sku" name="sku" placeholder="MOT-001" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Input id="category" name="category" placeholder="Motores" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (MXN)</Label>
                    <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Inicial</Label>
                    <Input id="stock" name="stock" type="number" placeholder="0" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_stock">Stock Mínimo (Alerta)</Label>
                    <Input id="min_stock" name="min_stock" type="number" placeholder="5" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">URL de Imagen</Label>
                  <Input id="image" name="image" placeholder="https://..." />
                </div>
                <Button type="submit" className="w-full">Guardar en Supabase</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center gap-4">
            <Package className="h-8 w-8 text-primary opacity-50" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Total SKUs</p>
              <p className="text-2xl font-black">{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-warning">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-warning opacity-50" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Resurtido Necesario</p>
              <p className="text-2xl font-black">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-end flex-col gap-2">
           <div className="relative w-full max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar SKU o nombre..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full max-w-[200px]">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Producto</TableHead>
                <TableHead className="font-bold">Categoría</TableHead>
                <TableHead className="font-bold">Stock</TableHead>
                <TableHead className="font-bold">Precio</TableHead>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded overflow-hidden bg-muted border">
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-[10px] uppercase">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold">{item.stock}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">unidades</span>
                  </TableCell>
                  <TableCell className="font-medium">{formatMoney(item.price)}</TableCell>
                  <TableCell>
                    {item.stock < item.min_stock ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> Bajo Stock
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-success border-success/30">Óptimo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => { setEditingProduct(item); setIsEditDialogOpen(true); }}
                       >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => { if(confirm('¿Eliminar producto?')) handleDelete(item.id) }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Dialog */}
      {editingProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditProduct} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input id="edit-name" name="name" defaultValue={editingProduct.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sku">SKU</Label>
                  <Input id="edit-sku" name="sku" defaultValue={editingProduct.sku} disabled />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Categoría</Label>
                  <Input id="edit-category" name="category" defaultValue={editingProduct.category} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Precio</Label>
                  <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={editingProduct.price} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock Actual</Label>
                  <Input id="edit-stock" name="stock" type="number" defaultValue={editingProduct.stock} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-min-stock">Alerta de Stock</Label>
                  <Input id="edit-min_stock" name="min_stock" type="number" defaultValue={editingProduct.min_stock} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">URL de Imagen</Label>
                <Input id="edit-image" name="image" defaultValue={editingProduct.image} />
              </div>
              <Button type="submit" className="w-full">Actualizar en Supabase</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InventarioPage;
