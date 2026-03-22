import { services } from "@/data/mock-data";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ServicesSection() {
  return (
    <section id="servicios" className="py-24 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full -z-10" />

      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white tracking-tight">Nuestros Servicios</h2>
          <p className="text-white/50 text-lg leading-relaxed">
            Soluciones integrales diseñadas para maximizar la eficiencia operativa y garantizar la continuidad de sus procesos industriales.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {services.map((service, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                show: { opacity: 1, scale: 1 }
              }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <Card className="h-full bg-white/5 border-white/10 backdrop-blur-xl group-hover:bg-white/10 group-hover:border-primary/50 transition-all duration-500 overflow-hidden relative industrial-shadow">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-primary transition-all duration-500 scale-150 group-hover:scale-100">
                  <service.icon className="h-12 w-12" />
                </div>
                <CardHeader className="relative z-10">
                  <div className="h-14 w-14 rounded-none skew-x-[-12deg] bg-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-500 shadow-[0_0_20px_rgba(215,31,31,0.2)]">
                    <service.icon className="h-7 w-7 text-primary group-hover:text-white transition-colors duration-500 skew-x-[12deg]" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white mb-2">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-white/40 group-hover:text-white/70 transition-colors leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-700" />
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
