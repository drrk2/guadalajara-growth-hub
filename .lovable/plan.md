

# 🏢 ERP SaaS White-Label Demo — "NexoPYME"

## Concepto
Cada PYME obtiene su **página web pública** (catálogo, contacto, info del negocio) y al iniciar sesión desde esa misma página, accede automáticamente a su **panel ERP privado** — todo en una sola plataforma.

---

## 🎨 Página Web Pública (White-Label)
- **Landing personalizable**: Hero con logo/colores de la empresa, sección "Sobre nosotros", servicios/productos destacados, ubicación en mapa, contacto con WhatsApp
- **Navbar** con botón "Iniciar Sesión" que abre el panel ERP
- **Footer** con redes sociales y datos fiscales
- Colores y branding configurables por empresa (CSS variables dinámicas)

## 🔐 Autenticación y Roles
- Login/registro con **Supabase Auth** (email + contraseña)
- **Roles**: `owner`, `admin`, `employee` (tabla separada `user_roles`)
- Al iniciar sesión desde la web pública, redirección automática al dashboard ERP
- Tabla `profiles` con datos del usuario y referencia a su empresa (`tenant_id`)

## 📊 Dashboard ERP (Post-Login)
- **Sidebar** con navegación por módulos
- **Vista general**: KPIs en tarjetas (ingresos del mes, gastos, empleados activos, productos en stock bajo)
- **Gráficas** con Recharts (tendencia de gastos vs ingresos últimos 6 meses)

## 💰 Módulo: Gastos y Finanzas
- Tabla de gastos con categoría, monto, fecha, proveedor
- Formulario para registrar gastos con validación
- Filtros por fecha y categoría
- Resumen mensual con gráfica de pastel por categoría

## 👥 Módulo: Nóminas (Simplificado)
- Lista de empleados con salario, puesto, estatus
- Registro de pagos de nómina por periodo
- Indicador de nóminas pendientes vs pagadas

## 📦 Módulo: Inventario
- Tabla de productos con nombre, SKU, stock, precio, categoría
- **Alertas visuales** cuando stock está bajo (umbral configurable)
- Registro de entradas/salidas de inventario
- Búsqueda y filtros

## 🤖 AAA: Analítica, Alertas y Automatización
- **Panel de alertas**: notificaciones en-app para stock bajo, gastos inusuales, nóminas pendientes
- **Analítica**: dashboard con métricas comparativas mes a mes
- **Automatización IA**: placeholder para futuras integraciones (botón "Generar reporte con IA" como preview)

## 🏗️ Arquitectura Técnica
- **Frontend**: React + TypeScript + Tailwind + shadcn/ui
- **Backend**: Supabase (Cloud) — Auth, Database, RLS por tenant
- **Multi-tenant**: Cada empresa es un `tenant` con sus datos aislados via Row Level Security
- **Tablas**: `tenants`, `profiles`, `user_roles`, `expenses`, `employees`, `payroll`, `products`, `inventory_movements`, `alerts`

## 📱 Responsive
- Diseño mobile-first para que dueños de PYMES accedan desde el celular
- Sidebar colapsable en móvil

## 🎯 Datos Demo Precargados
- Una empresa ficticia "Tacos El Patrón" con logo, colores (verde/naranja), empleados, productos, gastos y nóminas de ejemplo para demostrar todas las funcionalidades

