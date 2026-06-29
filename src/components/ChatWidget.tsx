import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { tenant } from "@/data/mock-data";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const QUICK_REPLIES = [
    "¿Qué refacciones manejan?",
    "¿Cómo solicito una cotización?",
    "¿Tienen envíos a toda la república?",
    "¿Cuáles son sus horarios?",
];

const FAQ_RESPONSES: Record<string, string> = {
    "¿Qué refacciones manejan?":
        "En EISEN manejamos refacciones electromecánicas industriales: motores WEG, variadores de frecuencia, sensores, rodamientos, retenes, tableros eléctricos, arrancadores, cables industriales y mucho más. ¿Buscas algún componente en específico?",
    "¿Cómo solicito una cotización?":
        `Es muy fácil. Puedes agregar los productos al carrito desde nuestro catálogo y enviarnos la cotización por WhatsApp al ${tenant.phone}, o escribirnos a ${tenant.email}. Un asesor te responde en menos de 2 horas en horario laboral.`,
    "¿Tienen envíos a toda la república?":
        "Sí. Contamos con envíos express para la Zona Metropolitana de Guadalajara y servicio de paquetería nacional. Para pedidos urgentes contáctanos directamente por WhatsApp.",
    "¿Cuáles son sus horarios?":
        "Atendemos de Lunes a Viernes de 8:00 a 18:00 hrs y Sábados de 9:00 a 14:00 hrs. Fuera de horario puedes dejarnos tu consulta y te respondemos al siguiente día hábil.",
};

const getAutoReply = (input: string): string | null => {
    const lower = input.toLowerCase();
    if (lower.includes("refaccion") || lower.includes("producto") || lower.includes("manejan"))
        return FAQ_RESPONSES["¿Qué refacciones manejan?"];
    if (lower.includes("cotiz") || lower.includes("precio") || lower.includes("solicito"))
        return FAQ_RESPONSES["¿Cómo solicito una cotización?"];
    if (lower.includes("env") || lower.includes("rep") || lower.includes("nacional"))
        return FAQ_RESPONSES["¿Tienen envíos a toda la república?"];
    if (lower.includes("horario") || lower.includes("hora") || lower.includes("atienden"))
        return FAQ_RESPONSES["¿Cuáles son sus horarios?"];
    return null;
};

const FALLBACK = `Gracias por tu mensaje. Un asesor de EISEN te contactará pronto. También puedes escribirnos directamente:\n\n📱 WhatsApp: ${tenant.phone}\n✉️ Email: ${tenant.email}`;

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: `¡Hola! Bienvenido a **EISEN Industrial**. Soy tu asistente de atención al cliente. ¿En qué puedo ayudarte hoy?\n\nPuedes seleccionar una pregunta frecuente o escribir tu consulta.`,
        },
    ]);
    const [input, setInput] = useState("");
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = (text: string) => {
        if (!text.trim()) return;
        setShowQuickReplies(false);

        const userMessage: Message = { role: "user", content: text };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");

        setTimeout(() => {
            const reply = FAQ_RESPONSES[text] ?? getAutoReply(text) ?? FALLBACK;
            setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        }, 400);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[350px] sm:w-[400px] shadow-2xl"
                    >
                        <Card className="flex flex-col border-primary/20 bg-background/95 backdrop-blur-md" style={{ height: 520 }}>
                            <CardHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between space-y-0 shrink-0">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-wide">
                                    <Bot className="h-5 w-5" /> Soporte EISEN Industrial
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary-foreground hover:bg-white/10"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>

                            <CardContent className="flex-1 p-0 overflow-hidden bg-muted/30">
                                <ScrollArea className="h-full p-4" ref={scrollRef}>
                                    <div className="space-y-4">
                                        {messages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-line ${
                                                        msg.role === "user"
                                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                                            : "bg-card text-card-foreground rounded-tl-none border border-border"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1 mb-1 opacity-50 text-[10px] uppercase font-bold">
                                                        {msg.role === "user" ? (
                                                            <><User className="h-3 w-3" /> Tú</>
                                                        ) : (
                                                            <><Bot className="h-3 w-3" /> Asistente EISEN</>
                                                        )}
                                                    </div>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}

                                        {showQuickReplies && (
                                            <div className="space-y-2 pt-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Preguntas frecuentes:</p>
                                                {QUICK_REPLIES.map((q) => (
                                                    <button
                                                        key={q}
                                                        onClick={() => sendMessage(q)}
                                                        className="w-full text-left text-xs px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/15 text-foreground transition-colors"
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>

                            <CardFooter className="p-4 border-t bg-background shrink-0 flex-col gap-3">
                                <form className="flex w-full items-center gap-2" onSubmit={handleSubmit}>
                                    <Input
                                        placeholder="Escribe tu consulta..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon" disabled={!input.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                                <div className="flex items-center gap-4 w-full justify-center">
                                    <a
                                        href={`https://wa.me/${tenant.whatsapp}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Phone className="h-3 w-3" /> WhatsApp
                                    </a>
                                    <a
                                        href={`mailto:${tenant.email}`}
                                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Mail className="h-3 w-3" /> Email
                                    </a>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="icon"
                className={`h-14 w-14 rounded-full shadow-elevated transition-transform hover:scale-110 active:scale-95 ${
                    isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary shadow-primary/20"
                }`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Cerrar chat" : "Abrir chat de soporte"}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </Button>
        </div>
    );
};

export default ChatWidget;
