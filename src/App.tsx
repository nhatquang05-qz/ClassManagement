import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
// Import trang Tracking đã tạo ở phần trước, bạn cần tạo wrapper page cho nó
// import TrackingPage from './pages/TrackingPage'; 

// Component bảo vệ route (chỉ cho phép user đã login)
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
          
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          {/* Sẽ thêm route /tracking ở bước sau */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;