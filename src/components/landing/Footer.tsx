import { tenant } from "@/data/mock-data";

export function Footer() {
  return (
    <footer className="gradient-hero text-primary-foreground py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="text-xl">{tenant.logo}</span>
            {tenant.name}
          </div>
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 text-sm text-primary-foreground/60">
            <a href="#" className="hover:text-primary-foreground transition-colors">Facebook</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
