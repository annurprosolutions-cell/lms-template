import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminNotices() {
  const [notices, setNotices] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false })
    setNotices(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('notices').insert({ title, body })
    setTitle('')
    setBody('')
    setSaving(false)
    load()
  }

  async function toggleActive(notice) {
    await supabase.from('notices').update({ is_active: !notice.is_active }).eq('id', notice.id)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Padam notis ini?')) return
    await supabase.from('notices').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Notis Laman Web</h1>
      <p className="text-sm text-gray-500 mb-4">
        Notis aktif akan dipaparkan di halaman utama. Hanya satu notis terkini yang ditunjukkan pada satu-satu masa.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 mb-6 space-y-3">
        <input
          required
          placeholder="Tajuk notis"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Kandungan notis"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={3}
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-brand-500 disabled:opacity-50"
        >
          Tambah Notis
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg divide-y">
        {notices.map((n) => (
          <div key={n.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-xs text-gray-500">{n.body}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => toggleActive(n)} className="text-brand-700 hover:underline">
                {n.is_active ? 'Nyahaktifkan' : 'Aktifkan'}
              </button>
              <button onClick={() => handleDelete(n.id)} className="text-red-600 hover:underline">Padam</button>
            </div>
          </div>
        ))}
        {notices.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">Belum ada notis.</p>}
      </div>
    </div>
  )
}
