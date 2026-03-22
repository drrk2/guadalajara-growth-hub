// Demo data for "EISEN - Industrial Electromechanical"

export const tenant = {
  id: "eisen-demo-001",
  name: "EISEN",
  slug: "eisen-industrial",
  logo: "⚙️",
  tagline: "Refacciones y Soluciones Electromecánicas Industriales",
  phone: "+52 33 9876 5432",
  whatsapp: "5213398765432",
  email: "ventas@eisenmx.com",
  address: "Zona Industrial, Guadalajara, Jalisco",
  website: "eisenmx.com",
  social: {
    facebook: "eisenindustrial",
    instagram: "eisenindustrial",
  },
};

export const services = [
  { icon: "⚙️", title: "Refacciones", description: "Venta de componentes mecánicos y eléctricos para la industria" },
  { icon: "⚡", title: "Asesoría Técnica", description: "Soporte especializado en sistemas electromecánicos" },
  { icon: "🛠️", title: "Mantenimiento", description: "Reparación y mantenimiento de motores y equipos" },
  { icon: "📦", title: "Envíos Locales", description: "Entrega inmediata en la Zona Metropolitana de Guadalajara" },
];

export const kpis = {
  ingresosMes: 345600,
  gastosMes: 185600,
  empleadosActivos: 8,
  productosStockBajo: 5,
  nominasPendientes: 2,
  alertasActivas: 6,
};

export const expenses = [
  { id: "1", category: "Proveedores", description: "Lote de Motores WEG", amount: 45000, date: "2026-03-01", provider: "WEG México" },
  { id: "2", category: "Servicios", description: "Electricidad bodega", amount: 5400, date: "2026-03-02", provider: "CFE" },
  { id: "3", category: "Proveedores", description: "Sensores y Controles", amount: 15800, date: "2026-03-03", provider: "Schneider Electric" },
  { id: "4", category: "Marketing", description: "Anuncios en Directorio Industrial", amount: 3500, date: "2026-03-04", provider: "IndustrialAds" },
  { id: "5", category: "Mantenimiento", description: "Servicio a montacargas", amount: 4200, date: "2026-03-05", provider: "Mantenimiento Montacargas GDL" },
  { id: "6", category: "Proveedores", description: "Empaques y Retenes", amount: 8600, date: "2026-03-05", provider: "Sellos del Occidente" },
  { id: "7", category: "Renta", description: "Renta de bodega", amount: 25000, date: "2026-03-01", provider: "Naves Industriales GDL" },
  { id: "8", category: "Servicios", description: "Internet de alta velocidad", amount: 1500, date: "2026-03-03", provider: "TotalPlay Empresarial" },
];

export const expenseCategories = ["Proveedores", "Servicios", "Marketing", "Mantenimiento", "Renta", "Nómina", "Otros"];

export const employees = [
  { id: "1", name: "Roberto Sánchez", position: "Director General", salary: 35000, status: "active", startDate: "2018-05-10" },
  { id: "2", name: "Elena Ramírez", position: "Ventas Técnicas", salary: 18000, status: "active", startDate: "2020-02-15" },
  { id: "3", name: "Marco Polo", position: "Técnico Especialista", salary: 15000, status: "active", startDate: "2021-11-20" },
  { id: "4", name: "Patricia Luna", position: "Administradora", salary: 16000, status: "active", startDate: "2019-08-25" },
  { id: "5", name: "David Ruiz", position: "Almacenista", salary: 9000, status: "active", startDate: "2022-03-14" },
  { id: "6", name: "Isabel Flores", position: "Atención al Cliente", salary: 9500, status: "active", startDate: "2023-01-15" },
  { id: "7", name: "Jorge Ortiz", position: "Logística", salary: 10000, status: "active", startDate: "2023-06-01" },
  { id: "8", name: "Mónica Silva", position: "Contadora", salary: 14000, status: "active", startDate: "2024-02-10" },
];

export const payroll = [
  { id: "1", employeeId: "1", period: "2026-02", amount: 35000, status: "paid", paidDate: "2026-02-28" },
  { id: "2", employeeId: "2", period: "2026-02", amount: 18000, status: "paid", paidDate: "2026-02-28" },
  { id: "3", employeeId: "4", period: "2026-02", amount: 16000, status: "paid", paidDate: "2026-02-28" },
  { id: "4", employeeId: "1", period: "2026-03", amount: 35000, status: "pending", paidDate: null },
  { id: "5", employeeId: "2", period: "2026-03", amount: 18000, status: "pending", paidDate: null },
];

export const products = [
  { 
    id: "1", 
    name: "Motor Trifásico 5HP", 
    sku: "MOT-005", 
    stock: 12, 
    minStock: 5, 
    price: 8500, 
    category: "Motores",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400",
    specs: "Potencia: 5HP, Fases: 3, Voltaje: 220/440V, Rpm: 1750, Armazón: 184T"
  },
  { 
    id: "2", 
    name: "Sensor Inductivo M18", 
    sku: "SEN-018", 
    stock: 45, 
    minStock: 20, 
    price: 450, 
    category: "Sensores",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400",
    specs: "Diámetro: 18mm, Alcance: 8mm, Salida: PNP NO, Conexión: M12 4 pines"
  },
  { 
    id: "3", 
    name: "Rodamiento 6205-2RS", 
    sku: "ROD-6205", 
    stock: 150, 
    minStock: 50, 
    price: 125, 
    category: "Mecánica",
    image: "https://images.unsplash.com/photo-1530124560677-bbfda2f97a21?auto=format&fit=crop&q=80&w=400",
    specs: "Diámetro Int: 25mm, Diámetro Ext: 52mm, Ancho: 15mm, Sello: Goma doble"
  },
  { 
    id: "4", 
    name: "Contactor Eléctrico 24V", 
    sku: "CON-024", 
    stock: 8, 
    minStock: 15, 
    price: 950, 
    category: "Eléctrico",
    image: "https://images.unsplash.com/photo-1558444479-c8f027d8a5ba?auto=format&fit=crop&q=80&w=400",
    specs: "Polos: 3, Amperaje: 32A, Bobina: 24VDC, Contactos Aux: 1NO+1NC"
  },
  { 
    id: "5", 
    name: "Variador de Frecuencia 2HP", 
    sku: "VAR-002", 
    stock: 3, 
    minStock: 5, 
    price: 12400, 
    category: "Electrónica",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400",
    specs: "Potencia: 2HP, Entrada: 220V 1F, Salida: 220V 3F, Control: Escalar/Vectorial"
  },
  { 
    id: "6", 
    name: "Capacitor de Arranque 100uF", 
    sku: "CAP-100", 
    stock: 4, 
    minStock: 10, 
    price: 180, 
    category: "Eléctrico",
    image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=400",
    specs: "Capacitancia: 100uF, Voltaje: 330VAC, Frecuencia: 50/60Hz, Tipo: Seco"
  },
  { 
    id: "7", 
    name: "Multímetro Industrial Fluke", 
    sku: "TOOL-001", 
    stock: 5, 
    minStock: 5, 
    price: 5600, 
    category: "Herramientas",
    image: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&q=80&w=400",
    specs: "Modelo: 87V, Precisión: 0.05%, Rango: V/A/Ohm/Cap/Hz, Categoría: IV 600V"
  },
  { 
    id: "8", 
    name: "Pinza Amperimétrica", 
    sku: "TOOL-002", 
    stock: 2, 
    minStock: 5, 
    price: 1850, 
    category: "Herramientas",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400",
    specs: "Rango A: 400A AC/DC, Voltaje: 600V, Apertura: 30mm, True RMS"
  },
  { 
    id: "9", 
    name: "Grasa de Litio 400g", 
    sku: "LUB-001", 
    stock: 24, 
    minStock: 10, 
    price: 210, 
    category: "Mecánica",
    image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&q=80&w=400",
    specs: "Base: Jabón Litio, Grado NLGI: 2, Temp: -20 a 120°C, Aplicación: Rodamientos"
  },
  { 
    id: "10", 
    name: "Cable Cobre Cal. 12 (100m)", 
    sku: "CAB-012", 
    stock: 12, 
    minStock: 10, 
    price: 2450, 
    category: "Eléctrico",
    image: "https://images.unsplash.com/photo-1558444479-bd3230f25974?auto=format&fit=crop&q=80&w=400",
    specs: "Calibre: 12 AWG, Longitud: 100m, Aislamiento: THW-2, Voltaje: 600V"
  },
];

export const alerts = [
  { id: "1", type: "stock", severity: "high", message: "Contactor Eléctrico por debajo del mínimo (8/15)", date: "2026-03-06", read: false },
  { id: "2", type: "stock", severity: "high", message: "Capacitor de Arranque por debajo del mínimo (4/10)", date: "2026-03-06", read: false },
  { id: "3", type: "stock", severity: "high", message: "Pinza Amperimétrica por debajo del mínimo (2/5)", date: "2026-03-06", read: false },
  { id: "4", type: "stock", severity: "medium", message: "Variador de Frecuencia por debajo del mínimo (3/5)", date: "2026-03-05", read: false },
  { id: "5", type: "payroll", severity: "medium", message: "2 nóminas de marzo pendientes de pago", date: "2026-03-05", read: true },
  { id: "6", type: "finance", severity: "info", message: "Venta de motores superó meta mensual", date: "2026-03-04", read: true },
];

export const revenueVsExpenses = [
  { month: "Oct", ingresos: 280000, gastos: 165000 },
  { month: "Nov", ingresos: 295000, gastos: 170000 },
  { month: "Dic", ingresos: 380000, gastos: 195000 },
  { month: "Ene", ingresos: 310000, gastos: 178000 },
  { month: "Feb", ingresos: 325000, gastos: 180000 },
  { month: "Mar", ingresos: 345600, gastos: 185600 },
];

export const expensesByCategory = [
  { name: "Proveedores", value: 95400, color: "hsl(210, 80%, 52%)" },
  { name: "Renta", value: 25000, color: "hsl(28, 90%, 55%)" },
  { name: "Nómina", value: 54000, color: "hsl(152, 55%, 28%)" },
  { name: "Servicios", value: 6900, color: "hsl(38, 92%, 50%)" },
  { name: "Mantenimiento", value: 4200, color: "hsl(0, 72%, 51%)" },
];

