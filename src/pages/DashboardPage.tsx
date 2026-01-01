import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/Dashboard.css';

interface Ranking {
  group_number: number;
  total_points: number;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [rankings, setRankings] = useState<Ranking[]>([]);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await api.get('/dashboard/rankings');
        setRankings(res.data);
      } catch (error) {
        console.error('Failed to fetch rankings', error);
      }
    };
    fetchRankings();
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Lớp Học 10A3 - Quản Lý Thi Đua</h1>
        <div className="user-info">
          <span>
            Xin chào, <b>{user?.full_name}</b> ({user?.role_display})
          </span>
          <button onClick={logout} className="logout-btn">
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="ranking-section">
          <h2>🏆 Bảng Xếp Hạng Các Tổ</h2>
          <div className="ranking-cards">
            {rankings.map((rank, index) => (
              <div key={rank.group_number} className={`rank-card rank-${index + 1}`}>
                <div className="rank-badge">#{index + 1}</div>
                <h3>Tổ {rank.group_number}</h3>
                <p className="points">{rank.total_points} điểm</p>
              </div>
            ))}
          </div>
        </section>

        {}
        <section className="actions-section">
          {}
          <Link to="/my-record" className="action-card" style={{ borderLeft: '5px solid #4caf50' }}>
            👤 Xem Hạnh Kiểm Cá Nhân
          </Link>

          {}
          {(user?.role === 'group_leader' ||
            user?.role === 'vice_group_leader' ||
            user?.role === 'monitor' ||
            user?.role === 'admin') && (
            <Link
              to="/tracking"
              className="action-card"
              style={{ borderLeft: '5px solid #2196f3' }}
            >
              📝 Sổ Theo Dõi (Ghi Lỗi)
            </Link>
          )}

          {}
          {(user?.role === 'admin' || user?.role === 'monitor') && (
            <Link to="/report" className="action-card" style={{ borderLeft: '5px solid #ff9800' }}>
              📊 Báo Cáo Tổng Hợp
            </Link>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
