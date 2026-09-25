import { useState } from 'react'
import { toThaiAuthError } from '../lib/authErrors.js'

// เข้าสู่ระบบด้วยอีเมล + รหัสผ่าน ไม่มีการสมัครสมาชิก (บัญชีเจ้าของสร้างโดยผู้ดูแลระบบ)
// notice = ข้อความจากภายนอก เช่น เซสชันหมดอายุ
export default function LoginForm({ client, notice }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }
    setBusy(true)
    setError(null)
    const { error: authError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    // สำเร็จแล้ว App จะเปลี่ยนหน้าเองจาก onAuthStateChange
    if (authError) {
      setError(toThaiAuthError(authError))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="login-form">
      <h2>เข้าสู่ระบบ</h2>
      {notice && !error && <p role="status">{notice}</p>}

      <label>
        อีเมล
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label>
        รหัสผ่าน
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && (
        <ul role="alert">
          <li>{error}</li>
        </ul>
      )}

      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </div>
    </form>
  )
}
