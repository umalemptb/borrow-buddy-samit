import { describe, expect, it } from 'vitest'
import { fromRow, toRow } from './loanMapper.js'

const row = {
  id: '6f1c0e7a-0000-4000-8000-000000000001',
  owner_id: '6f1c0e7a-0000-4000-8000-0000000000aa',
  friend_name: 'ต้น',
  item_name: 'ร่มสีฟ้า',
  borrowed_date: '2026-09-01',
  due_date: '2026-09-24',
  returned_date: null,
  created_at: '2026-09-01T10:00:00+00:00',
}

const loan = {
  id: row.id,
  friendName: 'ต้น',
  itemName: 'ร่มสีฟ้า',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
}

describe('fromRow', () => {
  it('แปลง row เป็น Loan ครบทุกฟิลด์ และไม่มี owner_id/created_at', () => {
    expect(fromRow(row)).toEqual(loan)
  })

  it('คงวันที่คืนจริงไว้เมื่อคืนแล้ว', () => {
    expect(fromRow({ ...row, returned_date: '2026-09-20' }).returnedDate).toBe('2026-09-20')
  })
})

describe('toRow', () => {
  it('แปลง Loan เป็น row โดยไม่ส่ง id และ owner_id', () => {
    expect(toRow(loan)).toEqual({
      friend_name: 'ต้น',
      item_name: 'ร่มสีฟ้า',
      borrowed_date: '2026-09-01',
      due_date: '2026-09-24',
      returned_date: null,
    })
  })

  it('returnedDate ที่ไม่มีค่ากลายเป็น null', () => {
    const { returnedDate: _, ...noReturned } = loan
    expect(toRow(noReturned).returned_date).toBeNull()
  })

  it('แปลงไป-กลับได้ Loan เดิม', () => {
    expect(fromRow({ ...toRow(loan), id: loan.id })).toEqual(loan)
  })
})
