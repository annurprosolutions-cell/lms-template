// Renders a lesson video based on video_type.
// - youtube: embed via iframe (fine for FREE/preview content)
// - bunny: embed via Bunny Stream iframe URL (paid content, access already checked by caller)
// - direct_url: plain <video> tag
export default function VideoPlayer({ lesson }) {
  if (!lesson) return null

  if (lesson.video_type === 'youtube') {
    return (
      <div className="aspect-video">
        <iframe
          className="w-full h-full rounded"
          src={lesson.video_url}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (lesson.video_type === 'bunny') {
    return (
      <div className="aspect-video">
        <iframe
          className="w-full h-full rounded"
          src={lesson.video_url}
          title={lesson.title}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <video controls className="w-full rounded">
      <source src={lesson.video_url} />
      Browser anda tidak menyokong video tag.
    </video>
  )
}
