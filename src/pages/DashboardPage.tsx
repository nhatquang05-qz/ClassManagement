import React, { useEffect, useState } from 'react';
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
          <span>Xin chào, <b>{user?.full_name}</b> ({user?.role_display})</span>
          <button onClick={logout} className="logout-btn">Đăng xuất</button>
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

        {/* Nơi chứa nút dẫn đến các chức năng khác */}
        <section className="actions-section">
          {(user?.role === 'group_leader' || user?.role === 'vice_group_leader') && (
            <a href="/tracking" className="action-card">
              Sổ Theo Dõi Tổ
            </a>
          )}
          {(user?.role === 'admin' || user?.role === 'monitor') && (
            <a href="/report" className="action-card">
              Báo Cáo Tổng Hợp
            </a>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;