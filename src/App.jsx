import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './App.css'
import AccountBar from './components/AccountBar.jsx'
import LoanPage from './components/LoanPage.jsx'
import LoginForm from './components/LoginForm.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { SESSION_EXPIRED } from './lib/authErrors.js'
import { toIsoDate } from './lib/dateFormat.js'
import { CONFIG_ERROR, supabase } from './lib/supabaseClient.js'
import { getInitialTheme, saveTheme, toggleTheme } from './lib/theme.js'

function App() {
  // undefined = กำลังตรวจเซสชันเดิม, null = ยังไม่เข้าสู่ระบบ
  const [session, setSession] = useState(undefined)
  const [notice, setNotice] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const signOutRequested = useRef(false)
  const [theme, setTheme] = useState(() =>
    getInitialTheme(undefined, window.matchMedia('(prefers-color-scheme: dark)').matches),
  )

  // ตั้งธีมให้ <html> ก่อนวาดหน้าจอ เพื่อไม่ให้จอกะพริบ
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // ติดตามเซสชัน: INITIAL_SESSION ตอนเปิดหน้า, SIGNED_IN/OUT, TOKEN_REFRESHED
  // ห้ามเรียก supabase แบบ await ใน callback นี้ (ตามคำแนะนำของ supabase-js)
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT' && !signOutRequested.current) setNotice(SESSION_EXPIRED)
      if (event === 'SIGNED_IN') setNotice(null)
      signOutRequested.current = false
      setSession(nextSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const handleToggleTheme = () => {
    const next = toggleTheme(theme)
    setTheme(next)
    saveTheme(next)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    signOutRequested.current = true
    const { error } = await supabase.auth.signOut()
    // ติดต่อเซิร์ฟเวอร์ไม่ได้ ก็ยังล้างเซสชันในเครื่องนี้
    if (error) await supabase.auth.signOut({ scope: 'local' })
    setNotice(null)
    setSigningOut(false)
  }

  // คำขอข้อมูลตอบว่าเซสชันหมดอายุ: ล้างเซสชันในเครื่องแล้วกลับหน้าเข้าสู่ระบบ
  const handleSessionExpired = useCallback(() => {
    supabase.auth.signOut({ scope: 'local' })
  }, [])

  const today = toIsoDate(new Date())

  let content
  if (CONFIG_ERROR) {
    content = <p role="alert">{CONFIG_ERROR}</p>
  } else if (session === undefined) {
    content = <p role="status">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
  } else if (session === null) {
    content = <LoginForm client={supabase} notice={notice} />
  } else {
    content = (
      <>
        <AccountBar
          email={session.user.email}
          onSignOut={handleSignOut}
          signingOut={signingOut}
        />
        <LoanPage
          key={session.user.id}
          client={supabase}
          today={today}
          onSessionExpired={handleSessionExpired}
        />
      </>
    )
  }

  return (
    <main>
      <header className="app-header">
        <h1>Borrow Buddy</h1>
        <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
      </header>
      {content}
    </main>
  )
}

export default App
