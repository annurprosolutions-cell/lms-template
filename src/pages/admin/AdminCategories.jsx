import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    if (editingId) {
      await supabase.from('categories').update({ name, description }).eq('id', editingId)
    } else {
      await supabase.from('categories').insert({
        name,
        description,
        slug: slugify(name) + '-' + Math.random().toString(36).slice(2, 6),
        sort_order: categories.length,
      })
    }
    setName('')
    setDescription('')
    setEditingId(null)
    setSaving(false)
    load()
  }

  function startEdit(cat) {
    setEditingId(cat.id)
    setName(cat.name)
    setDescription(cat.description || '')
  }

  async function handleDelete(id) {
    if (!confirm('Padam kategori ini? Kursus dalam kategori ini akan jadi "tiada kategori".')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Kategori Kursus</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 mb-6 space-y-3">
        <h2 className="font-semibold text-sm">{editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h2>
        <input
          required
          placeholder="Nama kategori (cth: Tafsir Al-Quran)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Penerangan (opsyenal)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-brand-500 disabled:opacity-50"
          >
            {editingId ? 'Simpan' : 'Tambah'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setName('')
                setDescription('')
              }}
              className="px-4 py-2 rounded text-sm border border-gray-300"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg divide-y">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-sm">{cat.name}</p>
              {cat.description && <p className="text-xs text-gray-500">{cat.description}</p>}
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => startEdit(cat)} className="text-brand-700 hover:underline">Edit</button>
              <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:underline">Padam</button>
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">Belum ada kategori.</p>}
      </div>
    </div>
  )
}
