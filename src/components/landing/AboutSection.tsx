import { tenant } from "@/data/mock-data";
import { motion } from "framer-motion";
import { Wrench, ShieldCheck, Clock } from "lucide-react";

export function AboutSection() {
  return (
    <section id="nosotros" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative vertical line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-border opacity-20 hidden lg:block" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              Liderazgo Industrial
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 tracking-tight">
              Más que un proveedor, somos su <span className="text-primary italic">aliado técnico</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              Con más de 15 años de experiencia, <strong className="text-foreground">{tenant.name}</strong> se ha consolidado como el referente en soluciones electromecánicas en Jalisco. Nuestra misión es simple: eliminar el tiempo de inactividad de su planta mediante piezas de alta precisión y un servicio técnico impecable.
            </p>

            <div className="space-y-6 mb-10">
              {[
                { icon: ShieldCheck, title: "Calidad Certificada", desc: "Componentes originales y procesos bajo norma." },
                { icon: Clock, title: "Respuesta Inmediata", desc: "Entregas en menos de 24 horas en GDL." },
                { icon: Wrench, title: "Ingeniería de Campo", desc: "Asesoría especializada in-situ para su maquinaria." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-square relative rounded-3xl overflow-hidden border border-border shadow-2xl skew-y-2">
              <img 
                src="https://images.unsplash.com/photo-1504917595217-d4dc5f6127a9?auto=format&fit=crop&q=80&w=1200" 
                alt="Industrial Facility" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
            </div>
            
            {/* Stat overlay */}
            <div className="absolute -bottom-8 -left-8 glass-card p-8 industrial-shadow rotate-[-2deg]">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-4xl font-bold text-primary mb-1">15+</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Años</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-1">500+</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Clientes</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
