import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/Dashboard.css';

interface Ranking {
  group_number: number;
  total_points: number;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  
  const [currentClassName, setCurrentClassName] = useState(
    localStorage.getItem('selectedClassName') || 'Lớp Học'
  );

  useEffect(() => {
    // 1. Kiểm tra xem GV/Admin đã chọn lớp chưa
    if (user?.role === 'teacher' || user?.role === 'admin') {
        const classId = localStorage.getItem('selectedClassId');
        if (!classId) {
            navigate('/classes'); // Chưa chọn lớp -> Quay về trang chọn lớp
            return;
        }
    }

    // 2. Fetch dữ liệu bảng xếp hạng (kèm class_id)
    const fetchRankings = async () => {
      try {
        const classId = localStorage.getItem('selectedClassId');
        // Nếu là HS thì không cần classId (backend tự lấy theo user), GV thì cần
        const params = classId ? { class_id: classId } : {};
        
        const res = await api.get('/dashboard/rankings', { params });
        setRankings(res.data);
      } catch (error) {
        console.error('Failed to fetch rankings', error);
      }
    };
    fetchRankings();
  }, [user, navigate]);

  const handleLogout = () => {
      // Xóa thông tin lớp đã chọn khi đăng xuất để tránh nhầm lẫn cho lần sau
      localStorage.removeItem('selectedClassId');
      localStorage.removeItem('selectedClassName');
      logout();
  };

  // Hàm xử lý đổi lớp: Xóa ID lớp cũ trước khi chuyển hướng
  const handleChangeClass = () => {
      localStorage.removeItem('selectedClassId');
      localStorage.removeItem('selectedClassName');
      navigate('/classes');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        {/* Hiển thị tên lớp động */}
        <h1>{currentClassName} - Quản Lý Thi Đua</h1>
        <div className="user-info">
          <span>
            Xin chào, <b>{user?.full_name}</b> ({user?.role_display})
          </span>
          
          {/* Nút đổi lớp cho GV */}
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <button 
                onClick={handleChangeClass} 
                className="logout-btn" 
                style={{marginRight: 10, backgroundColor: '#2196f3'}}
            >
                ↻ Đổi Lớp
            </button>
          )}

          <button onClick={handleLogout} className="logout-btn">
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="ranking-section">
          <h2>🏆 Bảng Xếp Hạng Các Tổ</h2>
          {rankings.length === 0 ? (
             <p style={{textAlign: 'center', color: '#666'}}>Chưa có dữ liệu thi đua tuần này.</p>
          ) : (
            <div className="ranking-cards">
                {rankings.map((rank, index) => (
                <div key={rank.group_number} className={`rank-card rank-${index + 1}`}>
                    <div className="rank-badge">#{index + 1}</div>
                    <h3>Tổ {rank.group_number}</h3>
                    <p className="points">{rank.total_points} điểm</p>
                </div>
                ))}
            </div>
          )}
        </section>

        <section className="actions-section">
          <Link to="/my-record" className="action-card" style={{ borderLeft: '5px solid #4caf50' }}>
            👤 Xem Hạnh Kiểm Cá Nhân
          </Link>

          {(user?.role === 'group_leader' ||
            user?.role === 'vice_group_leader' ||
            user?.role === 'monitor' ||
            user?.role === 'admin' || 
            user?.role === 'teacher') && ( 
            <Link
              to="/tracking"
              className="action-card"
              style={{ borderLeft: '5px solid #2196f3' }}
            >
              📝 Sổ Theo Dõi (Ghi Lỗi)
            </Link>
          )}

          {(user?.role === 'admin' || user?.role === 'monitor' || user?.role === 'teacher') && (
            <Link to="/report" className="action-card" style={{ borderLeft: '5px solid #ff9800' }}>
              📊 Báo Cáo Tổng Hợp
            </Link>
          )}
          
          {/* Nút quản lý học sinh nhanh cho GV */}
          {(user?.role === 'teacher' || user?.role === 'admin') && (
             <Link to="/students" className="action-card" style={{ borderLeft: '5px solid #9c27b0' }}>
                👥 Danh Sách Học Sinh
             </Link>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;