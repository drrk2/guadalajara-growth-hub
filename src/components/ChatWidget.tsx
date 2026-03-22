import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn("VITE_GROQ_API_KEY is missing from environment variables.");
}
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "¡Hola! Bienvenido a tacos - Business Hub. Soy tu asistente de atención al cliente. ¿En qué puedo ayudarte hoy sobre nuestros servicios?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch(GROQ_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: "Eres el Asistente de Atención al Cliente de una taqueria. Tu ÚNICA función es ayudar a clientes externos con información general de la empresa, servicios ofrecidos y datos de contacto, ayudarle a como hacer un pedido, dudas relacionadas unicamente al servicio de ayuda. \n\nREGLAS CRÍTICAS:\n1. NO tienes acceso al sistema interno (SaaS) ni a su base de datos.\n2. NO conoces datos de inventario, ventas, nóminas o usuarios específicos registrados.\n3. Si te preguntan sobre el estado interno del negocio, responde profesionalmente que eres un asistente de atención pública y no tienes acceso a información administrativa privada.\n4. Mantén un tono servicial, profesional y tapatío. \n5. No digas que eres un modelo de lenguaje, di que eres el asistente de atención al cliente de la taqueria, habla en un tono humano y natural y nunca menciones nada del crm, erp o cualquier sistema que estes usando, todo lo que esta dentro es confiddencial \n6. evita este tipo de respuestas o relacionadas: Nuestro ERP (Sistema de Planificación de Recursos Empresariales) es una herramienta integral que ayuda a las empresas a gestionar y automatizar sus procesos de manera eficiente. Aunque no tengo acceso a detalles específicos de implementación, puedo contarte que nuestro ERP ofrece una plataforma unificada para gestionar áreas como la contabilidad, la logística, la producción, el inventario y la gestión de recursos humanos. En general, un ERP como el nuestro puede ayudar a las empresas a: * Mejorar la eficiencia operativa * Reducir costos y mejorar la productividad * Mejorar la toma de decisiones con informes y análisis en tiempo real * Automatizar procesos y reducir errores manuales * Integrar y sincronizar datos de diferentes departamentos y áreas de la empresa Sin embargo, para obtener información más detallada y específica sobre cómo funciona nuestro ERP en la práctica, te recomiendo que te comuniques directamente con nuestro equipo de ventas o soporte técnico. Ellos podrán proporcionarte una demostración personalizada y responder a cualquier pregunta que tengas sobre cómo nuestro ERP puede ayudar a tu empresa. ¿Te gustaría que te proporcione información de contacto para que puedas comunicarte con nuestro equipo de ventas o soporte técnico?"
                        },
                        ...messages,
                        userMessage
                    ],
                    temperature: 0.6,
                })
            });

            const data = await response.json();
            const botContent = data.choices[0]?.message?.content || "Lo siento, tuve un problema al procesar tu solicitud.";

            setMessages(prev => [...prev, { role: "assistant", content: botContent }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Por favor verifica tu internet e intenta de nuevo." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[350px] sm:w-[400px] h-[500px] shadow-2xl"
                    >
                        <Card className="h-full flex flex-col border-primary/20 bg-background/95 backdrop-blur-md">
                            <CardHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm font-display font-medium flex items-center gap-2">
                                    <Bot className="h-5 w-5" /> Soporte GTP SaaS
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/10" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden bg-muted/30">
                                <ScrollArea className="h-full p-4" ref={scrollRef}>
                                    <div className="space-y-4">
                                        {messages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user'
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-card text-card-foreground rounded-tl-none border border-border'
                                                    }`}>
                                                    <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold">
                                                        {msg.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                                                        {msg.role === 'user' ? 'Tú' : 'Soporte'}
                                                    </div>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-card text-card-foreground rounded-2xl rounded-tl-none px-4 py-3 border border-border shadow-sm">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="p-4 border-t bg-background">
                                <form
                                    className="flex w-full items-center space-x-2"
                                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                >
                                    <Input
                                        placeholder="Escribe tu duda aquí..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        disabled={isLoading}
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                            <div className="px-4 pb-2 text-[8px] text-center text-muted-foreground uppercase tracking-widest bg-background">
                                Centro de Atención al Cliente • GTP SaaS
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="icon"
                className={`h-14 w-14 rounded-full shadow-elevated transition-transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary shadow-primary/20'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </Button>
        </div>
    );
};

export default ChatWidget;
