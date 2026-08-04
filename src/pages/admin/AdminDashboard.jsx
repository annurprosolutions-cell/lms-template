import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ courses: 0, users: 0, subs: 0, revenue: 0 })

  useEffect(() => {
    async function load() {
      const [{ count: courses }, { count: users }, { count: subs }, { data: tx }] = await Promise.all([
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('payment_transactions').select('amount_myr').eq('status', 'success'),
      ])
      const revenue = (tx || []).reduce((sum, row) => sum + Number(row.amount_myr || 0), 0)
      setStats({ courses: courses || 0, users: users || 0, subs: subs || 0, revenue })
    }
    load()
  }, [])

  const cards = [
    { label: 'Jumlah Kursus', value: stats.courses },
    { label: 'Jumlah Pengguna', value: stats.users },
    { label: 'Langganan Aktif', value: stats.subs },
    { label: 'Jumlah Hasil (RM)', value: `RM${stats.revenue.toFixed(2)}` },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Ringkasan</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-6">
        Statistik jualan/pengguna lanjut (graf, breakdown ikut tarikh) boleh ditambah kemudian —
        ini paparan asas untuk semak angka cepat.
      </p>
    </div>
  )
}
