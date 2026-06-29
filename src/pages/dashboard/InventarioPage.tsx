import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, Plus, RefreshCw, Edit2, Eye, EyeOff, Image as ImageIcon, Upload, List, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useSystem } from "@/context/SystemContext";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

interface ProductCategory {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
}

const InventarioPage = () => {
  const { toast } = useToast();
  const { inventory: products, loadingInventory: loading, refreshInventory: fetchInventory } = useSystem();
  const [search, setSearch]           = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"active" | "inactive" | "all">("active");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
   const [editingProduct, setEditingProduct] = useState<any>(null);
   const [uploading, setUploading] = useState(false);
   const [tempImageUrl, setTempImageUrl] = useState("");
  const [dbCategories, setDbCategories] = useState<ProductCategory[]>([]);
  const [showCatManager, setShowCatManager] = useState(false);
  const [addCatValue, setAddCatValue] = useState("");
  const [editCatValue, setEditCatValue] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [categoryManagerSearch, setCategoryManagerSearch] = useState("");

  useEffect(() => {
    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDbCategories = dbCategories.filter(cat =>
    cat.name.toLowerCase().includes(categoryManagerSearch.trim().toLowerCase())
  );

  const categories = dbCategories.length > 0
    ? dbCategories.map(c => c.name)
    : Array.from(new Set(products.map(p => p.category)));

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, active, sort_order")
      .order("sort_order");
    if (!error && data) setDbCategories(data as ProductCategory[]);
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const slug = newCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const sortVal = dbCategories.length > 0
      ? Math.max(...dbCategories.map(c => c.sort_order)) + 10
      : 0;
    const { error } = await supabase
      .from("product_categories")
      .insert([{ name: newCatName.trim(), slug, sort_order: sortVal }]);
    if (error) {
      toast({ variant: "destructive", title: "Error al crear categoría", description: error.message });
    } else {
      setNewCatName("");
      fetchCategories();
      toast({ title: "Categoría creada" });
    }
  };

  const handleToggleCategory = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("product_categories")
      .update({ active: !currentActive })
      .eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      fetchCategories();
      toast({ title: currentActive ? "Categoría desactivada" : "Categoría reactivada" });
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    // Bloquear si hay productos asignados a esta categoría
    const { count, error: checkErr } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (checkErr) {
      toast({ variant: "destructive", title: "Error al verificar", description: checkErr.message });
      return;
    }

    if ((count ?? 0) > 0) {
      toast({
        variant: "destructive",
        title: "No se puede eliminar",
        description: `"${name}" tiene ${count} producto${count !== 1 ? "s" : ""} asignado${count !== 1 ? "s" : ""}. Reasigna o desactiva esos productos primero.`,
      });
      return;
    }

    const { error } = await supabase.from("product_categories").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      fetchCategories();
      toast({ title: `Categoría "${name}" eliminada` });
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch  = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || ((p as any).brand || "").toLowerCase().includes(search.toLowerCase());
    const matchCat     = categoryFilter === "all" || p.category === categoryFilter;
    const matchActive  =
      activeFilter === "all"      ? true :
      activeFilter === "active"   ? p.active !== false :
      /* inactive */                p.active === false;
    return matchSearch && matchCat && matchActive;
  });

  const activeCount   = products.filter(p => p.active !== false).length;
  const inactiveCount = products.filter(p => p.active === false).length;
  const lowStockCount = products.filter(p => p.active !== false && p.stock < (p.min_stock || 10)).length;
 
  const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  const getUploadErrorMsg = (err: any): string => {
    const msg: string = err?.message ?? err?.error ?? "";
    const status = err?.statusCode ?? err?.status ?? 0;
    if (msg.includes("Bucket not found") || status === 404)
      return "Bucket 'products' no encontrado. Aplica la migración 0011 en Supabase SQL Editor.";
    if (msg.includes("row-level security") || msg.includes("Unauthorized") || msg.includes("policy") || status === 403)
      return "Sin permisos. Asegúrate de estar autenticado como admin y de haber aplicado la migración 0011.";
    if (msg.includes("exceeded the maximum") || msg.includes("too large") || status === 413)
      return "Archivo demasiado grande. El límite es 10 MB.";
    if (msg.includes("mime type") || msg.includes("MIME") || msg.includes("not supported"))
      return "Tipo no permitido. Usa: JPG, PNG, WebP o GIF.";
    return msg || "Error desconocido al subir la imagen.";
  };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     if (!ALLOWED_MIME.includes(file.type)) {
       toast({ variant: "destructive", title: "Formato no válido", description: "Usa: JPG, PNG, WebP o GIF." });
       return;
     }

     setUploading(true);
     try {
       const fileExt = file.name.split('.').pop();
       const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

       const { error: uploadError } = await supabase.storage
         .from('products')
         .upload(fileName, file);

       if (uploadError) throw uploadError;

       const { data: { publicUrl } } = supabase.storage
         .from('products')
         .getPublicUrl(fileName);

       setTempImageUrl(publicUrl);
       toast({ title: "Imagen subida", description: "La imagen se guardó correctamente." });
     } catch (error: any) {
       console.error("Upload error:", error);
       toast({ variant: "destructive", title: "Error de subida", description: getUploadErrorMsg(error) });
     } finally {
       setUploading(false);
     }
   };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryName = dbCategories.length > 0
      ? addCatValue
      : (formData.get("category") as string);
    if (!categoryName) {
      toast({ variant: "destructive", title: "Selecciona una categoría" });
      return;
    }
    const dbCat = dbCategories.find(c => c.name === categoryName);
    const newProduct = {
      name:        formData.get("name") as string,
      sku:         formData.get("sku") as string,
      category:    categoryName,
      category_id: dbCat?.id ?? null,
      stock:       Number(formData.get("stock")),
      min_stock:   Number(formData.get("min_stock")),
      price:       Number(formData.get("price")),
      image:       (formData.get("image") as string) || null,
      active:      true,
    };

    const { error } = await supabase.from('products').insert([newProduct]);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setIsDialogOpen(false);
      setAddCatValue("");
      toast({ title: "Producto añadido", description: "Se sincronizó con éxito." });
      fetchInventory();
    }
  };

  const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryName = dbCategories.length > 0
      ? (editCatValue || editingProduct.category)
      : ((formData.get("category") as string) || editingProduct.category);
    const dbCat = dbCategories.find(c => c.name === categoryName);
    const updatedProduct = {
      name:        formData.get("name") as string,
      category:    categoryName,
      category_id: dbCat?.id ?? editingProduct.category_id ?? null,
      stock:       Number(formData.get("stock")),
      min_stock:   Number(formData.get("min_stock")),
      price:       Number(formData.get("price")),
      image:       (formData.get("image") as string) || editingProduct.image || null,
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

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from('products').update({ active: !currentActive }).eq('id', id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: currentActive ? "Producto desactivado" : "Producto reactivado",
              description: currentActive ? "Ya no aparece en el catálogo." : "Visible en el catálogo." });
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
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight">Gestión de Inventario</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} activos · {inactiveCount} inactivos · {lowStockCount} en alerta de stock
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={fetchInventory} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowCatManager(true)}>
            <List className="h-4 w-4" /> Categorías
          </Button>
           <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) { setTempImageUrl(""); setAddCatValue(""); } }}>
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
                    {dbCategories.length > 0 ? (
                      <Select value={addCatValue} onValueChange={setAddCatValue}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {dbCategories.filter(c => c.active).map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input id="category" name="category" placeholder="Motores" required />
                    )}
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
                 <div className="space-y-4 pt-2">
                   <Label>Imagen del Producto</Label>
                   <div className="flex flex-col gap-4">
                     {/* Preview Box */}
                     <div className="h-40 w-full border border-dashed border-white/10 flex items-center justify-center bg-white/5 relative group overflow-hidden">
                       {(tempImageUrl || editingProduct?.image) ? (
                         <img 
                           src={tempImageUrl || editingProduct?.image} 
                           alt="Preview" 
                           className="h-full w-full object-contain p-2"
                         />
                       ) : (
                         <div className="flex flex-col items-center opacity-20">
                           <ImageIcon className="h-10 w-10 mb-2" />
                           <span className="text-[10px] uppercase font-bold tracking-widest">Sin Vista Previa</span>
                         </div>
                       )}
                       {uploading && (
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                         </div>
                       )}
                     </div>

                     <div className="grid grid-cols-1 gap-2">
                       <div className="relative">
                          <Input 
                            type="file" 
                            accept=".jpg,.jpeg,.png,.webp,.gif" 
                            className="hidden" 
                            id="file-upload"
                            onChange={(e) => handleFileUpload(e)}
                          />
                          <Label 
                            htmlFor="file-upload" 
                            className="flex items-center justify-center gap-2 w-full h-11 border border-white/10 hover:bg-white/5 cursor-pointer transition-colors text-[10px] uppercase font-bold tracking-widest"
                          >
                            <Upload className="h-4 w-4" /> 
                            {uploading ? "SUBIENDO..." : "Elegir archivo del PC"}
                          </Label>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          <div className="h-px bg-white/5 flex-1" />
                          <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">O pega una URL</span>
                          <div className="h-px bg-white/5 flex-1" />
                       </div>

                       <Input 
                        id="image" 
                        name="image" 
                        placeholder="https://..." 
                        value={tempImageUrl}
                        onChange={(e) => setTempImageUrl(e.target.value)}
                        className="text-xs"
                       />
                     </div>
                   </div>
                 </div>
                 <Button type="submit" className="w-full h-12 skew-x-[-12deg] font-bold uppercase tracking-widest" disabled={uploading}>
                    <span className="skew-x-[12deg]">Guardar en Supabase</span>
                 </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center gap-4">
            <Eye className="h-8 w-8 text-emerald-500 opacity-50" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Activos</p>
              <p className="text-2xl font-black text-emerald-400">{activeCount}</p>
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
          <Select value={activeFilter} onValueChange={v => setActiveFilter(v as typeof activeFilter)}>
            <SelectTrigger className="w-full max-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Solo activos</SelectItem>
              <SelectItem value="inactive">Solo inactivos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
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
                <TableRow key={item.id} className={`hover:bg-muted/30 transition-opacity ${item.active === false ? "opacity-50" : ""}`}>
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
                    <div className="flex flex-col gap-1">
                      {item.active === false ? (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/20 w-fit">
                          Inactivo
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 w-fit">
                            Activo
                          </Badge>
                          {item.stock === 0 ? (
                            <Badge variant="destructive" className="text-[10px] gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" /> Sin stock
                            </Badge>
                          ) : item.stock < (item.min_stock || 10) ? (
                            <Badge className="text-[10px] gap-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/10 w-fit">
                              <AlertTriangle className="h-3 w-3" /> Stock bajo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 w-fit">
                              Óptimo
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => { setEditingProduct(item); setEditCatValue((item as any).category || ""); setIsEditDialogOpen(true); }}
                       >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={item.active === false ? "Reactivar producto" : "Desactivar producto"}
                        className={item.active === false
                          ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}
                        onClick={() => handleToggleActive(item.id, item.active !== false)}
                      >
                        {item.active === false
                          ? <Eye className="h-4 w-4" />
                          : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Category Manager Dialog */}
      <Dialog open={showCatManager} onOpenChange={(open) => { setShowCatManager(open); if (!open) setCategoryManagerSearch(""); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Gestionar Categorías</DialogTitle>
          </DialogHeader>
          {dbCategories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aplica la migración <code className="font-mono text-primary">0009_product_categories.sql</code> en Supabase para habilitar categorías administrables.
            </p>
          )}
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-3">
            <Input
              placeholder="Nueva categoría..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" size="sm" className="gap-1 shrink-0">
              <Plus className="h-3 w-3" /> Agregar
            </Button>
          </form>
          {dbCategories.length > 0 && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar categoría..."
                value={categoryManagerSearch}
                onChange={e => setCategoryManagerSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          )}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {dbCategories.length > 0 && filteredDbCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No se encontraron categorías.</p>
            )}
            {filteredDbCategories.map(cat => (
              <div
                key={cat.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  cat.active ? "border-white/10" : "border-white/5 opacity-50"
                }`}
              >
                <p className="text-sm font-medium">{cat.name}</p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1 text-xs px-2 ${
                      cat.active
                        ? "text-muted-foreground hover:text-amber-400"
                        : "text-emerald-400 hover:text-emerald-300"
                    }`}
                    onClick={() => handleToggleCategory(cat.id, cat.active)}
                  >
                    {cat.active
                      ? <><EyeOff className="h-3 w-3" /> Desactivar</>
                      : <><Eye className="h-3 w-3" /> Reactivar</>}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  >
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
       {editingProduct && (
         <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if(!open) { setTempImageUrl(""); setEditingProduct(null); } }}>
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
                  {dbCategories.length > 0 ? (
                    <Select value={editCatValue} onValueChange={setEditCatValue}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {dbCategories.filter(c => c.active).map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="edit-category" name="category" defaultValue={editingProduct.category} required />
                  )}
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
               <div className="space-y-4 pt-2">
                 <Label>Imagen del Producto</Label>
                 <div className="flex flex-col gap-4">
                   <div className="h-40 w-full border border-dashed border-white/10 flex items-center justify-center bg-white/5 relative overflow-hidden">
                     {(tempImageUrl || editingProduct.image) ? (
                       <img 
                         src={tempImageUrl || editingProduct.image} 
                         alt="Preview" 
                         className="h-full w-full object-contain p-2"
                       />
                     ) : (
                       <div className="flex flex-col items-center opacity-20">
                         <ImageIcon className="h-10 w-10 mb-2" />
                         <span className="text-[10px] uppercase font-bold tracking-widest">Sin Vista Previa</span>
                       </div>
                     )}
                     {uploading && (
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                       </div>
                     )}
                   </div>

                   <div className="grid grid-cols-1 gap-2">
                     <div className="relative">
                        <Input 
                          type="file" 
                          accept=".jpg,.jpeg,.png,.webp,.gif" 
                          className="hidden" 
                          id="edit-file-upload"
                          onChange={(e) => handleFileUpload(e)}
                        />
                        <Label 
                          htmlFor="edit-file-upload" 
                          className="flex items-center justify-center gap-2 w-full h-11 border border-white/10 hover:bg-white/5 cursor-pointer transition-colors text-[10px] uppercase font-bold tracking-widest"
                        >
                          <Upload className="h-4 w-4" /> 
                          {uploading ? "SUBIENDO..." : "Cambiar Imagen desde PC"}
                        </Label>
                     </div>
                     
                     <Input 
                      id="edit-image" 
                      name="image" 
                      defaultValue={tempImageUrl || editingProduct.image}
                      key={tempImageUrl || editingProduct.image} 
                      placeholder="https://..." 
                      className="text-xs"
                     />
                   </div>
                 </div>
               </div>
               <Button type="submit" className="w-full h-12 skew-x-[-12deg] font-bold uppercase tracking-widest" disabled={uploading}>
                  <span className="skew-x-[12deg]">Actualizar en Supabase</span>
               </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InventarioPage;
