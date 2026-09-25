import { useCallback, useEffect, useState } from 'react'
import { getLegacyImport, markLegacyImportDone } from '../lib/legacyImport.js'
import { SESSION_ERROR, createLoan, createLoans, listLoans, updateLoan } from '../lib/loanRepo.js'
import { filterLoansByFriend, markReturned, unmarkReturned } from '../lib/loanRules.js'
import ImportBanner from './ImportBanner.jsx'
import LoanForm from './LoanForm.jsx'
import LoanList from './LoanList.jsx'
import SearchBox from './SearchBox.jsx'

// หน้ารายการ Loan ของบัญชีที่เข้าสู่ระบบอยู่
// App ใส่ key เป็น id ของบัญชี ออกจากระบบแล้ว state ทั้งหมดหายไปพร้อมคอมโพเนนต์
export default function LoanPage({ client, today, onSessionExpired }) {
  const [loans, setLoans] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')

  const [legacy, setLegacy] = useState(() => getLegacyImport())
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importResult, setImportResult] = useState(null)

  const reportError = useCallback(
    (message) => {
      if (message === SESSION_ERROR) onSessionExpired()
      return message
    },
    [onSessionExpired],
  )

  // เพิ่ม reloadKey เพื่อโหลดรายการใหม่ (ลองใหม่, หลังนำเข้าข้อมูลเดิม)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    let active = true
    listLoans(client).then((result) => {
      if (!active) return
      if (result.error) {
        setLoadError(reportError(result.error))
      } else {
        setLoadError(null)
        setLoans(result.loans)
      }
    })
    return () => {
      active = false
    }
  }, [client, reportError, reloadKey])

  const handleRetry = () => {
    setLoadError(null)
    reload()
  }

  // บันทึกทีละรายการ อัปเดต state จากแถวที่ฐานข้อมูลส่งกลับ
  // ล้มเหลวไม่เปลี่ยน state และคืน false ให้ผู้เรียกคงค่าในฟอร์มไว้
  const persist = async (loan) => {
    setSaving(true)
    setSaveError(null)
    const result = loan.id ? await updateLoan(client, loan) : await createLoan(client, loan)
    setSaving(false)
    if (result.error) {
      setSaveError(reportError(result.error))
      return false
    }
    setLoans((current) =>
      loan.id
        ? current.map((l) => (l.id === result.loan.id ? result.loan : l))
        : [...current, result.loan],
    )
    return true
  }

  const handleSave = async (loan) => {
    const ok = await persist(loan)
    if (ok) setEditingId(null)
    return ok
  }

  const handleMarkReturned = (loan, returnedDate) => persist(markReturned(loan, today, returnedDate))
  const handleUnmarkReturned = (loan) => persist(unmarkReturned(loan))

  const handleImport = async () => {
    setImporting(true)
    setImportError(null)
    const result = await createLoans(client, legacy.loans)
    setImporting(false)
    if (result.error) {
      setImportError(reportError(result.error))
      return
    }
    markLegacyImportDone()
    setImportResult(
      `นำเข้าข้อมูลเดิมแล้ว ${result.count} รายการ` +
        (legacy.skipped > 0 ? ` ข้าม ${legacy.skipped} รายการที่ข้อมูลไม่ถูกต้อง` : ''),
    )
    setLegacy({ ...legacy, pending: false })
    reload()
  }

  const handleDecline = () => {
    markLegacyImportDone()
    setLegacy({ ...legacy, pending: false })
  }

  if (loans === null) {
    if (!loadError) return <p role="status">กำลังโหลด...</p>
    return (
      <div className="load-error">
        <p role="alert">{loadError}</p>
        <button type="button" onClick={handleRetry}>
          ลองใหม่
        </button>
      </div>
    )
  }

  const editingLoan = loans.find((loan) => loan.id === editingId) ?? null

  return (
    <>
      {legacy.pending && (
        <ImportBanner
          legacy={legacy}
          busy={importing}
          error={importError}
          onImport={handleImport}
          onDecline={handleDecline}
        />
      )}
      {importResult && <p role="status">{importResult}</p>}
      {loadError && <p role="alert">{loadError}</p>}
      {saveError && <p role="alert">{saveError}</p>}
      <LoanForm
        key={editingLoan?.id ?? 'new'}
        today={today}
        editingLoan={editingLoan}
        saving={saving}
        onSave={handleSave}
        onCancelEdit={() => setEditingId(null)}
      />
      <SearchBox value={query} onChange={setQuery} />
      <LoanList
        loans={filterLoansByFriend(loans, query)}
        today={today}
        saving={saving}
        onMarkReturned={handleMarkReturned}
        onUnmarkReturned={handleUnmarkReturned}
        onEdit={(loan) => setEditingId(loan.id)}
      />
    </>
  )
}
