import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/Dashboard.css';

const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [currentClassName] = useState(localStorage.getItem('selectedClassName') || 'Lớp Học');

    useEffect(() => {
        if (user?.role === 'teacher' || user?.role === 'admin') {
            const classId = localStorage.getItem('selectedClassId');
            if (!classId) {
                navigate('/classes');
            }
        }
    }, [user, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('selectedClassId');
        localStorage.removeItem('selectedClassName');
        logout();
    };

    const handleChangeClass = () => {
        localStorage.removeItem('selectedClassId');
        localStorage.removeItem('selectedClassName');
        navigate('/classes');
    };

    return (
        <div
            className="dashboard-container"
            style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}
        >
            <header
                className="dashboard-header"
                style={{ marginBottom: '40px', textAlign: 'center' }}
            >
                <h1 style={{ color: '#1e293b', marginBottom: '10px' }}>{currentClassName}</h1>
                <div className="user-info">
                    <span>
                        Xin chào, <b>{user?.full_name}</b> ({user?.role_display})
                    </span>
                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <button
                            onClick={handleChangeClass}
                            className="logout-btn"
                            style={{ marginRight: 10, backgroundColor: '#2196f3' }}
                        >
                            ↻ Đổi lớp
                        </button>
                    )}
                    <button onClick={handleLogout} className="logout-btn">
                        Đăng xuất
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <section
                    className="actions-section"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '20px',
                    }}
                >
                    {}
                    <Link
                        to="/ranking"
                        className="action-card"
                        style={{
                            borderLeft: '5px solid #eab308',
                            backgroundColor: '#fffbeb',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '20px',
                            textDecoration: 'none',
                            color: '#333',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            transition: 'transform 0.2s',
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginRight: '15px' }}>🏆</div>
                        <div>
                            <h3 style={{ margin: 0, color: '#b45309' }}>Bảng xếp hạng</h3>
                        </div>
                    </Link>

                    {}
                    <Link
                        to="/my-record"
                        className="action-card"
                        style={{ borderLeft: '5px solid #4caf50' }}
                    >
                        👤 Xem thông tin cá nhân
                    </Link>

                    {(user?.role === 'group_leader' ||
                        user?.role === 'vice_group_leader' ||
                        user?.role === 'monitor' ||
                        user?.role === 'admin' ||
                        user?.role === 'student') && (
                        <Link
                            to="/tracking"
                            className="action-card"
                            style={{ borderLeft: '5px solid #2196f3' }}
                        >
                            📝 Sổ theo dõi
                        </Link>
                    )}

                    {(user?.role === 'admin' ||
                        user?.role === 'monitor' ||
                        user?.role === 'teacher') && (
                        <Link
                            to="/report"
                            className="action-card"
                            style={{ borderLeft: '5px solid #ff9800' }}
                        >
                            📊 Báo cáo tổng hợp
                        </Link>
                    )}

                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <Link
                            to="/students"
                            className="action-card"
                            style={{ borderLeft: '5px solid #9c27b0' }}
                        >
                            👥 Danh sách học sinh
                        </Link>
                    )}
                </section>
            </main>
        </div>
    );
};

export default DashboardPage;
