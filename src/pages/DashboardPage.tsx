import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import api from '../utils/api';
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
    FaCircle,
} from 'react-icons/fa';
import '../assets/styles/Dashboard.css';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { selectedClass } = useClass();
    const navigate = useNavigate();

    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

    const [classMembers, setClassMembers] = useState<any[]>([]);

    const isUserOnline = (lastActiveAt: string | null) => {
        if (!lastActiveAt) return false;

        let dateString = lastActiveAt;

        if (dateString.includes(' ')) {
            dateString = dateString.replace(' ', 'T');
        }

        if (!dateString.endsWith('Z') && !dateString.includes('+')) {
            dateString += 'Z';
        }

        const lastActive = new Date(dateString).getTime();
        const now = new Date().getTime();

        const fiveMinutes = 5 * 60 * 1000;

        const diff = now - lastActive;

        return diff < fiveMinutes && diff > -fiveMinutes;
    };

    useEffect(() => {
        const fetchMembers = async () => {
            if (selectedClass?.id) {
                try {
                    const res = await api.get('/users', {
                        params: {
                            class_id: selectedClass.id,
                            _t: new Date().getTime(),
                        },
                    });
                    if (Array.isArray(res.data)) {
                        setClassMembers(res.data);
                    }
                } catch (error) {
                    console.error('Lỗi tải thành viên:', error);
                }
            }
        };

        fetchMembers();

        const interval = setInterval(fetchMembers, 10000);

        return () => clearInterval(interval);
    }, [selectedClass?.id]);

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

            {}
            {selectedClass && (
                <div
                    className="active-members-section"
                    style={{
                        marginTop: '40px',
                        background: '#fff',
                        padding: '25px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    }}
                >
                    <div
                        className="section-header"
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            borderBottom: '1px solid #eee',
                            paddingBottom: '10px',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: '18px',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            <FaCircle style={{ color: '#2ecc71', fontSize: '12px' }} />
                            Trạng thái thành viên ({classMembers.length})
                        </h2>
                    </div>

                    <div
                        className="members-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '15px',
                        }}
                    >
                        {classMembers.length > 0 ? (
                            classMembers

                                .sort((a, b) => {
                                    const onlineA =
                                        isUserOnline(a.last_active_at) || a.id === user?.id;
                                    const onlineB =
                                        isUserOnline(b.last_active_at) || b.id === user?.id;
                                    return Number(onlineB) - Number(onlineA);
                                })
                                .map((member) => {
                                    const online = isUserOnline(member.last_active_at);

                                    const isMe = user?.id === member.id;
                                    const showOnline = online || isMe;

                                    return (
                                        <div
                                            key={member.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px',
                                                borderRadius: '10px',
                                                background: '#f8f9fa',
                                                border: showOnline
                                                    ? '1px solid #2ecc71'
                                                    : '1px solid #eee',
                                                transition: 'all 0.2s ease',
                                                opacity: showOnline ? 1 : 0.6,
                                            }}
                                        >
                                            <div style={{ position: 'relative' }}>
                                                <div
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: `linear-gradient(135deg, ${
                                                            [
                                                                '#FF9A9E',
                                                                '#FECFEF',
                                                                '#A18CD1',
                                                                '#FBC2EB',
                                                                '#84FAB0',
                                                            ][member.id % 5]
                                                        } 0%, #fff 100%)`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        color: '#555',
                                                        fontSize: '16px',
                                                    }}
                                                >
                                                    {member.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                                {}
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        right: 0,
                                                        width: '12px',
                                                        height: '12px',
                                                        borderRadius: '50%',
                                                        background: showOnline ? '#2ecc71' : '#ccc',
                                                        border: '2px solid #fff',
                                                    }}
                                                ></span>
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        color: '#333',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {member.full_name} {isMe && '(Bạn)'}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '11px',
                                                        color: showOnline ? '#2ecc71' : '#999',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                    }}
                                                >
                                                    {showOnline ? 'Đang truy cập' : 'Ngoại tuyến'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        ) : (
                            <p style={{ color: '#888', fontStyle: 'italic' }}>
                                Chưa có thành viên nào.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
