import { NETWORK_ERROR, SESSION_EXPIRED, isNetworkError } from './authErrors.js'
import { fromRow, toRow } from './loanMapper.js'

// อ่าน/เขียน Loan ใน Supabase ทีละรายการ (ไม่มีการลบ ตาม design.md)
// client รับเป็นพารามิเตอร์ เพื่อให้ทดสอบด้วย client จำลองได้
// ไม่ใส่เงื่อนไข owner ในคิวรี เพราะ RLS กรองให้แล้ว

const TABLE = 'loans'

export const LOAD_ERROR = 'โหลดรายการไม่สำเร็จ กรุณาลองใหม่'
export const SAVE_ERROR = 'บันทึกไม่สำเร็จ กรุณาลองใหม่'
export const RULE_ERROR = 'ข้อมูลไม่ผ่านกติกา กรุณาตรวจชื่อและวันที่อีกครั้ง'
export const NOT_FOUND_ERROR = 'ไม่พบรายการนี้ หรือไม่มีสิทธิ์แก้ไข'
export const SESSION_ERROR = SESSION_EXPIRED

function toThaiError(error, fallback) {
  if (isNetworkError(error)) return NETWORK_ERROR
  if (error.code === 'PGRST301' || error.code === 'PGRST303' || /jwt expired/i.test(error.message ?? '')) {
    return SESSION_ERROR
  }
  if (error.code === '23514' || error.code === '23502') return RULE_ERROR
  if (error.code === 'PGRST116') return NOT_FOUND_ERROR
  return fallback
}

export async function listLoans(client) {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .order('due_date', { ascending: true })
  if (error) return { loans: null, error: toThaiError(error, LOAD_ERROR) }
  return { loans: data.map(fromRow), error: null }
}

export async function createLoan(client, loan) {
  const { data, error } = await client.from(TABLE).insert(toRow(loan)).select().single()
  if (error) return { loan: null, error: toThaiError(error, SAVE_ERROR) }
  return { loan: fromRow(data), error: null }
}

export async function updateLoan(client, loan) {
  const { data, error } = await client
    .from(TABLE)
    .update(toRow(loan))
    .eq('id', loan.id)
    .select()
    .single()
  if (error) return { loan: null, error: toThaiError(error, SAVE_ERROR) }
  return { loan: fromRow(data), error: null }
}

// เพิ่มหลายรายการในคำขอเดียว (ใช้ตอนนำเข้าข้อมูลเดิม) สำเร็จหรือล้มเหลวทั้งชุด
export async function createLoans(client, loans) {
  if (loans.length === 0) return { count: 0, error: null }
  const { data, error } = await client.from(TABLE).insert(loans.map(toRow)).select()
  if (error) return { count: 0, error: toThaiError(error, SAVE_ERROR) }
  return { count: data.length, error: null }
}
