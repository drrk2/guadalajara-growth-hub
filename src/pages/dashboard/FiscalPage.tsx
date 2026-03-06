import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const facturas = [
    { id: "1", folio: "F-1024", uuid: "550e8400-e29b-41d4-a716-446655440000", total: 12500, status: "Vigente", date: "2026-03-01" },
    { id: "2", folio: "F-1025", uuid: "660e8400-e29b-41d4-a716-446655440111", total: 3200, status: "Vigente", date: "2026-03-02" },
    { id: "3", folio: "F-1026", uuid: "770e8400-e29b-41d4-a716-446655440222", total: 4800, status: "Cancelado", date: "2026-03-03" },
];

const FiscalPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-display font-bold">Módulo SAT / Fiscal</h1>
                <p className="text-sm text-muted-foreground">Gestión de CFDIs 4.0 y cumplimiento tributario</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-success/10 rounded-full"><CheckCircle className="h-6 w-6 text-success" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Estatus SAT</p>
                            <p className="font-bold">Conectado (Vigente)</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-info/10 rounded-full"><FileText className="h-6 w-6 text-info" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Facturas Mes</p>
                            <p className="font-bold">82 emitidas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-warning/10 rounded-full"><Clock className="h-6 w-6 text-warning" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Próxima Declaración</p>
                            <p className="font-bold">17 de Marzo</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-lg font-display">Últimas Facturas Emitidas</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Folio</TableHead>
                                <TableHead>UUID / SAT ID</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Estatus</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {facturas.map((f) => (
                                <TableRow key={f.id}>
                                    <TableCell className="font-medium">{f.folio}</TableCell>
                                    <TableCell className="text-xs font-mono text-muted-foreground">{f.uuid}</TableCell>
                                    <TableCell>{f.date}</TableCell>
                                    <TableCell>${f.total.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${f.status === 'Vigente' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                            {f.status}
                                        </span>
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

export default FiscalPage;
