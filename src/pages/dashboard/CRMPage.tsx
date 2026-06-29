import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  UserPlus, MessageSquare, Phone, Mail, RefreshCw,
  DollarSign, CheckCircle, Clock, RotateCcw, Check, Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSystem } from "@/context/SystemContext";

const fmt = (n: number) => `$${n.toLocaleString("es-MX")}`;
const currentPeriod = () => new Date().toISOString().slice(0, 7);

const CRMPage = () => {
  const { toast } = useToast();
  const {
    employees, loadingEmployees, upsertEmployee,
    payroll, upsertPayroll,
  } = useSystem();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ── Add employee ─────────────────────────────────────────────────────────

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newEmp = {
      name:       fd.get("name") as string,
      email:      fd.get("email") as string,
      position:   fd.get("position") as string,
      salary:     Number(fd.get("salary")),
      status:     "active",
      start_date: new Date().toISOString().split("T")[0],
    };
    try {
      await upsertEmployee(newEmp);
      setIsDialogOpen(false);
      toast({ title: "Colaborador añadido", description: `${newEmp.name} registrado con éxito.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el colaborador." });
    }
  };

  // ── Payroll ──────────────────────────────────────────────────────────────

  const period = currentPeriod();
  const payrollEmployees = employees.filter(
    (e: any) => e.status === "active" && e.payroll_enabled !== false
  );
  const totalNomina   = payrollEmployees.reduce((a: number, e: any) => a + (e.salary || 0), 0);
  const periodPayroll = payroll.filter((p: any) => p.period === period);
  const pendientes    = periodPayroll.filter((p: any) => p.status === "pending");
  const pagadas       = periodPayroll.filter((p: any) => p.status === "paid");

  const handlePayAll = async () => {
    try {
      await Promise.all(
        pendientes.map((p: any) =>
          upsertPayroll({ ...p, status: "paid", paid_date: new Date().toISOString().split("T")[0] })
        )
      );
      toast({ title: "Nóminas procesadas", description: "Todos los pendientes han sido pagados." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron procesar todos los pagos." });
    }
  };

  const togglePayrollStatus = async (employeeId: string) => {
    const existing = payroll.find((p: any) => p.employee_id === employeeId && p.period === period);
    const entry = existing ?? {
      employee_id: employeeId,
      period,
      status: "pending",
      amount: employees.find((e: any) => e.id === employeeId)?.salary ?? 0,
    };
    const isPaid = (entry as any).status === "paid";
    try {
      await upsertPayroll({
        ...entry,
        status:    isPaid ? "pending" : "paid",
        paid_date: isPaid ? null : new Date().toISOString().split("T")[0],
      });
      toast({
        title:       isPaid ? "Pago Revertido" : "Pago Confirmado",
        description: isPaid ? "El estatus volvió a pendiente." : "El empleado ha sido pagado.",
        variant:     isPaid ? "destructive" : "default",
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estatus." });
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loadingEmployees) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest opacity-50">Cargando Equipo...</p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight">Equipo</h1>
          <p className="text-sm text-muted-foreground">Gestión de colaboradores y nómina</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="h-4 w-4" /> Nuevo Colaborador</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Nuevo Colaborador</DialogTitle></DialogHeader>
            <form onSubmit={handleAddEmployee} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input name="name" placeholder="Ej. Juan Pérez" required />
              </div>
              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <Input name="email" type="email" placeholder="juan@eisen.mx" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Puesto</Label>
                  <Input name="position" placeholder="Ej. Operador" required />
                </div>
                <div className="space-y-2">
                  <Label>Salario Mensual</Label>
                  <Input name="salary" type="number" placeholder="0.00" required />
                </div>
              </div>
              <Button type="submit" className="w-full">Guardar en Base de Datos</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-l-4 border-l-primary">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Equipo</p>
          <p className="text-2xl font-black mt-1">{employees.length}</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-emerald-500">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Activos</p>
          <p className="text-2xl font-black mt-1 text-emerald-400">{employees.filter((e: any) => e.status === "active").length}</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-yellow-500">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Inactivos</p>
          <p className="text-2xl font-black mt-1 text-yellow-400">{employees.filter((e: any) => e.status !== "active").length}</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-blue-500">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Costo Mensual</p>
          <p className="text-2xl font-black mt-1 text-blue-400">{fmt(employees.reduce((a: number, b: any) => a + (b.salary || 0), 0))}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList className="mb-2">
          <TabsTrigger value="members">Miembros</TabsTrigger>
          <TabsTrigger value="payroll">Nómina</TabsTrigger>
        </TabsList>

        {/* ── Miembros ─── */}
        <TabsContent value="members">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold">Colaborador</TableHead>
                      <TableHead className="font-bold">Puesto</TableHead>
                      <TableHead className="font-bold">Estatus</TableHead>
                      <TableHead className="font-bold">Ingreso</TableHead>
                      <TableHead className="text-right font-bold">Contacto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10 text-sm">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          Sin colaboradores registrados
                        </TableCell>
                      </TableRow>
                    )}
                    {employees.map((emp: any) => (
                      <TableRow key={emp.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="font-bold text-sm">{emp.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{emp.email || "—"}</div>
                        </TableCell>
                        <TableCell className="text-sm">{emp.position || "—"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${
                            emp.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-muted-foreground/20"
                          }`}>
                            {emp.status === "active" ? "Activo" : "Inactivo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">{emp.start_date || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" title="Llamar">
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" title="Mensaje">
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" title="Email">
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Nómina ─── */}
        <TabsContent value="payroll">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Periodo: <span className="font-bold text-foreground">{period}</span>
              </p>
              {pendientes.length > 0 && (
                <Button onClick={handlePayAll} size="sm" className="gap-2 self-start sm:self-auto">
                  <DollarSign className="h-4 w-4" /> Pagar Todas ({pendientes.length})
                </Button>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="shadow-card bg-card/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Mensual</p>
                    <p className="text-xl font-display font-bold">{fmt(totalNomina)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-yellow-500/5 border-yellow-500/20">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Por Pagar</p>
                    <p className="text-xl font-display font-bold text-yellow-400">{pendientes.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Liquidadas</p>
                    <p className="text-xl font-display font-bold text-emerald-400">{pagadas.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b py-3">
                <CardTitle className="font-display text-base">Reporte — {period}</CardTitle>
              </CardHeader>
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
                    {payrollEmployees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10 text-sm">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          Sin colaboradores activos en nómina
                        </TableCell>
                      </TableRow>
                    )}
                    {payrollEmployees.map((emp: any) => {
                      const entry  = periodPayroll.find((p: any) => p.employee_id === emp.id);
                      const isPaid = (entry as any)?.status === "paid";
                      return (
                        <TableRow key={emp.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-medium">
                            {emp.name}
                            <p className="text-[10px] text-muted-foreground font-normal">Ingreso: {emp.start_date || "N/A"}</p>
                          </TableCell>
                          <TableCell className="text-sm">{emp.position}</TableCell>
                          <TableCell className="text-sm text-right font-bold">{fmt(emp.salary)}</TableCell>
                          <TableCell className="text-center">
                            {isPaid ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-0 px-3">PAGADA</Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-400 border-yellow-500/50 px-3 animate-pulse">PENDIENTE</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 gap-1.5 ${isPaid ? "text-muted-foreground hover:text-yellow-400" : "text-emerald-400 hover:bg-emerald-500/10"}`}
                              onClick={() => togglePayrollStatus(emp.id)}
                            >
                              {isPaid
                                ? <><RotateCcw className="h-3.5 w-3.5" /> Revertir</>
                                : <><Check className="h-3.5 w-3.5" /> Confirmar</>}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CRMPage;
