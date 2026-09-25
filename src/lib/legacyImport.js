import { validateLoan } from './loanRules.js'
import { loadLoans } from './storage.js'

// นำเข้าข้อมูลเดิม (Loan ใน localStorage ของเวอร์ชันแรก) ครั้งเดียวต่อเครื่อง
// อ่านอย่างเดียว ไม่ลบคีย์เดิม บันทึกแค่ธงว่าเครื่องนี้นำเข้า/ปฏิเสธแล้ว

export const IMPORT_FLAG_KEY = 'borrow-buddy:legacy-imported'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const isIsoDate = (value) => typeof value === 'string' && ISO_DATE.test(value)

function isValidLegacyLoan(loan) {
  if (!loan || typeof loan !== 'object') return false
  if (typeof loan.friendName !== 'string' || typeof loan.itemName !== 'string') return false
  if (!isIsoDate(loan.borrowedDate) || !isIsoDate(loan.dueDate)) return false
  if (loan.returnedDate != null && !isIsoDate(loan.returnedDate)) return false
  return validateLoan(loan).length === 0
}

function isImportDone(storage) {
  try {
    return storage.getItem(IMPORT_FLAG_KEY) !== null
  } catch {
    // อ่านไม่ได้ ถือว่าไม่มีอะไรให้นำเข้า
    return true
  }
}

// pending = ควรถามเจ้าของหรือไม่, loans = รายการที่นำเข้าได้, skipped = จำนวนที่ผิดกติกา
export function getLegacyImport(storage = globalThis.localStorage) {
  const none = { pending: false, loans: [], skipped: 0 }
  if (isImportDone(storage)) return none

  const { loans, warning } = loadLoans(storage)
  if (warning || loans.length === 0) return none

  const valid = loans.filter(isValidLegacyLoan).map((loan) => ({
    ...loan,
    friendName: loan.friendName.trim(),
    itemName: loan.itemName.trim(),
    returnedDate: loan.returnedDate ?? null,
  }))
  return { pending: true, loans: valid, skipped: loans.length - valid.length }
}

export function markLegacyImportDone(storage = globalThis.localStorage) {
  try {
    storage.setItem(IMPORT_FLAG_KEY, 'done')
  } catch {
    // บันทึกไม่ได้ อาจถามซ้ำครั้งหน้า แต่ไม่ให้แอปล้ม
  }
}
