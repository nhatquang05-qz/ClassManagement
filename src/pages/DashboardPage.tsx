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
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>{currentClassName}</h1>

                <div
                    className="user-info"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    <span>
                        Xin chào, <b>{user?.full_name}</b> ({user?.role_display})
                    </span>

                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <button onClick={handleChangeClass} className="btn btn-primary">
                            ↻ Đổi lớp
                        </button>
                    )}

                    <button onClick={handleLogout} className="btn btn-danger">
                        Đăng xuất
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <section className="actions-section">
                    {}
                    <Link
                        to="/ranking"
                        className="action-card"
                        style={{ borderLeft: '5px solid #eab308', backgroundColor: '#fffbeb' }}
                    >
                        <div style={{ fontSize: '2rem', marginRight: '15px' }}>🏆</div>
                        <div>
                            <h3 style={{ margin: 0, color: '#b45309' }}>Bảng xếp hạng</h3>
                        </div>
                    </Link>

                    {}
                    {user?.role !== 'admin' && user?.role !== 'teacher' && (
                        <Link
                            to="/my-record"
                            className="action-card"
                            style={{ borderLeft: '5px solid #4caf50' }}
                        >
                            👤 Xem thông tin cá nhân
                        </Link>
                    )}

                    {}
                    {(user?.role === 'group_leader' ||
                        user?.role === 'vice_group_leader' ||
                        user?.role === 'vice_moniter_study' ||
                        user?.role === 'vice_moniter_labor' ||
                        user?.role === 'monitor' ||
                        user?.role === 'teacher' ||
                        user?.role === 'admin') && (
                        <Link
                            to="/tracking"
                            className="action-card"
                            style={{ borderLeft: '5px solid #2196f3' }}
                        >
                            📝 Sổ theo dõi
                        </Link>
                    )}

                    {}
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

                    {}
                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <Link
                            to="/students"
                            className="action-card"
                            style={{ borderLeft: '5px solid #9c27b0' }}
                        >
                            👥 Danh sách học sinh
                        </Link>
                    )}

                    {}
                </section>
            </main>
        </div>
    );
};

export default DashboardPage;
