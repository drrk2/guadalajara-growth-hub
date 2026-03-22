import { Button } from "@/components/ui/button";
import { tenant } from "@/data/mock-data";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { CartDrawer } from "./CartDrawer";

export function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#000000]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <button 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            navigate("/");
          }} 
          className="flex items-center gap-3 group"
        >
          <div className="h-10 w-10 flex items-center justify-center bg-primary rounded-none skew-x-[-12deg] shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <span className="text-xl skew-x-[12deg]">{tenant.logo}</span>
          </div>
          <div className="flex flex-col items-start leading-none group">
            <span className="font-display text-2xl font-black text-white tracking-tighter group-hover:text-primary transition-colors">{tenant.name}</span>
            <span className="text-[8px] font-bold text-primary/80 uppercase tracking-[0.3em]">Industrial Elite</span>
          </div>
        </button>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {[
            { label: "Servicios", href: "#servicios" },
            { label: "Catálogo", href: "#catalogo" },
            { label: "Nosotros", href: "#nosotros" },
            { label: "Contacto", href: "#contacto" },
          ].map((link) => (
            <a 
              key={link.label}
              href={link.href} 
              className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-primary transition-all relative group py-2"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <CartDrawer />
            <Button 
              onClick={() => navigate("/login")} 
              size="sm"
              className="bg-white text-black hover:bg-primary hover:text-white px-6 font-bold rounded-none skew-x-[-12deg] transition-all"
            >
              <span className="skew-x-[12deg]">ACCEDER</span>
            </Button>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <CartDrawer />
          <button className="text-white p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={mobileOpen ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
        className="md:hidden bg-black/95 backdrop-blur-2xl overflow-hidden border-b border-white/5"
      >
        <div className="px-4 py-8 space-y-6 flex flex-col items-center text-center">
          {["Servicios", "Catálogo", "Nosotros", "Contacto"].map((label) => (
            <a 
              key={label}
              href={`#${label.toLowerCase()}`} 
              className="text-lg font-bold uppercase tracking-[0.2em] text-white/70 hover:text-primary" 
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </a>
          ))}
          <Button 
            onClick={() => { setMobileOpen(false); navigate("/login"); }} 
            className="w-full bg-primary hover:bg-primary/80 text-white py-6 text-lg font-bold"
          >
            ACCEDER AL SISTEMA
          </Button>
        </div>
      </motion.div>
    </nav>
  );
}
