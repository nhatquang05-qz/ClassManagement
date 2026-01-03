import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClass } from '../../contexts/ClassContext';
import '../../assets/styles/MainLayout.css';
import ClassManagerModal from '../classes/ClassManagerModal';

import {
    FaHome,
    FaTrophy,
    FaUser,
    FaClipboardList,
    FaChartBar,
    FaUsers,
    FaSignOutAlt,
    FaBars,
    FaChevronLeft,
    FaChevronRight,
    FaExchangeAlt,
} from 'react-icons/fa';

const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const { selectedClass } = useClass();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [isClassModalOpen, setIsClassModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const isActive = (path: string) => (location.pathname === path ? 'active' : '');

    const handleClassClick = () => {
        if (user?.role === 'teacher' || user?.role === 'admin') {
            setIsClassModalOpen(true);
        }
    };

    return (
        <div className={`main-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="app-logo">⚡ ClassManager</div>
                    <button className="btn-toggle-sidebar" onClick={toggleSidebar}>
                        {isSidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
                    </button>
                </div>

                <div className="user-profile-summary">
                    <div className="avatar-circle">{user?.full_name?.charAt(0) || 'U'}</div>
                    {isSidebarOpen && (
                        <div className="user-info-text">
                            <span className="u-name">{user?.full_name}</span>
                            <span className="u-role">{user?.role_display}</span>
                        </div>
                    )}
                </div>

                {}
                {isSidebarOpen &&
                    (user?.role === 'teacher' || user?.role === 'admin' || selectedClass) && (
                        <div
                            className={`current-class-badge ${user?.role === 'teacher' || user?.role === 'admin' ? 'clickable' : ''}`}
                            onClick={handleClassClick}
                            title={
                                user?.role === 'teacher' || user?.role === 'admin'
                                    ? 'Bấm để đổi lớp'
                                    : ''
                            }
                        >
                            {selectedClass ? (
                                <>
                                    Lớp: <b>{selectedClass.name}</b>
                                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                                        <FaExchangeAlt
                                            style={{ marginLeft: 8, fontSize: '0.8rem' }}
                                        />
                                    )}
                                </>
                            ) : (
                                <span style={{ color: 'var(--danger-color)', cursor: 'pointer' }}>
                                    + Chọn lớp học...
                                </span>
                            )}
                        </div>
                    )}

                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <Link to="/" className={`nav-item ${isActive('/')}`}>
                                <span className="icon">
                                    <FaHome />
                                </span>
                                {isSidebarOpen && <span className="label">Trang chủ</span>}
                            </Link>
                        </li>

                        <li>
                            <Link to="/ranking" className={`nav-item ${isActive('/ranking')}`}>
                                <span className="icon">
                                    <FaTrophy />
                                </span>
                                {isSidebarOpen && <span className="label">Bảng xếp hạng</span>}
                            </Link>
                        </li>

                        {}
                        {user?.role !== 'admin' && user?.role !== 'teacher' && (
                            <li>
                                <Link
                                    to="/my-record"
                                    className={`nav-item ${isActive('/my-record')}`}
                                >
                                    <span className="icon">
                                        <FaUser />
                                    </span>
                                    {isSidebarOpen && (
                                        <span className="label">Hạnh kiểm cá nhân</span>
                                    )}
                                </Link>
                            </li>
                        )}

                        {(user?.role === 'group_leader' ||
                            user?.role === 'monitor' ||
                            user?.role === 'teacher' ||
                            user?.role === 'admin') && (
                            <li>
                                <Link
                                    to="/tracking"
                                    className={`nav-item ${isActive('/tracking')}`}
                                >
                                    <span className="icon">
                                        <FaClipboardList />
                                    </span>
                                    {isSidebarOpen && <span className="label">Sổ theo dõi</span>}
                                </Link>
                            </li>
                        )}

                        {(user?.role === 'admin' ||
                            user?.role === 'monitor' ||
                            user?.role === 'teacher') && (
                            <li>
                                <Link to="/report" className={`nav-item ${isActive('/report')}`}>
                                    <span className="icon">
                                        <FaChartBar />
                                    </span>
                                    {isSidebarOpen && <span className="label">Báo cáo</span>}
                                </Link>
                            </li>
                        )}

                        {(user?.role === 'teacher' || user?.role === 'admin') && (
                            <li>
                                <Link
                                    to="/students"
                                    className={`nav-item ${isActive('/students')}`}
                                >
                                    <span className="icon">
                                        <FaUsers />
                                    </span>
                                    {isSidebarOpen && <span className="label">DS Học sinh</span>}
                                </Link>
                            </li>
                        )}

                        {}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="nav-item btn-logout">
                        <span className="icon">
                            <FaSignOutAlt />
                        </span>
                        {isSidebarOpen && <span className="label">Đăng xuất</span>}
                    </button>
                </div>
            </aside>

            <main className="main-content-wrapper">
                {!isSidebarOpen && (
                    <button className="btn-float-toggle" onClick={toggleSidebar}>
                        <FaBars />
                    </button>
                )}

                <div className="page-content-container">
                    <Outlet />
                </div>
            </main>

            {}
            <ClassManagerModal
                isOpen={isClassModalOpen}
                onClose={() => setIsClassModalOpen(false)}
            />
        </div>
    );
};

export default MainLayout;
