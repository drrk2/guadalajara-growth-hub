import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#050505]">
      {/* Premium Background Layer */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 grayscale"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-6">
              <Zap className="h-3 w-3 animate-pulse" /> Soluciones Electromecánicas Elite
            </div>
            
            <h1 className="text-6xl md:text-8xl font-display font-bold leading-[1.1] mb-8 tracking-tight text-white py-2">
              IMPULSANDO LA <br />
              <span className="text-gradient-red italic uppercase px-2">Industria 4.0</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/60 mb-10 max-w-2xl font-light leading-relaxed border-l-2 border-primary/50 pl-6">
              Distribuidora <span className="text-white font-bold tracking-wider">EISEN</span>. Expertos en refacciones de alta precisión y soluciones electromecánicas para la industria de Jalisco.
            </p>

            <div className="flex flex-wrap gap-5">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white px-10 py-8 text-xl font-bold rounded-none skew-x-[-12deg] shadow-[0_0_30px_-5px_rgba(215,31,31,0.5)] transition-all overflow-hidden relative group"
                  onClick={() => navigate("/login")}
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[45deg]" />
                  <span className="skew-x-[12deg] flex items-center gap-3 relative z-10">
                    PANEL DE CONTROL <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white/20 text-white px-10 py-8 text-xl font-bold rounded-none skew-x-[-12deg] hover:bg-white hover:text-black transition-all"
                  onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span className="skew-x-[12deg]">VER CATÁLOGO</span>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
      >
        <span className="text-[10px] uppercase tracking-widest font-bold">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
      </motion.div>
    </section>
  );
}
