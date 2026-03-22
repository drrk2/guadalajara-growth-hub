import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSystem } from "@/context/SystemContext";
import { Search, AlertTriangle, Package, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

const InventarioPage = () => {
  const { toast } = useToast();
  const { inventory: products, setInventory } = useSystem();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const categories = [...new Set(products.map(p => p.category))];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const lowStockCount = products.filter(p => p.stock < p.minStock).length;

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      category: formData.get("category") as string,
      stock: Number(formData.get("stock")),
      minStock: Number(formData.get("minStock")),
      price: Number(formData.get("price")),
      image: formData.get("image") as string || "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400",
      specs: formData.get("specs") as string,
    };
    setInventory(prev => [newProduct, ...prev]);
    setIsDialogOpen(false);
    toast({ title: "Producto añadido", description: `${newProduct.name} se agregó al inventario.` });
  };

  const handleEditProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedProduct = {
      ...editingProduct,
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      category: formData.get("category") as string,
      stock: Number(formData.get("stock")),
      minStock: Number(formData.get("minStock")),
      price: Number(formData.get("price")),
      image: formData.get("image") as string,
      specs: formData.get("specs") as string,
    };
    setInventory(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setIsEditDialogOpen(false);
    toast({ title: "Producto actualizado", description: `${updatedProduct.name} ha sido modificado.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Gestión de Inventario</h1>
          <p className="text-sm text-muted-foreground">{products.length} productos registrados · {lowStockCount} alertas</p>
        </div>

        <div className="flex gap-2">
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
                    <select name="category" className="w-full h-10 px-3 rounded-md border border-input bg-background" required>
                      <option value="Motores">Motores</option>
                      <option value="Sensores">Sensores</option>
                      <option value="Mecánica">Mecánica</option>
                      <option value="Eléctrico">Eléctrico</option>
                      <option value="Electrónica">Electrónica</option>
                      <option value="Herramientas">Herramientas</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio Venta</Label>
                    <Input id="price" name="price" type="number" step="0.01" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">URL de Imagen</Label>
                  <Input id="image" name="image" placeholder="https://..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specs">Especificaciones Técnicas</Label>
                  <textarea 
                    id="specs" 
                    name="specs" 
                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                    placeholder="Ej. Potencia: 5HP, Voltaje: 220V..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Actual</Label>
                    <Input id="stock" name="stock" type="number" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Min. Alerta</Label>
                    <Input id="minStock" name="minStock" type="number" required />
                  </div>
                </div>
                <Button type="submit" className="w-full mt-2">Guardar Producto</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Producto</DialogTitle>
              </DialogHeader>
              {editingProduct && (
                <form onSubmit={handleEditProduct} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nombre</Label>
                      <Input id="edit-name" name="name" defaultValue={editingProduct.name} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-sku">SKU / Código</Label>
                      <Input id="edit-sku" name="sku" defaultValue={editingProduct.sku} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Categoría</Label>
                      <select name="category" defaultValue={editingProduct.category} className="w-full h-10 px-3 rounded-md border border-input bg-background" required>
                        <option value="Motores">Motores</option>
                        <option value="Sensores">Sensores</option>
                        <option value="Mecánica">Mecánica</option>
                        <option value="Eléctrico">Eléctrico</option>
                        <option value="Electrónica">Electrónica</option>
                        <option value="Herramientas">Herramientas</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Precio Venta</Label>
                      <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={editingProduct.price} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-image">URL de Imagen</Label>
                    <Input id="edit-image" name="image" defaultValue={editingProduct.image} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-specs">Especificaciones Técnicas</Label>
                    <textarea 
                      id="edit-specs" 
                      name="specs" 
                      defaultValue={editingProduct.specs}
                      className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-stock">Stock Actual</Label>
                      <Input id="edit-stock" name="stock" type="number" defaultValue={editingProduct.stock} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-minStock">Min. Alerta</Label>
                      <Input id="edit-minStock" name="minStock" type="number" defaultValue={editingProduct.minStock} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-2">Actualizar Cambios</Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Total SKU</p>
              <p className="text-xl font-display font-bold">{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-destructive/20 bg-destructive/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Stock Crítico</p>
              <p className="text-xl font-display font-bold text-destructive">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o SKU..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Producto</TableHead>
                <TableHead className="font-bold">SKU</TableHead>
                <TableHead className="font-bold">Categoría</TableHead>
                <TableHead className="text-center font-bold">Stock</TableHead>
                <TableHead className="text-center font-bold">Mínimo</TableHead>
                <TableHead className="text-right font-bold">Precio</TableHead>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="text-right font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => {
                const isLow = product.stock <= product.minStock;
                return (
                  <TableRow key={product.id} className={isLow ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded overflow-hidden border bg-muted shrink-0">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <span>{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">{product.sku}</TableCell>
                    <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted font-semibold">{product.category}</span></TableCell>
                    <TableCell className="text-center font-bold">{Math.round(product.stock)}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">{product.minStock}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatMoney(product.price)}</TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="destructive" className="gap-1 animate-pulse">
                          <AlertTriangle className="h-3 w-3" /> Revisar
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-secondary border-secondary/20">Bueno</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingProduct(product);
                        setIsEditDialogOpen(true);
                      }}>Editar</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
};

export default InventarioPage;
