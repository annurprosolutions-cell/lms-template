import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import CourseCard from '../components/CourseCard'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [myCourses, setMyCourses] = useState([])
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    if (!user) return

    supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => setSubscription(data))

    supabase
      .from('course_purchases')
      .select('courses(*)')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .then(({ data }) => setMyCourses((data || []).map((row) => row.courses).filter(Boolean)))
  }, [user])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold">Selamat kembali, {profile?.full_name || user?.email}</h1>

      <div className="mt-4">
        {subscription ? (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded p-4 text-sm inline-block">
            Langganan aktif: <strong>{subscription.subscription_plans?.name}</strong>
            {subscription.expires_at && ` — luput ${new Date(subscription.expires_at).toLocaleDateString('ms-MY')}`}
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-200 rounded p-4 text-sm inline-block">
            Anda belum langgan pakej all-access.{' '}
            <Link to="/pricing" className="text-brand-700 font-medium">Lihat pakej</Link>
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold mt-10 mb-4">Kursus Yang Anda Beli</h2>
      {myCourses.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Belum ada kursus dibeli secara individu.{' '}
          <Link to="/courses" className="text-brand-700 font-medium">Layari kelas video</Link>
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {myCourses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  )
}
