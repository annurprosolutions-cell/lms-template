import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import VideoPlayer from '../components/VideoPlayer'

export default function CourseDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single()
      if (!courseData) return
      setCourse(courseData)

      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseData.id)
        .order('sort_order')
      setLessons(lessonData || [])
      setActiveLesson((lessonData || [])[0] || null)

      if (user) {
        // Free course -> always has access
        if (Number(courseData.price_myr) === 0) {
          setHasAccess(true)
        } else {
          // Check direct course purchase
          const { data: purchase } = await supabase
            .from('course_purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseData.id)
            .eq('status', 'paid')
            .maybeSingle()

          if (purchase) {
            setHasAccess(true)
          } else if (courseData.included_in_subscription) {
            // Check active subscription
            const { data: sub } = await supabase
              .from('user_subscriptions')
              .select('id, status, expires_at')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .maybeSingle()
            if (sub && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
              setHasAccess(true)
            }
          }
        }
      }
      setCheckingAccess(false)
    }
    load()
  }, [slug, user])

  async function handleBuyCourse() {
    if (!user) {
      window.location.href = '/login'
      return
    }
    setBuying(true)
    try {
      const res = await fetch('/.netlify/functions/bayarcash-create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseType: 'course',
          referenceId: course.id,
          userId: user.id,
          userEmail: user.email,
        }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        alert('Ralat memproses bayaran. Sila cuba lagi.')
      }
    } finally {
      setBuying(false)
    }
  }

  if (!course) return <div className="max-w-4xl mx-auto px-4 py-10">Memuatkan...</div>

  const canWatch = (lesson) => lesson.is_free_preview || hasAccess

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        {course.instructor_name && <p className="text-gray-500 text-sm mt-1">{course.instructor_name}</p>}
        <p className="mt-4 text-gray-700">{course.description}</p>

        <div className="mt-6">
          {activeLesson ? (
            canWatch(activeLesson) ? (
              <VideoPlayer lesson={activeLesson} />
            ) : (
              <div className="aspect-video bg-gray-100 border border-gray-200 rounded flex flex-col items-center justify-center text-center p-6">
                <p className="font-semibold text-gray-700">Video ini untuk pelajar berbayar sahaja</p>
                <p className="text-sm text-gray-500 mt-1">Beli kursus ini atau langgan all-access untuk tonton penuh.</p>
              </div>
            )
          ) : (
            <p className="text-gray-500 text-sm">Tiada video lagi untuk kursus ini.</p>
          )}
        </div>
      </div>

      <div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-4">
          <p className="text-2xl font-bold text-brand-700">
            {course.price_myr > 0 ? `RM${Number(course.price_myr).toFixed(2)}` : 'Percuma'}
          </p>
          {!checkingAccess && !hasAccess && course.price_myr > 0 && (
            <button
              onClick={handleBuyCourse}
              disabled={buying}
              className="mt-4 w-full bg-brand-600 text-white py-2.5 rounded font-semibold hover:bg-brand-500 disabled:opacity-50"
            >
              {buying ? 'Memproses...' : 'Beli Kursus Ini'}
            </button>
          )}
          {hasAccess && (
            <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              Anda sudah ada akses penuh
            </p>
          )}
        </div>

        <h2 className="font-semibold mt-6 mb-2">Senarai Video</h2>
        <ul className="space-y-1">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <button
                onClick={() => setActiveLesson(lesson)}
                className={`w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center ${
                  activeLesson?.id === lesson.id ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                <span>{lesson.title}</span>
                {!canWatch(lesson) && <span className="text-xs text-gray-400">Locked</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
