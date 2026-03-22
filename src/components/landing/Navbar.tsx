import { Button } from "@/components/ui/button";
import { tenant } from "@/data/mock-data";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <span className="text-2xl">{tenant.logo}</span>
          <span>{tenant.name}</span>
        </button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#servicios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Servicios</a>
          <a href="#catalogo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Catálogo</a>
          <a href="#nosotros" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Nosotros</a>
          <a href="#contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contacto</a>
          <Button onClick={() => navigate("/login")} size="sm">
            Acceder
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-card border-b px-4 pb-4 space-y-3">
          <a href="#servicios" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Servicios</a>
          <a href="#catalogo" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Catálogo</a>
          <a href="#nosotros" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Nosotros</a>
          <a href="#contacto" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Contacto</a>
          <Button onClick={() => { setMobileOpen(false); navigate("/login"); }} size="sm" className="w-full">
            Acceder
          </Button>
        </div>
      )}
    </nav>
  );
}
