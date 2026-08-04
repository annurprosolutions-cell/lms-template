import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import CourseCard from '../components/CourseCard'

export default function CourseCatalog() {
  const [categories, setCategories] = useState([])
  const [courses, setCourses] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data || []))
    supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')
      .then(({ data }) => setCourses(data || []))
  }, [])

  const filtered =
    activeCategory === 'all' ? courses : courses.filter((c) => c.category_id === activeCategory)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Kelas Video</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-sm border ${
            activeCategory === 'all' ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300'
          }`}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              activeCategory === cat.id ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">Tiada kelas dalam kategori ini.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  )
}
