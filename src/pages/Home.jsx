import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import CourseCard from '../components/CourseCard'

export default function Home() {
  const [courses, setCourses] = useState([])
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')
      .limit(6)
      .then(({ data }) => setCourses(data || []))

    supabase
      .from('notices')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setNotice(data))
  }, [])

  return (
    <div>
      <section className="bg-brand-50 border-b border-brand-100">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-700">
            [TAJUK UTAMA PLACEHOLDER]
          </h1>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Belajar sendiri, dimana-mana, bila-bila masa. Tukar teks ini dari Admin Panel bila
            branding sedia.
          </p>
          <Link
            to="/courses"
            className="inline-block mt-6 bg-brand-600 text-white px-6 py-3 rounded font-semibold hover:bg-brand-500"
          >
            Lihat Semua Kelas
          </Link>
        </div>
      </section>

      {notice && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-4 text-sm">
            <strong>{notice.title}</strong>
            {notice.body && <p className="mt-1">{notice.body}</p>}
          </div>
        </div>
      )}

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6">Kelas Terkini</h2>
        {courses.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Belum ada kelas dipublish lagi. Tambah kursus dari Admin Panel.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
