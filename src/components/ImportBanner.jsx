// ถามเจ้าของว่าจะนำเข้าข้อมูลเดิม (Loan ใน localStorage ของเวอร์ชันแรก) หรือไม่
// legacy = ผลจาก getLegacyImport
export default function ImportBanner({ legacy, busy, error, onImport, onDecline }) {
  const count = legacy.loans.length

  return (
    <section className="import-banner" aria-label="นำเข้าข้อมูลเดิม">
      <p>
        พบข้อมูลเดิมในเครื่องนี้ นำเข้าได้ {count} รายการ
        {legacy.skipped > 0 && ` (ข้าม ${legacy.skipped} รายการที่ข้อมูลไม่ถูกต้อง)`}
        {' '}ต้องการนำเข้าเป็น Loan ของบัญชีนี้หรือไม่ ข้อมูลเดิมในเครื่องจะไม่ถูกลบ
      </p>
      {error && (
        <ul role="alert">
          <li>{error}</li>
        </ul>
      )}
      <div className="form-actions">
        <button type="button" className="primary" onClick={onImport} disabled={busy || count === 0}>
          {busy ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูลเดิม'}
        </button>
        <button type="button" onClick={onDecline} disabled={busy}>
          ไม่นำเข้า
        </button>
      </div>
    </section>
  )
}
