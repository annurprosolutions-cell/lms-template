import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const emptyForm = {
  title: '',
  description: '',
  category_id: '',
  price_myr: 0,
  included_in_subscription: true,
  is_published: false,
  instructor_name: '',
  thumbnail_url: '',
}

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data: c } = await supabase.from('courses').select('*, categories(name)').order('sort_order')
    setCourses(c || [])
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(cats || [])
  }

  useEffect(() => {
    load()
  }, [])

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      category_id: form.category_id || null,
      price_myr: Number(form.price_myr) || 0,
    }
    if (editingId) {
      await supabase.from('courses').update(payload).eq('id', editingId)
    } else {
      await supabase.from('courses').insert({
        ...payload,
        slug: slugify(form.title) + '-' + Math.random().toString(36).slice(2, 6),
        sort_order: courses.length,
      })
    }
    setForm(emptyForm)
    setEditingId(null)
    setSaving(false)
    load()
  }

  function startEdit(course) {
    setEditingId(course.id)
    setForm({
      title: course.title,
      description: course.description || '',
      category_id: course.category_id || '',
      price_myr: course.price_myr,
      included_in_subscription: course.included_in_subscription,
      is_published: course.is_published,
      instructor_name: course.instructor_name || '',
      thumbnail_url: course.thumbnail_url || '',
    })
  }

  async function handleDelete(id) {
    if (!confirm('Padam kursus ini beserta semua video di dalamnya?')) return
    await supabase.from('courses').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Kursus</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 mb-6 space-y-3">
        <h2 className="font-semibold text-sm">{editingId ? 'Edit Kursus' : 'Tambah Kursus Baru'}</h2>
        <input
          required
          placeholder="Tajuk kursus"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Penerangan"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.category_id}
            onChange={(e) => updateField('category_id', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">-- Tiada kategori --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Harga (RM), 0 = percuma"
            value={form.price_myr}
            onChange={(e) => updateField('price_myr', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <input
          placeholder="Nama pengajar (opsyenal)"
          value={form.instructor_name}
          onChange={(e) => updateField('instructor_name', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <input
          placeholder="URL thumbnail (opsyenal)"
          value={form.thumbnail_url}
          onChange={(e) => updateField('thumbnail_url', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.included_in_subscription}
              onChange={(e) => updateField('included_in_subscription', e.target.checked)}
            />
            Termasuk dalam pakej langganan all-access
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => updateField('is_published', e.target.checked)}
            />
            Publish (nampak di laman awam)
          </label>
        </div>
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
                setForm(emptyForm)
              }}
              className="px-4 py-2 rounded text-sm border border-gray-300"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg divide-y">
        {courses.map((course) => (
          <div key={course.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-sm">
                {course.title}{' '}
                {!course.is_published && <span className="text-xs text-gray-400">(draft)</span>}
              </p>
              <p className="text-xs text-gray-500">
                {course.categories?.name || 'Tiada kategori'} &middot; RM{Number(course.price_myr).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link to={`/admin/courses/${course.id}/lessons`} className="text-brand-700 hover:underline">
                Urus Video
              </Link>
              <button onClick={() => startEdit(course)} className="text-brand-700 hover:underline">Edit</button>
              <button onClick={() => handleDelete(course.id)} className="text-red-600 hover:underline">Padam</button>
            </div>
          </div>
        ))}
        {courses.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">Belum ada kursus.</p>}
      </div>
    </div>
  )
}
