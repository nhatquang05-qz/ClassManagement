import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import {
    FaClipboardList,
    FaTrophy,
    FaBroom,
    FaChartBar,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaArrowRight,
    FaBookOpen,
    FaQuestionCircle,
} from 'react-icons/fa';
import '../assets/styles/Dashboard.css';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { selectedClass } = useClass();
    const navigate = useNavigate();

    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

    const guides = [
        {
            title: 'Chấm Sổ Theo Dõi',
            icon: <FaClipboardList className="guide-icon color-blue" />,
            role: ['monitor', 'group_leader', 'teacher', 'admin'],
            desc: 'Dành cho Tổ trưởng & Lớp trưởng. Ghi nhận vi phạm, điểm cộng/trừ hàng ngày.',
            link: '/tracking',
        },
        {
            title: 'Phân Công Trực Nhật',
            icon: <FaBroom className="guide-icon color-green" />,
            role: ['vice_monitor_labor', 'teacher', 'admin'],
            desc: 'Dành cho Lớp phó lao động. Phân lịch trực tuần và ghi nhận vi phạm vệ sinh.',
            link: '/duty',
        },
        {
            title: 'Xem Bảng Xếp Hạng',
            icon: <FaTrophy className="guide-icon color-yellow" />,
            role: ['all'],
            desc: 'Xem thi đua giữa các tổ. Cập nhật tự động dựa trên sổ theo dõi.',
            link: '/ranking',
        },
        {
            title: 'Quản Lý Học Sinh',
            icon: <FaUserGraduate className="guide-icon color-purple" />,
            role: ['teacher', 'admin'],
            desc: 'Thêm, sửa, xóa học sinh. Phân tổ và đặt lại mật khẩu.',
            link: '/students',
        },
    ];

    return (
        <div className="dashboard-container">
            {}
            <div className="welcome-banner">
                <div className="welcome-text">
                    <h1>Xin chào, {user?.full_name}! 👋</h1>
                    <p>
                        Chào mừng bạn quay trở lại hệ thống quản lý lớp học.
                        {selectedClass
                            ? ` Bạn đang làm việc với lớp ${selectedClass.name}.`
                            : ' Hãy chọn một lớp để bắt đầu.'}
                    </p>
                </div>
                <div className="welcome-role-badge">
                    {isTeacher ? <FaChalkboardTeacher /> : <FaUserGraduate />}
                    <span>{user?.role_display || 'Thành viên'}</span>
                </div>
            </div>

            {}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-blue-light">
                        <FaClipboardList />
                    </div>
                    <div className="stat-info">
                        <h3>Sổ Theo Dõi</h3>
                        <p>Ghi chép nề nếp</p>
                    </div>
                    <button onClick={() => navigate('/tracking')} className="stat-btn">
                        Truy cập <FaArrowRight />
                    </button>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-yellow-light">
                        <FaTrophy />
                    </div>
                    <div className="stat-info">
                        <h3>Xếp Hạng</h3>
                        <p>Thi đua tuần</p>
                    </div>
                    <button onClick={() => navigate('/ranking')} className="stat-btn">
                        Xem ngay <FaArrowRight />
                    </button>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-green-light">
                        <FaBroom />
                    </div>
                    <div className="stat-info">
                        <h3>Trực Nhật</h3>
                        <p>Vệ sinh lớp học</p>
                    </div>
                    <button onClick={() => navigate('/duty')} className="stat-btn">
                        Kiểm tra <FaArrowRight />
                    </button>
                </div>
                {isTeacher && (
                    <div className="stat-card">
                        <div className="stat-icon bg-purple-light">
                            <FaChartBar />
                        </div>
                        <div className="stat-info">
                            <h3>Báo Cáo</h3>
                            <p>Tổng kết & Xuất file</p>
                        </div>
                        <button onClick={() => navigate('/report')} className="stat-btn">
                            Chi tiết <FaArrowRight />
                        </button>
                    </div>
                )}
            </div>

            {}
            <div className="guide-section">
                <div className="section-header">
                    <h2>
                        <FaBookOpen style={{ color: '#3498db', marginRight: '10px' }} />
                        Các chức năng chính dành cho vai trò của bạn
                    </h2>
                </div>

                <div className="guide-grid">
                    {guides.map((guide, index) => {
                        if (!guide.role.includes('all') && !guide.role.includes(user?.role || '')) {
                            return null;
                        }

                        return (
                            <div
                                key={index}
                                className="guide-card"
                                onClick={() => navigate(guide.link)}
                            >
                                <div className="guide-card-header">
                                    {guide.icon}
                                    <h4>{guide.title}</h4>
                                </div>
                                <p className="guide-desc">{guide.desc}</p>
                                <div className="guide-footer">
                                    <span>Tìm hiểu thêm</span>
                                    <FaArrowRight size={12} />
                                </div>
                            </div>
                        );
                    })}

                    {}
                    <div className="guide-card support-card" onClick={() => navigate('/support')}>
                        <div className="guide-card-header">
                            <FaQuestionCircle className="guide-icon color-gray" />
                            <h4>Hỗ trợ kỹ thuật</h4>
                        </div>
                        <p className="guide-desc">
                            Gặp sự cố? Bấm vào đây để báo cáo vấn đề cho Admin.
                        </p>
                        <div className="guide-footer">
                            <span>Gửi yêu cầu</span>
                            <FaArrowRight size={12} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
