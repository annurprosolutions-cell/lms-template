import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Pricing() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [buying, setBuying] = useState(null)

  useEffect(() => {
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setPlans(data || []))
  }, [])

  async function handleSubscribe(plan) {
    if (!user) {
      window.location.href = '/login'
      return
    }
    setBuying(plan.id)
    try {
      const res = await fetch('/.netlify/functions/bayarcash-create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseType: 'subscription',
          referenceId: plan.id,
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
      setBuying(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center">Pilih Pakej Anda</h1>
      <p className="text-gray-500 text-center mt-2">
        Boleh juga beli kursus secara individu dari halaman setiap kelas.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mt-10">
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <h3 className="font-semibold">Free</h3>
          <p className="text-3xl font-bold mt-2">RM0</p>
          <p className="text-sm text-gray-500 mt-1">Akses kelas percuma & sample video</p>
        </div>

        {plans.map((plan) => (
          <div key={plan.id} className="border-2 border-brand-600 rounded-lg p-6 bg-white relative">
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="text-3xl font-bold mt-2 text-brand-700">RM{Number(plan.price_myr).toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {plan.plan_type === 'lifetime' ? 'Sekali bayar, akses selamanya' : 'Diperbaharui setiap tahun'}
            </p>
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={buying === plan.id}
              className="mt-4 w-full bg-brand-600 text-white py-2.5 rounded font-semibold hover:bg-brand-500 disabled:opacity-50"
            >
              {buying === plan.id ? 'Memproses...' : 'Langgan Sekarang'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
