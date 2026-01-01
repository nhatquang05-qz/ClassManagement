import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
// 1. Import ClassProvider
import { ClassProvider } from './contexts/ClassContext'; 

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TrackingPage from './pages/TrackingPage';
import MyRecordPage from './pages/MyRecordPage';
import ClassSelectionPage from './pages/ClassSelectionPage'; 
import ClassManagementPage from './pages/ClassManagementPage';
import StudentManagerPage from './pages/StudentManagerPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', color: '#666' }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* 2. BỌC ClassProvider Ở ĐÂY */}
        <ClassProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tracking"
              element={
                <ProtectedRoute>
                  <TrackingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-record"
              element={
                <ProtectedRoute>
                  <MyRecordPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/classes"
              element={
                <ProtectedRoute>
                  <ClassSelectionPage />
                </ProtectedRoute>
              }
            />

            {/* Nếu bạn vẫn muốn giữ trang quản lý lớp riêng biệt */}
            <Route
              path="/manage-classes"
              element={
                <ProtectedRoute>
                  <ClassManagementPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <StudentManagerPage />
                </ProtectedRoute>
              }
            />

          </Routes>
        </ClassProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;