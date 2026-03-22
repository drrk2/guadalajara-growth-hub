import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSystem } from "@/context/SystemContext";
import { CheckCircle, Clock, DollarSign, RotateCcw, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

const NominasPage = () => {
  const { toast } = useToast();
  const { employees, payroll, upsertPayroll, loadingEmployees, loadingPayroll } = useSystem();

  const activeEmployees = employees.filter(e => e.status === "active");
  const currentPeriod = "2026-03";

  const totalNomina = activeEmployees.reduce((a, e) => a + e.salary, 0);
  const periodPayroll = payroll.filter(p => p.period === currentPeriod);
  const pendientes = periodPayroll.filter(p => p.status === "pending");
  const pagadas = periodPayroll.filter(p => p.status === "paid");

  const handlePayAll = async () => {
    const pending = periodPayroll.filter(p => p.status === "pending");
    try {
        const promises = pending.map(p => upsertPayroll({
            ...p,
            status: "paid",
            paidDate: new Date().toISOString().split('T')[0]
        }));
        await Promise.all(promises);
        toast({ title: "Nóminas masivas", description: "Todos los pendientes del periodo actual han sido pagados." });
    } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron procesar todos los pagos." });
    }
  };

  const toggleStatus = async (employeeId: string) => {
    const existingRef = payroll.find(p => p.employeeId === employeeId && p.period === currentPeriod);
    
    // If no payroll entry exists for this period, we should probably create one
    const p = existingRef || {
        employeeId,
        period: currentPeriod,
        status: "pending",
        amount: employees.find(e => e.id === employeeId)?.salary || 0
    };

    const isPaid = p.status === "paid";
    
    try {
        await upsertPayroll({
            ...p,
            status: isPaid ? "pending" : "paid",
            paidDate: isPaid ? null : new Date().toISOString().split('T')[0]
        });
        
        toast({
            title: isPaid ? "Pago Revertido" : "Pago Confirmado",
            description: isPaid ? "El estatus volvió a pendiente." : "El empleado ha sido pagado.",
            variant: isPaid ? "destructive" : "default"
        });
    } catch (err) {
        toast({ variant: "destructive", title: "Error de red", description: "No se pudo actualizar el estatus en el servidor." });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Gestión de Nóminas</h1>
          <p className="text-sm text-muted-foreground">Periodo actual: {currentPeriod}</p>
        </div>
        {pendientes.length > 0 && (
          <Button onClick={handlePayAll} className="gap-2 shadow-lg hover:scale-105 transition-transform">
            <DollarSign className="h-4 w-4" /> Pagar Todas ({pendientes.length})
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="shadow-card bg-card/40 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Mensual</p>
              <p className="text-xl font-display font-bold">{formatMoney(totalNomina)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card bg-warning/5 border-warning/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Por Pagar</p>
              <p className="text-xl font-display font-bold text-warning">{pendientes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card bg-success/5 border-success/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Liquidadas</p>
              <p className="text-xl font-display font-bold text-success">{pagadas.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b"><CardTitle className="font-display text-lg">Reporte de Colaboradores</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="font-bold">Colaborador</TableHead>
                <TableHead className="font-bold">Puesto</TableHead>
                <TableHead className="text-right font-bold">Salario</TableHead>
                <TableHead className="text-center font-bold">Estatus</TableHead>
                <TableHead className="text-right font-bold">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeEmployees.map((emp) => {
                const payrollEntry = periodPayroll.find(p => p.employeeId === emp.id);
                const isPaid = payrollEntry?.status === "paid";
                return (
                  <TableRow key={emp.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">
                      <div>
                        {emp.name}
                        <p className="text-[10px] text-muted-foreground font-normal">Ingreso: {emp.startDate}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{emp.position}</TableCell>
                    <TableCell className="text-sm text-right font-bold">{formatMoney(emp.salary)}</TableCell>
                    <TableCell className="text-center">
                      {isPaid ? (
                        <Badge className="bg-success/20 text-success border-0 hover:bg-success/30 px-3">PAGADA</Badge>
                      ) : (
                        <Badge variant="outline" className="text-warning border-warning/50 px-3 animate-pulse">PENDIENTE</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 gap-1.5 ${isPaid ? 'text-muted-foreground hover:text-warning' : 'text-success hover:bg-success/10'}`}
                        onClick={() => toggleStatus(emp.id)}
                      >
                        {isPaid ? (
                          <><RotateCcw className="h-3.5 w-3.5" /> Revertir</>
                        ) : (
                          <><Check className="h-3.5 w-3.5" /> Confirmar</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default NominasPage;
