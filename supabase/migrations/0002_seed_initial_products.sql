-- =============================================================================
-- 0002_seed_initial_products.sql
-- EISEN Industrial — Catálogo inicial de refacciones
--
-- Aplicar DESPUÉS de 0001_baseline_schema.sql y 0004_remove_product_cost.sql.
-- Idempotente: usa ON CONFLICT (sku) DO NOTHING.
-- Nota: `cost` fue eliminado en 0004 — no se registra aquí.
-- Revisa precios y stock antes de aplicar — son valores de referencia.
-- =============================================================================

insert into public.products
  (name, sku, description, category, brand, unit, price, stock, min_stock, active)
values

-- ── Motores Eléctricos ────────────────────────────────────────────────────────
(
  'Motor Eléctrico WEG 1 HP 1800 RPM Trifásico',
  'MOT-WEG-1HP-3F',
  'Motor de inducción trifásico 1 HP, 1800 RPM, carcasa IE3. Eficiencia premium, IP55. Voltaje 220/440V.',
  'Motores Eléctricos', 'WEG', 'pieza',
  4850.00, 8, 2, true
),
(
  'Motor Eléctrico WEG 2 HP 1800 RPM Trifásico',
  'MOT-WEG-2HP-3F',
  'Motor de inducción trifásico 2 HP, 1800 RPM, IE3. IP55. Voltaje 220/440V.',
  'Motores Eléctricos', 'WEG', 'pieza',
  6200.00, 5, 2, true
),
(
  'Motor Eléctrico WEG 5 HP 1800 RPM Trifásico',
  'MOT-WEG-5HP-3F',
  'Motor de inducción trifásico 5 HP, 1800 RPM, IE3. Alta eficiencia para aplicaciones industriales continuas.',
  'Motores Eléctricos', 'WEG', 'pieza',
  9800.00, 4, 1, true
),
(
  'Motor Eléctrico WEG 1/2 HP Monofásico',
  'MOT-WEG-05HP-1F',
  'Motor monofásico 1/2 HP, 1800 RPM, condensador de arranque y marcha. 127V/220V.',
  'Motores Eléctricos', 'WEG', 'pieza',
  2450.00, 10, 3, true
),

-- ── Variadores de Frecuencia ─────────────────────────────────────────────────
(
  'Variador de Frecuencia WEG CFW300 1 HP 220V',
  'VAR-WEG-CFW300-1HP',
  'Variador de velocidad compacto 1 HP / 220V monofásico. Control vectorial, protección IP20. Ideal para bombas y ventiladores.',
  'Variadores de Frecuencia', 'WEG', 'pieza',
  5600.00, 6, 2, true
),
(
  'Variador de Frecuencia WEG CFW500 5 HP 220V Trifásico',
  'VAR-WEG-CFW500-5HP',
  'Variador de velocidad 5 HP / 220V trifásico. Protección IP20, Bluetooth integrado, compatible con Modbus RTU.',
  'Variadores de Frecuencia', 'WEG', 'pieza',
  12400.00, 3, 1, true
),

-- ── Arrancadores y Control ────────────────────────────────────────────────────
(
  'Arrancador Suave WEG SSW07 9A 220-575V',
  'ARR-WEG-SSW07-9A',
  'Soft-starter 9A, 220-575V. Protección integrada contra sobrecarga, corto circuito y falla a tierra. IP20.',
  'Arrancadores', 'WEG', 'pieza',
  7800.00, 4, 1, true
),
(
  'Contactor Schneider LC1D09 9A 220V',
  'CON-SCH-LC1D09',
  'Contactor tripolar 9A, bobina 220V AC. Para control de motores hasta 4 kW / 400V. Categoría AC-3.',
  'Control Industrial', 'Schneider Electric', 'pieza',
  680.00, 25, 5, true
),
(
  'Contactor Schneider LC1D25 25A 220V',
  'CON-SCH-LC1D25',
  'Contactor tripolar 25A, bobina 220V AC. Para motores hasta 11 kW / 400V. Categoría AC-3.',
  'Control Industrial', 'Schneider Electric', 'pieza',
  1250.00, 15, 4, true
),
(
  'Relay Térmico Schneider LRD10 4-6A',
  'REL-SCH-LRD10',
  'Relay de sobrecarga térmica 4-6A. Compatible con contactores LC1D series. Clase de disparo 10A.',
  'Control Industrial', 'Schneider Electric', 'pieza',
  520.00, 20, 5, true
),

-- ── Rodamientos ───────────────────────────────────────────────────────────────
(
  'Rodamiento SKF 6205-2RS1 25mm',
  'ROD-SKF-6205-2RS1',
  'Rodamiento rígido de bolas, diámetro interior 25mm, exterior 52mm, ancho 15mm. Sellado con goma. Alta velocidad.',
  'Rodamientos', 'SKF', 'pieza',
  185.00, 50, 10, true
),
(
  'Rodamiento SKF 6305-2RS1 25mm',
  'ROD-SKF-6305-2RS1',
  'Rodamiento rígido de bolas de alta capacidad de carga, 25mm. Sellado, bajo mantenimiento.',
  'Rodamientos', 'SKF', 'pieza',
  245.00, 40, 8, true
),
(
  'Rodamiento SKF 6206-2RS1 30mm',
  'ROD-SKF-6206-2RS1',
  'Rodamiento rígido de bolas, interior 30mm, exterior 62mm. Sellado con goma, lubricado de por vida.',
  'Rodamientos', 'SKF', 'pieza',
  210.00, 45, 10, true
),
(
  'Rodamiento NTN 6204-2RS 20mm',
  'ROD-NTN-6204-2RS',
  'Rodamiento de bolas NTN, 20mm interior, 47mm exterior. Doble sello. Aplicaciones generales.',
  'Rodamientos', 'NTN', 'pieza',
  145.00, 60, 15, true
),

-- ── Retenes y Sellos ──────────────────────────────────────────────────────────
(
  'Reten de Aceite 25x47x7mm Doble Labio',
  'RET-25-47-7-DL',
  'Reten de aceite buna-N (NBR), doble labio, para temperatura -40°C a +100°C. Resistente a aceites minerales.',
  'Retenes y Sellos', 'Nacional', 'pieza',
  48.00, 100, 20, true
),
(
  'Reten de Aceite 30x55x10mm Doble Labio',
  'RET-30-55-10-DL',
  'Reten de aceite NBR doble labio. Ampliamente usado en reductores, bombas y cajas de transmisión.',
  'Retenes y Sellos', 'Nacional', 'pieza',
  62.00, 80, 15, true
),

-- ── Sensores ──────────────────────────────────────────────────────────────────
(
  'Sensor de Proximidad Inductivo M18 NPN 8mm',
  'SEN-IND-M18-NPN-8',
  'Sensor inductivo M18, distancia de detección 8mm, salida NPN NO/NC. IP67. Voltaje 10-30VDC.',
  'Sensores', 'Autonics', 'pieza',
  480.00, 20, 4, true
),
(
  'Sensor Fotoeléctrico Difuso 2m Autonics',
  'SEN-FOT-DIF-2M',
  'Sensor fotoeléctrico de reflexión difusa, alcance 2m, salida NPN. IP67. Indicador LED de detección.',
  'Sensores', 'Autonics', 'pieza',
  650.00, 12, 3, true
),

-- ── Protección Eléctrica ──────────────────────────────────────────────────────
(
  'Interruptor Termomagnético Schneider 3P 32A',
  'ITP-SCH-3P-32A',
  'Breaker tripolar 32A, capacidad de ruptura 10kA. Para protección de motores y tableros de distribución.',
  'Protección Eléctrica', 'Schneider Electric', 'pieza',
  890.00, 15, 3, true
),
(
  'Fusible NH Tipo gG 63A 500V',
  'FUS-NH-63A-500V',
  'Fusible NH tipo gG para protección de cables y distribución. 63A / 500V. Cuchilla tamaño 00.',
  'Protección Eléctrica', 'ETI', 'pieza',
  125.00, 40, 10, true
),

-- ── Cable y Conductores ───────────────────────────────────────────────────────
(
  'Cable THHW 12 AWG Negro 100m',
  'CAB-THHW-12-NEG-100',
  'Cable THHW calibre 12 AWG, negro, 100 metros. Conductor de cobre suave, resistente a 90°C. Para instalaciones industriales.',
  'Cables y Conductores', 'Condumex', 'rollo',
  1850.00, 8, 2, true
),
(
  'Cable de Control 4x18 AWG Apantallado 100m',
  'CAB-CTL-4X18-AP-100',
  'Cable de control apantallado 4 conductores 18AWG. Pantalla global de papel aluminio con drenaje. Para señales analógicas y digitales.',
  'Cables y Conductores', 'Condumex', 'rollo',
  2400.00, 5, 1, true
)

on conflict (sku) do nothing;

-- Verificar cuántos productos se insertaron:
-- select count(*) from public.products;
-- =============================================================================
