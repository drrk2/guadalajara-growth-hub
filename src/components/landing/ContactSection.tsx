import { tenant } from "@/data/mock-data";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactSection() {
  return (
    <section id="contacto" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">Contacto</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Dirección</p>
                <p className="text-sm text-muted-foreground">{tenant.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Teléfono</p>
                <p className="text-sm text-muted-foreground">{tenant.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Email</p>
                <p className="text-sm text-muted-foreground">{tenant.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Horario</p>
                <p className="text-sm text-muted-foreground">Lun-Sáb: 10:00 AM - 11:00 PM</p>
                <p className="text-sm text-muted-foreground">Dom: 10:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border shadow-card">
            <h3 className="font-display font-semibold mb-4">Envíanos un mensaje</h3>
            <div className="space-y-3">
              <input placeholder="Tu nombre" className="w-full px-3 py-2 rounded-md border bg-background text-sm" />
              <input placeholder="Tu email" className="w-full px-3 py-2 rounded-md border bg-background text-sm" />
              <textarea placeholder="Mensaje" rows={3} className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none" />
              <Button className="w-full">Enviar Mensaje</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
