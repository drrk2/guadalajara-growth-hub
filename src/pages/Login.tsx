import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { tenant } from "@/data/mock-data";
import { ArrowLeft, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("demo@tacoselpatron.mx");
  const [password, setPassword] = useState("demo123");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: just redirect to dashboard
    toast({ title: "¡Bienvenido!", description: "Accediendo al panel de administración..." });
    setTimeout(() => navigate("/dashboard"), 500);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
      <Card className="w-full max-w-md shadow-elevated relative z-10">
        <CardHeader className="text-center">
          <button onClick={() => navigate("/")} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-4xl mb-2 block">{tenant.logo}</span>
          <CardTitle className="font-display text-2xl">{tenant.name}</CardTitle>
          <CardDescription>Accede a tu panel de administración</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full gap-2">
              <LogIn className="h-4 w-4" /> Iniciar Sesión
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Demo: usa cualquier credencial para acceder
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
