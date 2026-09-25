export const NETWORK_ERROR = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'
export const SIGN_IN_INVALID = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
export const SIGN_IN_UNCONFIRMED = 'บัญชีนี้ยังไม่ได้ยืนยันอีเมล กรุณาติดต่อผู้ดูแลระบบ'
export const SIGN_IN_RATE_LIMITED = 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'
export const SIGN_IN_FAILED = 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่'
export const SESSION_EXPIRED = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'

// ข้อผิดพลาดเครือข่ายจาก Supabase Auth หรือจาก fetch ที่ PostgREST ห่อมา
export function isNetworkError(error) {
  if (!error) return false
  if (error.name === 'AuthRetryableFetchError') return true
  return /failed to fetch|networkerror|network request failed|load failed/i.test(
    error.message ?? '',
  )
}

// เข้าสู่ระบบผิดใช้ข้อความรวม ๆ ไม่บอกว่าผิดช่องไหน
export function toThaiAuthError(error) {
  if (!error) return SIGN_IN_FAILED
  if (isNetworkError(error)) return NETWORK_ERROR
  if (error.code === 'invalid_credentials' || /invalid login credentials/i.test(error.message ?? '')) {
    return SIGN_IN_INVALID
  }
  if (error.code === 'email_not_confirmed') return SIGN_IN_UNCONFIRMED
  if (error.status === 429 || error.code === 'over_request_rate_limit') return SIGN_IN_RATE_LIMITED
  return SIGN_IN_FAILED
}
