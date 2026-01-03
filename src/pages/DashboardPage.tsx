import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [currentClassName] = useState(localStorage.getItem('selectedClassName') || 'Lớp Học');

    return (
        <div className="dashboard-content">
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ color: 'var(--primary-color)' }}>Xin chào, {user?.full_name}! 👋</h1>
                <p style={{ color: '#666' }}>
                    Chào mừng bạn quay trở lại với hệ thống quản lý lớp học{' '}
                    <b>{currentClassName}</b>.
                </p>
            </div>

            {}
            <div className="ranking-cards">
                <div className="rank-card" style={{ borderTop: '4px solid var(--primary-color)' }}>
                    <h3>Vai trò</h3>
                    <p className="points">{user?.role_display}</p>
                </div>
                {}
            </div>

            <div
                style={{
                    marginTop: '30px',
                    padding: '20px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                }}
            >
                <h3>📌 Hướng dẫn nhanh</h3>
                <ul style={{ paddingLeft: '20px', color: '#555', lineHeight: '1.6' }}>
                    <li>
                        Sử dụng <b>Sidebar bên trái</b> để di chuyển giữa các trang.
                    </li>
                    <li>
                        Bạn có thể đóng/mở Sidebar bằng nút mũi tên để mở rộng không gian làm việc.
                    </li>
                    {user?.role === 'group_leader' && (
                        <li>
                            Bạn là <b>Tổ trưởng</b>: Hãy vào mục "Sổ theo dõi" để ghi nhận vi phạm.
                        </li>
                    )}
                    {user?.role === 'student' && (
                        <li>Bạn có thể xem điểm thi đua của mình tại mục "Hạnh kiểm cá nhân".</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default DashboardPage;
