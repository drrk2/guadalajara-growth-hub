import { tenant } from "@/data/mock-data";
import { motion } from "framer-motion";

export function AboutSection() {
  return (
    <section id="nosotros" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Sobre Nosotros</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Con más de 15 años de experiencia, <strong className="text-foreground">{tenant.name}</strong> es el aliado estratégico de la industria en Jalisco. 
              Nos especializamos en el suministro de refacciones críticas y soluciones electromecánicas, 
              asegurando que la operación de nuestros clientes nunca se detenga.
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-card rounded-lg p-4 shadow-card border">
                <span className="text-3xl font-display font-bold text-primary">15+</span>
                <p className="text-xs text-muted-foreground mt-1">Años de experiencia</p>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-card border">
                <span className="text-3xl font-display font-bold text-secondary">500+</span>
                <p className="text-xs text-muted-foreground mt-1">Clientes industriales</p>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-card border">
                <span className="text-3xl font-display font-bold text-primary">10K+</span>
                <p className="text-xs text-muted-foreground mt-1">Refacciones en stock</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
