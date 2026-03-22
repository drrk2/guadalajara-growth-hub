import { tenant } from "@/data/mock-data";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ContactSection() {
  return (
    <section id="contacto" className="py-24 bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full -z-10" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 tracking-tight">Contacto Directo</h2>
            <p className="text-white/50 text-lg">Estamos listos para atender sus requerimientos industriales con la rapidez que su planta necesita.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              {[
                { icon: MapPin, title: "Planta y Almacén", content: tenant.address },
                { icon: Phone, title: "Línea Técnica", content: tenant.phone },
                { icon: Mail, title: "Ventas Corporativas", content: tenant.email },
                { icon: Clock, title: "Disponibilidad Industrial", content: "Lun - Vie: 8:00 AM - 6:00 PM / Sáb: 9:00 AM - 1:00 PM" },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="h-12 w-12 shrink-0 rounded-none skew-x-[-12deg] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                    <item.icon className="h-5 w-5 text-primary group-hover:text-white transition-colors duration-300 skew-x-[12deg]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest text-primary/80 mb-1">{item.title}</h4>
                    <p className="text-white/60 group-hover:text-white transition-colors">{item.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card p-10 border-white/10 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 group-hover:bg-primary/20 transition-all" />
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <span className="h-8 w-1 bg-primary" /> Solicitud de Cotización
              </h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Nombre Completo</label>
                  <input placeholder="Ej. Ing. Roberto Sánchez" className="w-full px-4 py-3 rounded-none bg-white/5 border border-white/10 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Correo Corporativo</label>
                  <input placeholder="contacto@empresa.com" className="w-full px-4 py-3 rounded-none bg-white/5 border border-white/10 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Detalle del Requerimiento</label>
                  <textarea placeholder="SKU, cantidad o especificaciones..." rows={4} className="w-full px-4 py-3 rounded-none bg-white/5 border border-white/10 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-white/20" />
                </div>
                <Button className="w-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-none skew-x-[-4deg] transition-all shadow-xl shadow-primary/20 gap-3">
                  <Send className="h-5 w-5" /> ENVIAR REQUERIMIENTO
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
