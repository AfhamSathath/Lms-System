import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/Authcontext';
import PrivateRoute from './components/common/PrivateRoute';

// Layout Components
import Navbar from './components/layout/navbar';

// Auth Pages
import Login from './pages/auth/login';
import Register from './pages/auth/register';

// Landing Page
import Landing from './pages/home/landing';

// Student Pages
import StudentDashboard from './pages/student/dashboard';
import StudentSubjects from './pages/student/subjects';
import StudentResults from './pages/student/resutls';
import StudentFiles from './pages/student/files';
import StudentProfile from './pages/student/profile';
import StudentTimetable from './pages/student/timetable';
import StudentNotifications from './pages/student/notifications';

// Lecturer Pages
import LecturerDashboard from './pages/lecturer/dashboard';
import LecturerSubjects from './pages/lecturer/subjects';
import LecturerFiles from './pages/lecturer/files';
import LecturerProfile from './pages/lecturer/profile';
import LecturerTimetable from './pages/lecturer/timetable';
import LecturerNotifications from './pages/lecturer/notifications';

// Admin Pages
import AdminDashboard from './pages/admin/dashboard';
import AdminUsers from './pages/admin/user';
import AdminSubjects from './pages/admin/subject';
import AdminResults from './pages/admin/results';
import AdminTimetables from './pages/admin/timetable';
import AdminFiles from './pages/admin/files';
import AdminProfile from './pages/admin/Profile';
import AdminNotifications from './pages/admin/notifications';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Landing Page - No navbar needed as it has its own */}
            <Route path="/" element={<Landing />} />

            {/* Other routes with navbar */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <MainRoutes />
                </>
              }
            />
          </Routes>

          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

function MainRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      
      {/* Student Routes */}
      <Route path="student" element={<PrivateRoute role="student" />}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="subjects" element={<StudentSubjects />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="files" element={<StudentFiles />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      {/* Lecturer Routes */}
      <Route path="lecturer" element={<PrivateRoute role="lecturer" />}>
        <Route path="dashboard" element={<LecturerDashboard />} />
        <Route path="subjects" element={<LecturerSubjects />} />
        <Route path="files" element={<LecturerFiles />} />
        <Route path="timetable" element={<LecturerTimetable />} />
        <Route path="notifications" element={<LecturerNotifications />} />
        <Route path="profile" element={<LecturerProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route path="admin" element={<PrivateRoute role="admin" />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="results" element={<AdminResults />} />
        <Route path="timetables" element={<AdminTimetables />} />
        <Route path="files" element={<AdminFiles />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;