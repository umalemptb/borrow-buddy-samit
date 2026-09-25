import { createClient } from '@supabase/supabase-js'

// สร้าง client ที่เดียวจาก env ของ Vite (ดู .env.example)
// ใช้เฉพาะ publishable key ห้ามใช้ service_role / secret key ในเบราว์เซอร์

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const CONFIG_ERROR =
  url && key
    ? null
    : 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase กรุณาสร้างไฟล์ .env.local ตาม .env.example แล้วเริ่มเซิร์ฟเวอร์ใหม่'

export const supabase = CONFIG_ERROR ? null : createClient(url, key)
