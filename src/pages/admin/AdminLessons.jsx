import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

const emptyForm = {
  title: '',
  description: '',
  video_type: 'youtube',
  video_url: '',
  is_free_preview: false,
  pdf_note_url: '',
}

export default function AdminLessons() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data: c } = await supabase.from('courses').select('*').eq('id', courseId).single()
    setCourse(c)
    const { data: l } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order')
    setLessons(l || [])
  }

  useEffect(() => {
    load()
  }, [courseId])

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    if (editingId) {
      await supabase.from('lessons').update(form).eq('id', editingId)
    } else {
      await supabase.from('lessons').insert({
        ...form,
        course_id: courseId,
        sort_order: lessons.length,
      })
    }
    setForm(emptyForm)
    setEditingId(null)
    setSaving(false)
    load()
  }

  function startEdit(lesson) {
    setEditingId(lesson.id)
    setForm({
      title: lesson.title,
      description: lesson.description || '',
      video_type: lesson.video_type,
      video_url: lesson.video_url,
      is_free_preview: lesson.is_free_preview,
      pdf_note_url: lesson.pdf_note_url || '',
    })
  }

  async function handleDelete(id) {
    if (!confirm('Padam video ini?')) return
    await supabase.from('lessons').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <Link to="/admin/courses" className="text-sm text-brand-700 hover:underline">&larr; Balik ke senarai kursus</Link>
      <h1 className="text-xl font-bold mt-2 mb-1">Urus Video</h1>
      <p className="text-sm text-gray-500 mb-6">{course?.title}</p>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 mb-6 space-y-3">
        <h2 className="font-semibold text-sm">{editingId ? 'Edit Video' : 'Tambah Video Baru'}</h2>
        <input
          required
          placeholder="Tajuk video"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Penerangan (opsyenal)"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.video_type}
            onChange={(e) => updateField('video_type', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="youtube">YouTube (embed URL) — sesuai untuk video PERCUMA</option>
            <option value="bunny">Bunny Stream (embed URL) — sesuai untuk video BERBAYAR</option>
            <option value="direct_url">Direct video file URL (.mp4)</option>
          </select>
          <input
            required
            placeholder="URL video"
            value={form.video_url}
            onChange={(e) => updateField('video_url', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          YouTube: guna embed URL cth https://www.youtube.com/embed/VIDEO_ID (bukan link "watch?v=").
          Bunny: guna iframe embed URL dari Bunny Stream dashboard.
        </p>
        <input
          placeholder="URL nota PDF (opsyenal)"
          value={form.pdf_note_url}
          onChange={(e) => updateField('pdf_note_url', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_free_preview}
            onChange={(e) => updateField('is_free_preview', e.target.checked)}
          />
          Free preview (boleh tonton tanpa bayar/langganan)
        </label>
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
        {lessons.map((lesson) => (
          <div key={lesson.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-sm">
                {lesson.title}{' '}
                {lesson.is_free_preview && <span className="text-xs text-green-600">(free preview)</span>}
              </p>
              <p className="text-xs text-gray-500">{lesson.video_type}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => startEdit(lesson)} className="text-brand-700 hover:underline">Edit</button>
              <button onClick={() => handleDelete(lesson.id)} className="text-red-600 hover:underline">Padam</button>
            </div>
          </div>
        ))}
        {lessons.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">Belum ada video.</p>}
      </div>
    </div>
  )
}
