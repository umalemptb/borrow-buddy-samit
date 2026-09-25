import { describe, expect, it } from 'vitest'
import {
  NETWORK_ERROR,
  SIGN_IN_FAILED,
  SIGN_IN_INVALID,
  SIGN_IN_RATE_LIMITED,
  SIGN_IN_UNCONFIRMED,
  isNetworkError,
  toThaiAuthError,
} from './authErrors.js'

describe('toThaiAuthError', () => {
  it('อีเมลหรือรหัสผ่านผิด ใช้ข้อความรวม ๆ', () => {
    expect(toThaiAuthError({ code: 'invalid_credentials', status: 400 })).toBe(SIGN_IN_INVALID)
    expect(toThaiAuthError({ status: 400, message: 'Invalid login credentials' })).toBe(
      SIGN_IN_INVALID,
    )
  })

  it('อีเมลยังไม่ยืนยัน', () => {
    expect(toThaiAuthError({ code: 'email_not_confirmed', status: 400 })).toBe(SIGN_IN_UNCONFIRMED)
  })

  it('ถูกจำกัดความถี่', () => {
    expect(toThaiAuthError({ code: 'over_request_rate_limit', status: 429 })).toBe(
      SIGN_IN_RATE_LIMITED,
    )
    expect(toThaiAuthError({ status: 429 })).toBe(SIGN_IN_RATE_LIMITED)
  })

  it('เครือข่ายล่ม', () => {
    expect(toThaiAuthError({ name: 'AuthRetryableFetchError', status: 0 })).toBe(NETWORK_ERROR)
  })

  it('กรณีอื่นใช้ข้อความทั่วไป', () => {
    expect(toThaiAuthError({ status: 500, message: 'boom' })).toBe(SIGN_IN_FAILED)
    expect(toThaiAuthError(undefined)).toBe(SIGN_IN_FAILED)
  })
})

describe('isNetworkError', () => {
  it('รู้จักข้อผิดพลาดเครือข่ายจาก Auth และ fetch', () => {
    expect(isNetworkError({ name: 'AuthRetryableFetchError' })).toBe(true)
    expect(isNetworkError({ message: 'TypeError: Failed to fetch' })).toBe(true)
    expect(isNetworkError({ message: 'NetworkError when attempting to fetch resource.' })).toBe(
      true,
    )
  })

  it('ข้อผิดพลาดอื่นไม่ใช่เครือข่าย', () => {
    expect(isNetworkError({ code: '23514', message: 'violates check constraint' })).toBe(false)
    expect(isNetworkError(null)).toBe(false)
  })
})
