import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-brand-700 text-white">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-wide">
          [LOGO PLACEHOLDER] LMS Demo
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/courses" className="hover:underline">Kelas Video</Link>
          <Link to="/pricing" className="hover:underline">Harga</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:underline">Pembelajaran Saya</Link>
              {isAdmin && <Link to="/admin" className="hover:underline font-semibold">Admin Panel</Link>}
              <button onClick={handleSignOut} className="bg-brand-600 px-3 py-1.5 rounded hover:bg-brand-500">
                Log Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="bg-brand-600 px-3 py-1.5 rounded hover:bg-brand-500">
                Daftar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
