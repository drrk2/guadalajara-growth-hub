import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, MessageSquare, Phone, Mail, Clock, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useSystem } from "@/context/SystemContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const CRMPage = () => {
    const { employees, loadingEmployees, upsertEmployee } = useSystem();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    if (loadingEmployees) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-50">Cargando Colaboradores...</p>
            </div>
        );
    }

    const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const newEmp = {
            name: fd.get("name") as string,
            email: fd.get("email") as string,
            position: fd.get("position") as string,
            salary: Number(fd.get("salary")),
            status: "active",
            startDate: new Date().toISOString().split('T')[0]
        };

        try {
            await upsertEmployee(newEmp);
            setIsDialogOpen(false);
            toast({ title: "Colaborador añadido", description: `${newEmp.name} se ha registrado con éxito.` });
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el colaborador." });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-display font-bold">Capital Humano / CRM</h1>
                    <p className="text-sm text-muted-foreground">Gestión de colaboradores y equipo local</p>
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
                                <Input name="email" type="email" placeholder="juan@eisen.mx" required />
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center border-l-4 border-l-primary">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Equipo</p>
                    <p className="text-2xl font-black mt-1">{employees.length}</p>
                </Card>
                <Card className="p-4 text-center border-l-4 border-l-success">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Activos</p>
                    <p className="text-2xl font-black mt-1 text-success">{employees.filter(e => e.status === 'active').length}</p>
                </Card>
                <Card className="p-4 text-center border-l-4 border-l-warning">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Inactivos</p>
                    <p className="text-2xl font-black mt-1 text-warning">{employees.filter(e => e.status !== 'active').length}</p>
                </Card>
                <Card className="p-4 text-center border-l-4 border-l-info">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Costo Mensual</p>
                    <p className="text-2xl font-black mt-1 text-info">
                        ${employees.reduce((a, b) => a + (b.salary || 0), 0).toLocaleString()}
                    </p>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold">Colaborador</TableHead>
                                <TableHead className="font-bold">Puesto</TableHead>
                                <TableHead className="font-bold">Estatus</TableHead>
                                <TableHead className="font-bold">Ingreso</TableHead>
                                <TableHead className="text-right font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((c) => (
                                <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                                    <TableCell>
                                        <div className="font-bold">{c.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{c.email}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{c.position}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${c.status === 'active' ? 'bg-success/10 text-success border border-success/20' : 'bg-muted text-muted-foreground border border-muted-foreground/20'}`}>
                                            {c.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm font-mono text-muted-foreground">{c.startDate || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Phone className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><MessageSquare className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Mail className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default CRMPage;
