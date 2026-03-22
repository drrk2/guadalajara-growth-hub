import { tenant } from "@/data/mock-data";
import { useNavigate } from "react-router-dom";

export function Footer() {
  const navigate = useNavigate();
  
  return (
    <footer className="bg-[#050505] text-white py-16 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 flex items-center justify-center bg-primary rounded-none skew-x-[-12deg]">
                <span className="text-sm skew-x-[12deg]">{tenant.logo}</span>
              </div>
              <span className="font-display text-xl font-black tracking-tighter uppercase">{tenant.name}</span>
            </div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">{tenant.tagline}</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/40">
            <a href="#servicios" className="hover:text-primary transition-colors">Servicios</a>
            <a href="#catalogo" className="hover:text-primary transition-colors">Catálogo</a>
            <a href="#nosotros" className="hover:text-primary transition-colors">Nosotros</a>
            <button onClick={() => navigate("/login")} className="hover:text-primary transition-colors">Acceso Interno</button>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.1em]">
              © {new Date().getFullYear()} {tenant.name} INDUSTRIAL. GDL, MÉXICO.
            </p>
            <div className="flex gap-4 opacity-30 hover:opacity-100 transition-opacity">
              <a href="#" className="h-4 w-4 bg-white rounded-full" />
              <a href="#" className="h-4 w-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
