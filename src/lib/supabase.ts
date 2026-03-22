import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRÍTICO: Faltan las credenciales de Supabase en el archivo .env')
} else {
  // Validación de formato de llave (Debe ser un JWT largo, no un "sb_publishable_")
  if (supabaseAnonKey.startsWith('sb_publishable_')) {
    console.error('MODO DIAGNÓSTICO: La llave VITE_SUPABASE_ANON_KEY parece ser de STRIPE o CLERK, no de SUPABASE. Revisa tu panel de Supabase > Project Settings > API > anon public.')
  } else if (!supabaseAnonKey.includes('.')) {
    console.error('MODO DIAGNÓSTICO: El formato de la llave anon de Supabase es inválido (Debe ser un JWT con puntos).')
  } else {
    console.log('MODO DIAGNÓSTICO: Configuración de Supabase detectada correctamente.')
  }
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
