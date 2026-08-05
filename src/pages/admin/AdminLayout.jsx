import { NavLink, Outlet } from 'react-router-dom'

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded text-sm ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`

  export default function AdminLayout() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-8">
              <aside className="md:col-span-1 space-y-1">
                      <h2 className="font-bold text-lg mb-3">Admin Panel</h2>
                              <NavLink to="/admin" end className={linkClass}>Ringkasan</NavLink>
                                      <NavLink to="/admin/settings" className={linkClass}>Branding</NavLink>
                                              <NavLink to="/admin/categories" className={linkClass}>Kategori</NavLink>
                                                      <NavLink to="/admin/courses" className={linkClass}>Kursus</NavLink>
                                                              <NavLink to="/admin/notices" className={linkClass}>Notis</NavLink>
                                                                      <NavLink to="/admin/users" className={linkClass}>Pengguna</NavLink>
                                                                            </aside>
                                                                                  <main className="md:col-span-3">
                                                                                          <Outlet />
                                                                                                </main>
                                                                                                    </div>
                                                                                                      )
                                                                                                      }