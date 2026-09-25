import { describe, expect, it } from 'vitest'
import { NETWORK_ERROR } from './authErrors.js'
import * as repo from './loanRepo.js'

const {
  LOAD_ERROR,
  NOT_FOUND_ERROR,
  RULE_ERROR,
  SAVE_ERROR,
  SESSION_ERROR,
  createLoan,
  createLoans,
  listLoans,
  updateLoan,
} = repo

const row = {
  id: 'id-1',
  owner_id: 'owner-1',
  friend_name: 'ต้น',
  item_name: 'ร่มสีฟ้า',
  borrowed_date: '2026-09-01',
  due_date: '2026-09-24',
  returned_date: null,
  created_at: '2026-09-01T10:00:00+00:00',
}

const loan = {
  id: 'id-1',
  friendName: 'ต้น',
  itemName: 'ร่มสีฟ้า',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
}

// client จำลอง: บันทึกทุกการเรียกไว้ใน calls และคืน result ที่กำหนดเมื่อ await
function fakeClient(result) {
  const calls = []
  const builder = {
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single']) {
    builder[method] = (...args) => {
      calls.push([method, ...args])
      return builder
    }
  }
  return {
    calls,
    from: (table) => {
      calls.push(['from', table])
      return builder
    },
  }
}

describe('listLoans', () => {
  it('อ่านตาราง loans เรียงตามกำหนดคืน และแปลงเป็น Loan', async () => {
    const client = fakeClient({ data: [row], error: null })
    expect(await listLoans(client)).toEqual({ loans: [loan], error: null })
    expect(client.calls[0]).toEqual(['from', 'loans'])
    expect(client.calls.map((c) => c[0])).toContain('order')
  })

  it('ไม่ใส่เงื่อนไข owner เอง (RLS กรองให้)', async () => {
    const client = fakeClient({ data: [], error: null })
    await listLoans(client)
    expect(client.calls.some((c) => c[0] === 'eq')).toBe(false)
  })

  it('ผิดพลาดคืนข้อความไทย ไม่คืนรายการว่างเหมือนไม่มีข้อมูล', async () => {
    const client = fakeClient({ data: null, error: { message: 'boom' } })
    expect(await listLoans(client)).toEqual({ loans: null, error: LOAD_ERROR })
  })

  it('เครือข่ายล่ม', async () => {
    const client = fakeClient({ data: null, error: { message: 'TypeError: Failed to fetch' } })
    expect((await listLoans(client)).error).toBe(NETWORK_ERROR)
  })
})

describe('createLoan', () => {
  it('insert หนึ่งแถวโดยไม่ส่ง id/owner_id แล้วคืน Loan จากฐานข้อมูล', async () => {
    const client = fakeClient({ data: row, error: null })
    const { id: _, ...draft } = loan
    expect(await createLoan(client, draft)).toEqual({ loan, error: null })

    const insert = client.calls.find((c) => c[0] === 'insert')
    expect(insert[1]).not.toHaveProperty('id')
    expect(insert[1]).not.toHaveProperty('owner_id')
    expect(insert[1].friend_name).toBe('ต้น')
    expect(client.calls.map((c) => c[0])).toEqual(['from', 'insert', 'select', 'single'])
  })

  it('ผิดกติกา check ในฐานข้อมูล', async () => {
    const client = fakeClient({ data: null, error: { code: '23514', message: 'check' } })
    expect(await createLoan(client, loan)).toEqual({ loan: null, error: RULE_ERROR })
  })

  it('ผิดพลาดทั่วไป', async () => {
    const client = fakeClient({ data: null, error: { code: '42501', message: 'rls' } })
    expect((await createLoan(client, loan)).error).toBe(SAVE_ERROR)
  })
})

describe('updateLoan', () => {
  it('update แถวตาม id โดยไม่ส่ง id/owner_id ในข้อมูล', async () => {
    const returnedRow = { ...row, returned_date: '2026-09-20' }
    const client = fakeClient({ data: returnedRow, error: null })
    const result = await updateLoan(client, { ...loan, returnedDate: '2026-09-20' })

    expect(result).toEqual({ loan: { ...loan, returnedDate: '2026-09-20' }, error: null })
    const update = client.calls.find((c) => c[0] === 'update')
    expect(update[1]).not.toHaveProperty('id')
    expect(update[1].returned_date).toBe('2026-09-20')
    expect(client.calls.find((c) => c[0] === 'eq')).toEqual(['eq', 'id', 'id-1'])
  })

  it('ไม่พบแถว (ไม่มีหรือ RLS ไม่ให้แก้)', async () => {
    const client = fakeClient({ data: null, error: { code: 'PGRST116', message: '0 rows' } })
    expect((await updateLoan(client, loan)).error).toBe(NOT_FOUND_ERROR)
  })

  it('เซสชันหมดอายุ', async () => {
    const client = fakeClient({ data: null, error: { code: 'PGRST301', message: 'JWT expired' } })
    expect((await updateLoan(client, loan)).error).toBe(SESSION_ERROR)
  })
})

describe('createLoans', () => {
  it('insert หลายแถวในครั้งเดียว คืนจำนวนที่สร้าง', async () => {
    const client = fakeClient({ data: [row, { ...row, id: 'id-2' }], error: null })
    const result = await createLoans(client, [loan, { ...loan, id: 'old-2' }])

    expect(result).toEqual({ count: 2, error: null })
    const insert = client.calls.find((c) => c[0] === 'insert')
    expect(insert[1]).toHaveLength(2)
    expect(insert[1].every((r) => !('id' in r))).toBe(true)
  })

  it('รายการว่างไม่เรียกฐานข้อมูล', async () => {
    const client = fakeClient({ data: [], error: null })
    expect(await createLoans(client, [])).toEqual({ count: 0, error: null })
    expect(client.calls).toEqual([])
  })
})

describe('ไม่มีการลบ', () => {
  it('ไม่ export ฟังก์ชันลบ', () => {
    expect(Object.keys(repo).some((name) => /delete|remove/i.test(name))).toBe(false)
  })
})
