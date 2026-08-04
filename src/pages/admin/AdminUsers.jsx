import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminUsers() {
  const [users, setUsers] = useState([])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleAdmin(user) {
    const newRole = user.role === 'admin' ? 'student' : 'admin'
    if (!confirm(`Tukar ${user.full_name || user.id} kepada "${newRole}"?`)) return
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
    load()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Pengguna</h1>
      <div className="bg-white border border-gray-200 rounded-lg divide-y">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-sm">{u.full_name || '(tiada nama)'}</p>
              <p className="text-xs text-gray-500">{u.role} &middot; daftar {new Date(u.created_at).toLocaleDateString('ms-MY')}</p>
            </div>
            <button onClick={() => toggleAdmin(u)} className="text-sm text-brand-700 hover:underline">
              {u.role === 'admin' ? 'Buang akses admin' : 'Jadikan admin'}
            </button>
          </div>
        ))}
        {users.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">Tiada pengguna lagi.</p>}
      </div>
    </div>
  )
}
