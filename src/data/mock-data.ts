// Demo data for "Tacos El Patrón"

export const tenant = {
  id: "demo-tenant-001",
  name: "Tacos El Patrón",
  slug: "tacos-el-patron",
  logo: "🌮",
  tagline: "Los mejores tacos de Guadalajara desde 1998",
  phone: "+52 33 1234 5678",
  whatsapp: "5213312345678",
  email: "info@tacoselpatron.mx",
  address: "Av. Chapultepec #456, Col. Americana, Guadalajara, Jalisco",
  website: "tacoselpatron.mx",
  social: {
    facebook: "tacoselpatron",
    instagram: "tacoselpatron",
  },
};

export const services = [
  { icon: "🌮", title: "Tacos al Pastor", description: "Nuestro clásico con piña y cilantro fresco" },
  { icon: "🥩", title: "Cortes Premium", description: "Arrachera y ribeye a la parrilla" },
  { icon: "🎉", title: "Eventos & Catering", description: "Taquizas para fiestas y eventos corporativos" },
  { icon: "🚚", title: "Delivery", description: "Entrega a domicilio en toda la zona metropolitana" },
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
  { id: "1", category: "Proveedores", description: "Carne de res - Carnicería Don Juan", amount: 12500, date: "2026-03-01", provider: "Carnicería Don Juan" },
  { id: "2", category: "Servicios", description: "Electricidad febrero", amount: 3200, date: "2026-03-02", provider: "CFE" },
  { id: "3", category: "Proveedores", description: "Tortillas - La Maseca", amount: 4800, date: "2026-03-03", provider: "Tortillería La Maseca" },
  { id: "4", category: "Marketing", description: "Campaña redes sociales", amount: 2500, date: "2026-03-04", provider: "AgenciaMKT" },
  { id: "5", category: "Mantenimiento", description: "Reparación de estufa industrial", amount: 6800, date: "2026-03-05", provider: "Equipos Industriales GDL" },
  { id: "6", category: "Proveedores", description: "Verduras y chiles", amount: 3600, date: "2026-03-05", provider: "Central de Abastos" },
  { id: "7", category: "Renta", description: "Renta local marzo", amount: 18000, date: "2026-03-01", provider: "Inmobiliaria Jalisco" },
  { id: "8", category: "Servicios", description: "Internet y teléfono", amount: 1200, date: "2026-03-03", provider: "Telmex" },
];

export const expenseCategories = ["Proveedores", "Servicios", "Marketing", "Mantenimiento", "Renta", "Nómina", "Otros"];

export const employees = [
  { id: "1", name: "Carlos Hernández", position: "Chef Principal", salary: 18000, status: "active", startDate: "2020-03-15" },
  { id: "2", name: "María López", position: "Sub-Chef", salary: 14000, status: "active", startDate: "2021-06-01" },
  { id: "3", name: "Juan Martínez", position: "Taquero", salary: 10000, status: "active", startDate: "2022-01-10" },
  { id: "4", name: "Ana García", position: "Cajera", salary: 9000, status: "active", startDate: "2022-08-20" },
  { id: "5", name: "Pedro Ruiz", position: "Mesero", salary: 8500, status: "active", startDate: "2023-02-14" },
  { id: "6", name: "Laura Sánchez", position: "Mesera", salary: 8500, status: "active", startDate: "2023-05-01" },
  { id: "7", name: "Roberto Díaz", position: "Limpieza", salary: 7500, status: "active", startDate: "2023-09-15" },
  { id: "8", name: "Sofia Torres", position: "Administradora", salary: 16000, status: "active", startDate: "2021-01-05" },
  { id: "9", name: "Miguel Flores", position: "Repartidor", salary: 8000, status: "active", startDate: "2024-01-10" },
  { id: "10", name: "Diana Morales", position: "Taquera", salary: 10000, status: "active", startDate: "2024-03-01" },
  { id: "11", name: "Fernando Reyes", position: "Ayudante de cocina", salary: 7500, status: "inactive", startDate: "2022-06-15" },
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
  { id: "1", name: "Tortilla de maíz (kg)", sku: "TORT-001", stock: 45, minStock: 20, price: 22, category: "Insumos" },
  { id: "2", name: "Carne al pastor (kg)", sku: "CARN-001", stock: 8, minStock: 15, price: 180, category: "Carnes" },
  { id: "3", name: "Carne de res (kg)", sku: "CARN-002", stock: 5, minStock: 10, price: 220, category: "Carnes" },
  { id: "4", name: "Piña fresca (pza)", sku: "FRUT-001", stock: 12, minStock: 5, price: 35, category: "Frutas" },
  { id: "5", name: "Cilantro (manojo)", sku: "VERD-001", stock: 3, minStock: 10, price: 8, category: "Verduras" },
  { id: "6", name: "Cebolla (kg)", sku: "VERD-002", stock: 7, minStock: 8, price: 18, category: "Verduras" },
  { id: "7", name: "Limón (kg)", sku: "FRUT-002", stock: 15, minStock: 10, price: 25, category: "Frutas" },
  { id: "8", name: "Salsa verde (litro)", sku: "SALS-001", stock: 4, minStock: 5, price: 45, category: "Salsas" },
  { id: "9", name: "Refresco cola (caja)", sku: "BEB-001", stock: 20, minStock: 10, price: 185, category: "Bebidas" },
  { id: "10", name: "Agua mineral (caja)", sku: "BEB-002", stock: 2, minStock: 8, price: 120, category: "Bebidas" },
];

export const alerts = [
  { id: "1", type: "stock", severity: "high", message: "Agua mineral por debajo del mínimo (2/8)", date: "2026-03-06", read: false },
  { id: "2", type: "stock", severity: "high", message: "Cilantro por debajo del mínimo (3/10)", date: "2026-03-06", read: false },
  { id: "3", type: "stock", severity: "high", message: "Carne al pastor por debajo del mínimo (8/15)", date: "2026-03-06", read: false },
  { id: "4", type: "stock", severity: "medium", message: "Carne de res por debajo del mínimo (5/10)", date: "2026-03-05", read: false },
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
