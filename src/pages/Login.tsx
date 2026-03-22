import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { tenant } from "@/data/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Zap, ArrowLeft, Shield, X, RefreshCw, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useSystem } from "@/context/SystemContext";

const Login = () => {
  const { login, signUp } = useSystem();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let error;
    if (isLogin) {
      const result = await login(email, password);
      error = result.error;
    } else {
      const result = await signUp(email, password, name);
      error = result.error;
    }
    
    setLoading(false);

    if (error) {
       toast({
        variant: "destructive",
        title: isLogin ? "Error de Autenticación" : "Error de Registro",
        description: error.message || "Usuario o contraseña inválidos.",
      });
      return;
    }

    toast({
      title: isLogin ? `Acceso Autorizado` : `Cuenta Creada`,
      description: isLogin ? `Autenticación exitosa. Cargando entorno de trabajo...` : `Tu cuenta cliente ha sido creada correctamente.`,
    });
    
    // The SystemContext handles the actual loading state and redirecting logic through RequireAuth,
    // but we can manually push them to home if they just signed up, or dashboard if they logged in.
    // The safest is just navigating to / and letting RequireAuth redirect if they are admin.
    if (!isLogin) {
       navigate("/");
    } else {
       navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 relative overflow-hidden">
      {/* Premium Background Layer */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 grayscale"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1565608438257-fac3c27beb36?auto=format&fit=crop&q=80&w=2000')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors mb-8 group disabled:opacity-50"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Regresar al Inicio</span>
        </button>

        <Card className="bg-black/60 border-white/10 backdrop-blur-2xl shadow-2xl industrial-shadow overflow-hidden relative">
          <button 
            onClick={() => navigate("/")}
            disabled={loading}
            className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors z-20 disabled:opacity-50"
            title="Cerrar y volver al inicio"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          
          <CardHeader className="space-y-4 text-center pt-10 pb-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-none skew-x-[-12deg] bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                {isLogin ? <Shield className="h-8 w-8 skew-x-[12deg]" /> : <UserPlus className="h-8 w-8 skew-x-[12deg]" />}
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-display font-black tracking-tight text-white uppercase">{tenant.name}</CardTitle>
              <p className="text-[10px] font-bold text-primary tracking-[0.4em] uppercase mt-2">
                {isLogin ? "Acceso al Sistema" : "Registro de Cliente"}
              </p>
            </div>
          </CardHeader>

          <form onSubmit={handleAuth}>
            <CardContent className="space-y-6 px-8">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="space-y-2"
                >
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Nombre Completo</label>
                  <Input
                    type="text"
                    placeholder="Juan Pérez"
                    required={!isLogin}
                    disabled={loading}
                    className="bg-white/5 border-white/10 text-white h-12 rounded-none focus:border-primary transition-all placeholder:text-white/10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </motion.div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Correo Corporativo</label>
                <Input
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  required
                  disabled={loading}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-none focus:border-primary transition-all placeholder:text-white/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Llave de Seguridad</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  min={6}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-none focus:border-primary transition-all placeholder:text-white/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            
            <CardFooter className="p-8 pt-4 flex flex-col gap-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-none skew-x-[-12deg] transition-all group overflow-hidden relative disabled:opacity-70"
              >
                {!loading && <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[45deg]" />}
                <span className="skew-x-[12deg] flex items-center justify-center gap-2">
                  {loading ? (
                     <>PROCESANDO <RefreshCw className="h-4 w-4 animate-spin text-white" /></>
                  ) : (
                     <>
                        {isLogin ? "AUTENTICAR" : "CREAR CUENTA"} 
                        {isLogin ? <Zap className="h-4 w-4 fill-white" /> : <UserPlus className="h-4 w-4" />}
                     </>
                  )}
                </span>
              </Button>
              
              <button
                type="button"
                className="text-[10px] text-white/40 hover:text-white font-bold uppercase tracking-widest transition-colors mt-2"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
              >
                {isLogin ? "¿Eres cliente nuevo? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center mt-8 text-[10px] text-white/30 uppercase tracking-[0.2em]">
          Plataforma Segura SSL/TLS • Distribuidora EISEN © 2026
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
