import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, MessageSquare, Phone, Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const clients = [
    { id: "1", name: "Carnicería Don Juan", contact: "Juan Pérez", email: "juan@donjuan.com", status: "Frecuente", lastSale: "2026-03-01" },
    { id: "2", name: "Inmobiliaria Jalisco", contact: "Gaby Mendoza", email: "gaby@jalisco.mx", status: "Nuevo", lastSale: "2026-02-15" },
    { id: "3", name: "Eventos Especiales GDL", contact: "Roberto Díaz", email: "roberto@eventosgdl.com", status: "Frecuente", lastSale: "2026-03-05" },
];

const CRMPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-display font-bold">CRM / Clientes</h1>
                    <p className="text-sm text-muted-foreground">Gestión de relaciones y prospectos locales</p>
                </div>
                <Button className="gap-2"><UserPlus className="h-4 w-4" /> Nuevo Cliente</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Clientes</p>
                    <p className="text-2xl font-bold mt-1">128</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nuevos (Mes)</p>
                    <p className="text-2xl font-bold mt-1 text-success">+12</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tasa Retención</p>
                    <p className="text-2xl font-bold mt-1">85%</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Prospectos</p>
                    <p className="text-2xl font-bold mt-1 text-info">24</p>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Estatus</TableHead>
                                <TableHead>Última Venta</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell>
                                        <div className="font-medium">{c.name}</div>
                                        <div className="text-xs text-muted-foreground">{c.email}</div>
                                    </TableCell>
                                    <TableCell>{c.contact}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${c.status === 'Frecuente' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
                                            {c.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{c.lastSale}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MessageSquare className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Mail className="h-4 w-4" /></Button>
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
