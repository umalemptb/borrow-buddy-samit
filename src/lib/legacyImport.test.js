import { describe, expect, it } from 'vitest'
import { IMPORT_FLAG_KEY, getLegacyImport, markLegacyImportDone } from './legacyImport.js'
import { STORAGE_KEY } from './storage.js'

const memoryStorage = (initial = {}) => {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
  }
}

const loan = {
  id: 'old-1',
  friendName: 'ต้น',
  itemName: 'ร่มสีฟ้า',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
}

const withLoans = (loans, extra = {}) =>
  memoryStorage({ [STORAGE_KEY]: JSON.stringify(loans), ...extra })

describe('getLegacyImport', () => {
  it('ไม่มีข้อมูลเดิม = ไม่ต้องถาม', () => {
    expect(getLegacyImport(memoryStorage()).pending).toBe(false)
  })

  it('รายการเดิมว่าง = ไม่ต้องถาม', () => {
    expect(getLegacyImport(withLoans([])).pending).toBe(false)
  })

  it('JSON เสีย = ไม่ต้องถาม และไม่เขียนอะไร', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{broken' })
    expect(getLegacyImport(storage).pending).toBe(false)
    expect(storage.data[STORAGE_KEY]).toBe('{broken')
  })

  it('มีข้อมูลเดิม = ถาม และคืนรายการที่ถูกต้อง', () => {
    const result = getLegacyImport(withLoans([loan]))
    expect(result).toEqual({ pending: true, loans: [loan], skipped: 0 })
  })

  it('ข้ามรายการผิดกติกาหรือรูปแบบเสีย', () => {
    const bad = [
      { ...loan, friendName: '' },
      { ...loan, dueDate: '2026-08-01' },
      { ...loan, returnedDate: '2026-08-01' },
      { ...loan, borrowedDate: '1/9/2026' },
      { ...loan, friendName: 42 },
      null,
      'ร่ม',
    ]
    const result = getLegacyImport(withLoans([loan, ...bad]))
    expect(result.loans).toEqual([loan])
    expect(result.skipped).toBe(bad.length)
  })

  it('ทุกรายการผิดก็ยังถาม เพื่อแจ้งว่าข้ามไป', () => {
    const result = getLegacyImport(withLoans([{ ...loan, itemName: ' ' }]))
    expect(result).toEqual({ pending: true, loans: [], skipped: 1 })
  })

  it('เคยนำเข้าหรือปฏิเสธแล้ว = ไม่ถามซ้ำ', () => {
    const storage = withLoans([loan], { [IMPORT_FLAG_KEY]: 'done' })
    expect(getLegacyImport(storage).pending).toBe(false)
  })

  it('storage อ่านไม่ได้ = ไม่ต้องถาม', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
    }
    expect(getLegacyImport(broken).pending).toBe(false)
  })
})

describe('markLegacyImportDone', () => {
  it('บันทึกธง โดยไม่ลบข้อมูลเดิม', () => {
    const storage = withLoans([loan])
    markLegacyImportDone(storage)
    expect(storage.data[IMPORT_FLAG_KEY]).toBe('done')
    expect(JSON.parse(storage.data[STORAGE_KEY])).toEqual([loan])
    expect(getLegacyImport(storage).pending).toBe(false)
  })

  it('บันทึกไม่ได้ก็ไม่ทำให้แอปล้ม', () => {
    const broken = {
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(() => markLegacyImportDone(broken)).not.toThrow()
  })
})
