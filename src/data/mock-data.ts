// Demo data for "GTP SaaS - Business Hub"

export const tenant = {
  id: "demo-tenant-001",
  name: "GTP SaaS",
  slug: "gtp-saas",
  logo: "⚡",
  tagline: "Gestión Inteligente para tu Empresa en Guadalajara",
  phone: "+52 33 1234 5678",
  whatsapp: "5213312345678",
  email: "contacto@gtpsaas.mx",
  address: "Av. Chapultepec #456, Col. Americana, Guadalajara, Jalisco",
  website: "gtpsaas.mx",
  social: {
    facebook: "gtpsaas",
    instagram: "gtpsaas",
  },
};

export const services = [
  { icon: "💼", title: "Gestión Operativa", description: "Control total de inventarios y ventas en tiempo real" },
  { icon: "📈", title: "Analítica Avanzada", description: "Reportes inteligentes para toma de decisiones" },
  { icon: "🛡️", title: "Seguridad Pro", description: "Accesos protegidos y control de nóminas" },
  { icon: "🤖", title: "Asistente AI", description: "Soporte inteligente basado en Groq 24/7" },
];

export const kpis = {
  ingresosMes: 285400,
  gastosMes: 142800,
  empleadosActivos: 12,
  productosStockBajo: 4,
  nominasPendientes: 3,
  alertasActivas: 7,
};

export const expenses = [
  { id: "1", category: "Proveedores", description: "Insumos generales", amount: 12500, date: "2026-03-01", provider: "Proveedor Local GDL" },
  { id: "2", category: "Servicios", description: "Electricidad febrero", amount: 3200, date: "2026-03-02", provider: "CFE" },
  { id: "3", category: "Proveedores", description: "Materia prima - Distribuidora", amount: 4800, date: "2026-03-03", provider: "Distribuidora Occidente" },
  { id: "4", category: "Marketing", description: "Campaña redes sociales", amount: 2500, date: "2026-03-04", provider: "AgenciaMKT" },
  { id: "5", category: "Mantenimiento", description: "Reparación de equipos", amount: 6800, date: "2026-03-05", provider: "Servicios Industriales" },
  { id: "6", category: "Proveedores", description: "Artículos de oficina", amount: 3600, date: "2026-03-05", provider: "Papelería Central" },
  { id: "7", category: "Renta", description: "Renta oficina marzo", amount: 18000, date: "2026-03-01", provider: "Inmobiliaria Jalisco" },
  { id: "8", category: "Servicios", description: "Internet y teléfono", amount: 1200, date: "2026-03-03", provider: "Telmex" },
];

export const expenseCategories = ["Proveedores", "Servicios", "Marketing", "Mantenimiento", "Renta", "Nómina", "Otros"];

export const employees = [
  { id: "1", name: "Carlos Hernández", position: "Gerente Operativo", salary: 18000, status: "active", startDate: "2020-03-15" },
  { id: "2", name: "María López", position: "Supervisora", salary: 14000, status: "active", startDate: "2021-06-01" },
  { id: "3", name: "Juan Martínez", position: "Técnico Especialista", salary: 10000, status: "active", startDate: "2022-01-10" },
  { id: "4", name: "Ana García", position: "Cajera Principal", salary: 9000, status: "active", startDate: "2022-08-20" },
  { id: "5", name: "Pedro Ruiz", position: "Atención al Cliente", salary: 8500, status: "active", startDate: "2023-02-14" },
  { id: "6", name: "Laura Sánchez", position: "Atención al Cliente", salary: 8500, status: "active", startDate: "2023-05-01" },
  { id: "7", name: "Roberto Díaz", position: "Mantenimiento", salary: 7500, status: "active", startDate: "2023-09-15" },
  { id: "8", name: "Sofia Torres", position: "Administradora", salary: 16000, status: "active", startDate: "2021-01-05" },
  { id: "9", name: "Miguel Flores", position: "Logística", salary: 8000, status: "active", startDate: "2024-01-10" },
  { id: "10", name: "Diana Morales", position: "Técnico", salary: 10000, status: "active", startDate: "2024-03-01" },
  { id: "11", name: "Fernando Reyes", position: "Auxiliar", salary: 7500, status: "inactive", startDate: "2022-06-15" },
  { id: "12", name: "Gabriela Mendoza", position: "Community Manager", salary: 12000, status: "active", startDate: "2025-01-15" },
];

export const payroll = [
  { id: "1", employeeId: "1", period: "2026-02", amount: 18000, status: "paid", paidDate: "2026-02-28" },
  { id: "2", employeeId: "2", period: "2026-02", amount: 14000, status: "paid", paidDate: "2026-02-28" },
  { id: "3", employeeId: "3", period: "2026-02", amount: 10000, status: "paid", paidDate: "2026-02-28" },
  { id: "4", employeeId: "1", period: "2026-03", amount: 18000, status: "pending", paidDate: null },
  { id: "5", employeeId: "2", period: "2026-03", amount: 14000, status: "pending", paidDate: null },
  { id: "6", employeeId: "3", period: "2026-03", amount: 10000, status: "pending", paidDate: null },
];

export const products = [
  { id: "1", name: "Insumo Industrial A", sku: "INS-001", stock: 45, minStock: 20, price: 22, category: "Materia Prima" },
  { id: "2", name: "Producto Terminado X", sku: "PROD-001", stock: 8, minStock: 15, price: 180, category: "Inventario" },
  { id: "3", name: "Material de empaque", sku: "PACK-001", stock: 5, minStock: 10, price: 220, category: "General" },
  { id: "4", name: "Kit de bienvenida", sku: "KIT-001", stock: 12, minStock: 5, price: 35, category: "Marketing" },
  { id: "5", name: "Herramienta básica", sku: "TOOL-001", stock: 3, minStock: 10, price: 8, category: "Equipo" },
  { id: "6", name: "Caja de archivo", sku: "OFF-001", stock: 7, minStock: 8, price: 18, category: "Oficina" },
  { id: "7", name: "Papel bond (resma)", sku: "OFF-002", stock: 15, minStock: 10, price: 25, category: "Oficina" },
  { id: "8", name: "Toner genérico", sku: "OFF-003", stock: 4, minStock: 5, price: 45, category: "Oficina" },
  { id: "9", name: "Licencia Software X", sku: "SFT-001", stock: 20, minStock: 10, price: 185, category: "Suscripciones" },
  { id: "10", name: "Agua purificada (botellón)", sku: "BEB-002", stock: 2, minStock: 8, price: 120, category: "Servicios" },
];

export const alerts = [
  { id: "1", type: "stock", severity: "high", message: "Insumo A por debajo del mínimo (2/20)", date: "2026-03-06", read: false },
  { id: "2", type: "stock", severity: "high", message: "Herramientas por debajo del mínimo (3/10)", date: "2026-03-06", read: false },
  { id: "3", type: "stock", severity: "high", message: "Producto X por debajo del mínimo (8/15)", date: "2026-03-06", read: false },
  { id: "4", type: "stock", severity: "medium", message: "Material de empaque por debajo del mínimo (5/10)", date: "2026-03-05", read: false },
  { id: "5", type: "payroll", severity: "medium", message: "3 nóminas de marzo pendientes de pago", date: "2026-03-05", read: true },
  { id: "6", type: "expense", severity: "low", message: "Gasto en mantenimiento 35% mayor al promedio", date: "2026-03-05", read: true },
  { id: "7", type: "finance", severity: "info", message: "Ingresos del mes 12% superiores al mes anterior", date: "2026-03-04", read: true },
];

export const revenueVsExpenses = [
  { month: "Oct", ingresos: 210000, gastos: 125000 },
  { month: "Nov", ingresos: 235000, gastos: 130000 },
  { month: "Dic", ingresos: 310000, gastos: 155000 },
  { month: "Ene", ingresos: 245000, gastos: 138000 },
  { month: "Feb", ingresos: 255000, gastos: 140000 },
  { month: "Mar", ingresos: 285400, gastos: 142800 },
];

export const expensesByCategory = [
  { name: "Proveedores", value: 52600, color: "hsl(152, 55%, 28%)" },
  { name: "Renta", value: 18000, color: "hsl(28, 90%, 55%)" },
  { name: "Servicios", value: 4400, color: "hsl(38, 92%, 50%)" },
  { name: "Mantenimiento", value: 6800, color: "hsl(210, 80%, 52%)" },
  { name: "Marketing", value: 2500, color: "hsl(0, 72%, 51%)" },
];
