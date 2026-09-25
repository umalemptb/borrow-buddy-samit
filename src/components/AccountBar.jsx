// แสดงบัญชีเจ้าของที่เข้าสู่ระบบอยู่ และปุ่มออกจากระบบ
export default function AccountBar({ email, onSignOut, signingOut }) {
  return (
    <div className="account-bar">
      <span>เข้าสู่ระบบเป็น {email}</span>
      <button type="button" onClick={onSignOut} disabled={signingOut}>
        {signingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
      </button>
    </div>
  )
}
