import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { alerts } from "@/data/mock-data";
import { AlertTriangle, Bell, DollarSign, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const severityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-info/10 text-info border-info/20",
  info: "bg-primary/10 text-primary border-primary/20",
};

const typeIcons: Record<string, React.ElementType> = {
  stock: Package,
  payroll: DollarSign,
  expense: AlertTriangle,
  finance: TrendingUp,
};

const AlertasPage = () => {
  const unread = alerts.filter(a => !a.read);
  const read = alerts.filter(a => a.read);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Centro de Alertas</h1>
          <p className="text-sm text-muted-foreground">{unread.length} alertas sin leer</p>
        </div>
        <Button variant="outline" size="sm">Marcar todas como leídas</Button>
      </div>

      {unread.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Nuevas</h2>
          {unread.map(alert => {
            const Icon = typeIcons[alert.type] || Bell;
            return (
              <Card key={alert.id} className="shadow-card border-l-4 border-l-destructive">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${severityColors[alert.severity]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.date}</p>
                  </div>
                  <Badge className={severityColors[alert.severity]}>{alert.severity}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Separator />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Anteriores</h2>
        {read.map(alert => {
          const Icon = typeIcons[alert.type] || Bell;
          return (
            <Card key={alert.id} className="shadow-card opacity-70">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${severityColors[alert.severity]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.date}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AlertasPage;
