import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { tenant } from "@/data/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";

import { useSystem } from "@/context/SystemContext";

const Login = () => {
  const { login } = useSystem();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simular lógica de roles basada en el correo
    const role = email.toLowerCase().includes("admin") ? "admin" : "employee";
    
    login(email, role);
    
    toast({
      title: `Bienvenido (${role})`,
      description: "Sesión iniciada correctamente.",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-elevated border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/30">
              <Zap className="h-7 w-7" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display font-bold">{tenant.name}</CardTitle>
          <p className="text-sm text-muted-foreground text-center">Inicia sesión en tu plataforma</p>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo Electrónico</label>
              <Input
                type="email"
                placeholder="usuario@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Entrar al Sistema
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
