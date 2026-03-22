import { services } from "@/data/mock-data";
import { motion } from "framer-motion";

export function ServicesSection() {
  return (
    <section id="servicios" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">Nuestros Servicios</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-md mx-auto">Soluciones integrales para la industria, garantizando calidad y ahorro en cada mantenimiento.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-lg p-6 shadow-card hover:shadow-elevated transition-shadow border"
            >
              <span className="text-4xl mb-4 block">{s.icon}</span>
              <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
