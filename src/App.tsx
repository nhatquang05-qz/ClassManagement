import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TrackingPage from './pages/TrackingPage.tsx'; // <-- Đã tạo ở bước trước
import MyRecordPage from './pages/MyRecordPage'; // <-- Mới tạo

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Các trang cần đăng nhập mới xem được */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
          <Route path="/my-record" element={<ProtectedRoute><MyRecordPage /></ProtectedRoute>} />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;