import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Box, ShoppingCart, Search, SlidersHorizontal, X, ChevronDown,
  RefreshCw, AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  brand: string | null;
  unit: string | null;
  price: number;
  stock: number;
  min_stock: number;
  category: string;
  image: string | null;
}

interface Category {
  id: string;
  name: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

type SortKey = "name_asc" | "price_asc" | "price_desc" | "newest";

const SORT_OPTS: { value: SortKey; label: string }[] = [
  { value: "name_asc",    label: "Nombre A→Z"     },
  { value: "price_asc",   label: "Precio: menor"  },
  { value: "price_desc",  label: "Precio: mayor"  },
  { value: "newest",      label: "Más recientes"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const hasValidImage = (url: string | null): url is string =>
  !!url && (url.startsWith("http") || url.startsWith("data:image/"));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySort(q: any, sort: SortKey): any {
  if (sort === "price_asc")  return q.order("price", { ascending: true  });
  if (sort === "price_desc") return q.order("price", { ascending: false });
  if (sort === "newest")     return q.order("created_at", { ascending: false });
  return q.order("name", { ascending: true });
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CatalogSection() {
  const { addItem } = useCart();

  // ─ Search (debounced) ─
  const [query, setQuery]           = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearchTerm(query.trim()), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  // ─ Filters ─
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand]       = useState("all");
  const [sort, setSort]                          = useState<SortKey>("name_asc");

  // ─ Products ─
  const [products, setProducts]       = useState<Product[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(0);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // ─ Meta (categories + brands) ─
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands]         = useState<string[]>([]);

  // ─ UI ─
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ── Load categories + brands once ────────────────────────────────────────

  useEffect(() => {
    const loadMeta = async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("product_categories").select("id, name").eq("active", true).order("sort_order"),
        supabase.from("products").select("brand, category").eq("active", true),
      ]);

      if (!catRes.error && catRes.data && catRes.data.length > 0) {
        setCategories(catRes.data as Category[]);
      } else if (!prodRes.error && prodRes.data) {
        // fallback: distinct categories from products if table not migrated yet
        const names = Array.from(new Set((prodRes.data as any[]).map(p => p.category).filter(Boolean)));
        setCategories(names.map(n => ({ id: n, name: n })));
      }

      if (!prodRes.error && prodRes.data) {
        const b = Array.from(new Set((prodRes.data as any[]).map(p => p.brand).filter(Boolean))) as string[];
        setBrands(b.sort());
      }
    };
    loadMeta();
  }, []);

  // ── Main fetch (reset on filter change) ──────────────────────────────────

  const buildQuery = useCallback(() => {
    let q = supabase
      .from("products")
      .select("id,name,sku,description,brand,unit,price,stock,min_stock,category,image", { count: "exact" })
      .eq("active", true);

    if (searchTerm)                 q = q.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`);
    if (selectedCategory !== "all") q = q.eq("category", selectedCategory);
    if (selectedBrand !== "all")    q = q.eq("brand", selectedBrand);

    return applySort(q, sort);
  }, [searchTerm, selectedCategory, selectedBrand, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(0);

    const run = async () => {
      const q = buildQuery().range(0, PAGE_SIZE - 1);
      const { data, error: err, count } = await (q as any);
      if (cancelled) return;
      if (err) { setError(err.message); setLoading(false); return; }
      setProducts((data ?? []) as Product[]);
      setTotal(count ?? 0);
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [buildQuery]);

  // ── Load more ─────────────────────────────────────────────────────────────

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    const q = buildQuery().range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);
    const { data, error: err } = await (q as any);
    if (!err && data) {
      setProducts(prev => [...prev, ...(data as Product[])]);
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const hasMore = products.length < total;

  const activeFilters = [
    searchTerm && `"${searchTerm}"`,
    selectedCategory !== "all" && selectedCategory,
    selectedBrand !== "all" && selectedBrand,
  ].filter(Boolean) as string[];

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSort("name_asc");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section id="catalogo" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">

        {/* ── Heading ── */}
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-3">
            Inventario
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Catálogo de Refacciones
          </h2>
          <p className="text-gray-500 text-base">
            Explora nuestro catálogo actualizado. Filtra por categoría, marca o disponibilidad.
          </p>
        </div>

        {/* ── Search bar + filter toggle ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU o marca..."
              className="pl-10 bg-white border-gray-200 focus:border-red-400"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 border-gray-200 bg-white shrink-0"
            onClick={() => setFiltersOpen(v => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFilters.length > 0 && (
              <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 rounded-full ml-1">
                {activeFilters.length}
              </Badge>
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* ── Collapsible filter panel ── */}
        {filtersOpen && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Categoría</p>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="border-gray-200 bg-gray-50 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Marca</p>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="border-gray-200 bg-gray-50 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las marcas</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Ordenar por</p>
              <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
                <SelectTrigger className="border-gray-200 bg-gray-50 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* ── Active filter chips ── */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <span className="text-xs text-gray-400">Activos:</span>
            {activeFilters.map(f => (
              <span key={f} className="text-xs bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full">
                {f}
              </span>
            ))}
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
              <X className="h-3 w-3" /> Limpiar
            </button>
          </div>
        )}

        {/* ── Result count ── */}
        {!loading && !error && (
          <p className="text-xs text-gray-400 mb-4">
            {total === 0 ? "Sin resultados" : `${total} producto${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* ── Error state ── */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 opacity-60" />
            <p className="text-sm text-gray-500 max-w-xs">{error}</p>
            <Button variant="outline" size="sm" onClick={() => { setError(null); setLoading(true); }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
            </Button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Product grid ── */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group bg-white border border-gray-100 rounded-xl overflow-hidden text-left hover:border-red-200 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              >
                {/* Image */}
                <div className="h-48 bg-gray-50 relative overflow-hidden">
                  {hasValidImage(product.image) ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Box className="h-8 w-8 text-gray-200 mb-1" />
                      <span className="text-[9px] font-bold text-gray-200 uppercase tracking-widest">Sin imagen</span>
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-gray-200 px-2 py-1 bg-white rounded">
                        Sin existencia
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-red-600 mb-1">{product.category}</p>
                  <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-1">{product.name}</p>
                  {product.brand && (
                    <p className="text-[10px] text-gray-400">{product.brand}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-base font-black text-red-600">{formatMoney(product.price)}</p>
                    {product.stock === 0 && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                        Agotado
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <Box className="h-10 w-10 text-gray-200 mx-auto mb-4" />
            <p className="text-sm text-gray-400 mb-2">Sin resultados para los filtros actuales</p>
            <Button variant="outline" size="sm" onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        )}

        {/* ── Load more ── */}
        {!loading && !error && hasMore && (
          <div className="flex justify-center mt-10">
            <Button
              variant="outline"
              className="gap-2 border-gray-200 px-8"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Cargando...</>
                : `Cargar más (${total - products.length} restantes)`}
            </Button>
          </div>
        )}
      </div>

      {/* ── Product Detail Dialog (shared single instance) ── */}
      <Dialog open={!!selectedProduct} onOpenChange={open => { if (!open) setSelectedProduct(null); }}>
        {selectedProduct && (
          <DialogContent className="max-w-3xl p-0 overflow-hidden border-gray-100 rounded-2xl">
            <div className="grid md:grid-cols-2 gap-0 min-h-[420px]">

              {/* Image pane */}
              <div className="bg-gray-50 flex items-center justify-center relative border-r border-gray-100 min-h-[260px]">
                {hasValidImage(selectedProduct.image) ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    loading="lazy"
                    className="w-full h-full object-cover max-h-[420px]"
                  />
                ) : (
                  <div className="flex flex-col items-center opacity-20 p-8">
                    <Box className="h-16 w-16 mb-3" />
                    <p className="text-[10px] uppercase font-bold tracking-widest">Sin imagen</p>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-red-600 hover:bg-red-600 text-white text-[10px] font-bold tracking-wide border-none rounded-full">
                    {selectedProduct.category}
                  </Badge>
                </div>
              </div>

              {/* Details pane */}
              <div className="p-8 flex flex-col justify-between bg-white overflow-y-auto">
                <div>
                  <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-black text-gray-900 leading-tight">
                      {selectedProduct.name}
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-xs text-gray-400 font-mono mb-4">SKU: {selectedProduct.sku}</p>

                  {selectedProduct.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-5">{selectedProduct.description}</p>
                  )}

                  <div className="space-y-1">
                    {selectedProduct.brand && (
                      <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                        <span className="text-gray-400">Fabricante</span>
                        <span className="font-semibold text-gray-700">{selectedProduct.brand}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-gray-400">Unidad</span>
                      <span className="font-semibold text-gray-700 capitalize">{selectedProduct.unit || "pieza"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-2xl font-black text-red-600 mb-4">{formatMoney(selectedProduct.price)} <span className="text-xs font-normal text-gray-400">MXN</span></p>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 gap-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedProduct.stock === 0}
                    onClick={() => {
                      addItem({ ...selectedProduct, image: selectedProduct.image ?? undefined, quantity: 1 });
                      setSelectedProduct(null);
                    }}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {selectedProduct.stock > 0 ? "Añadir a cotización" : "Agotado"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
