import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

import Home from './pages/Home'
import CourseCatalog from './pages/CourseCatalog'
import CourseDetail from './pages/CourseDetail'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSettings from './pages/admin/AdminSettings'
import AdminCategories from './pages/admin/AdminCategories'
import AdminCourses from './pages/admin/AdminCourses'
import AdminLessons from './pages/admin/AdminLessons'
import AdminNotices from './pages/admin/AdminNotices'
import AdminUsers from './pages/admin/AdminUsers'

export default function App() {
  return (
      <div className="min-h-screen flex flex-col">
            <Navbar />
                  <div className="flex-1">
                          <Routes>
                                    <Route path="/" element={<Home />} />
                                              <Route path="/courses" element={<CourseCatalog />} />
                                                        <Route path="/courses/:slug" element={<CourseDetail />} />
                                                                  <Route path="/pricing" element={<Pricing />} />
                                                                            <Route path="/login" element={<Login />} />
                                                                                      <Route path="/register" element={<Register />} />

                                                                                                <Route
                                                                                                            path="/dashboard"
                                                                                                                        element={
                                                                                                                                      <ProtectedRoute>
                                                                                                                                                      <Dashboard />
                                                                                                                                                                    </ProtectedRoute>
                                                                                                                                                                                }
                                                                                                                                                                                          />

                                                                                                                                                                                                    <Route
                                                                                                                                                                                                                path="/admin"
                                                                                                                                                                                                                            element={
                                                                                                                                                                                                                                          <AdminRoute>
                                                                                                                                                                                                                                                          <AdminLayout />
                                                                                                                                                                                                                                                                        </AdminRoute>
                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                              >
                                                                                                                                                                                                                                                                                                          <Route index element={<AdminDashboard />} />
                                                                                                                                                                                                                                                                                                                      <Route path="settings" element={<AdminSettings />} />
                                                                                                                                                                                                                                                                                                                                  <Route path="categories" element={<AdminCategories />} />
                                                                                                                                                                                                                                                                                                                                              <Route path="courses" element={<AdminCourses />} />
                                                                                                                                                                                                                                                                                                                                                          <Route path="courses/:courseId/lessons" element={<AdminLessons />} />
                                                                                                                                                                                                                                                                                                                                                                      <Route path="notices" element={<AdminNotices />} />
                                                                                                                                                                                                                                                                                                                                                                                  <Route path="users" element={<AdminUsers />} />
                                                                                                                                                                                                                                                                                                                                                                                            </Route>
                                                                                                                                                                                                                                                                                                                                                                                                    </Routes>
                                                                                                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                                                                                                                <Footer />
                                                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                                                      )
                                                                                                                                                                                                                                                                                                                                                                                                                      }