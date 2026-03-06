import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { employees as mockEmployees, payroll as mockPayroll } from "@/data/mock-data";
import { CheckCircle, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

const NominasPage = () => {
  const { toast } = useToast();
  const [payrollData, setPayrollData] = useState(mockPayroll);
  const activeEmployees = mockEmployees.filter(e => e.status === "active");
  const totalNomina = activeEmployees.reduce((a, e) => a + e.salary, 0);
  const pendientes = payrollData.filter(p => p.status === "pending");
  const pagadas = payrollData.filter(p => p.status === "paid");

  const handlePayAll = () => {
    setPayrollData(payrollData.map(p => p.status === "pending" ? { ...p, status: "paid", paidDate: "2026-03-06" } : p));
    toast({ title: "Nóminas pagadas", description: "Se procesaron todas las nóminas pendientes." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Nóminas</h1>
          <p className="text-sm text-muted-foreground">Gestión de empleados y pagos</p>
        </div>
        {pendientes.length > 0 && (
          <Button onClick={handlePayAll} className="gap-2">
            <DollarSign className="h-4 w-4" /> Pagar Todas ({pendientes.length})
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nómina Mensual Total</p>
              <p className="text-xl font-display font-bold">{formatMoney(totalNomina)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-xl font-display font-bold">{pendientes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pagadas</p>
              <p className="text-xl font-display font-bold">{pagadas.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-lg">Empleados Activos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Fecha de Ingreso</TableHead>
                <TableHead className="text-right">Salario</TableHead>
                <TableHead>Estado Nómina</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeEmployees.map((emp) => {
                const pStatus = payrollData.find(p => p.employeeId === emp.id && p.period === "2026-03");
                return (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.position}</TableCell>
                    <TableCell className="text-sm">{emp.startDate}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{formatMoney(emp.salary)}</TableCell>
                    <TableCell>
                      {pStatus?.status === "paid" ? (
                        <Badge className="bg-success/10 text-success border-0">Pagada</Badge>
                      ) : pStatus?.status === "pending" ? (
                        <Badge variant="outline" className="text-warning border-warning/30">Pendiente</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
