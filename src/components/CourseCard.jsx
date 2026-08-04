import { Link } from 'react-router-dom'

export default function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden border border-gray-100"
    >
      <div className="aspect-video bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          'Thumbnail'
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{course.title}</h3>
        {course.instructor_name && (
          <p className="text-xs text-gray-500 mt-1">{course.instructor_name}</p>
        )}
        <p className="mt-2 font-bold text-brand-700">
          {course.price_myr > 0 ? `RM${Number(course.price_myr).toFixed(2)}` : 'Percuma'}
        </p>
      </div>
    </Link>
  )
}
