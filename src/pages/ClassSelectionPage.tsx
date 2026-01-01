import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/ClassSelection.css';

interface ClassItem {
    id: number;
    name: string;
    school_year: string;
}

const ClassSelectionPage = () => {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const { setSelectedClass } = useClass();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newSchoolYear, setNewSchoolYear] = useState('2024-2025');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data);
        } catch (err) {
            console.error('Lỗi tải lớp', err);
        }
    };

    const handleSelectClass = (cls: ClassItem) => {
        setSelectedClass(cls);
        localStorage.setItem('selectedClassId', cls.id.toString());
        localStorage.setItem('selectedClassName', cls.name);
        navigate('/');
    };

    const handleManageStudents = (e: React.MouseEvent, cls: ClassItem) => {
        e.stopPropagation();
        localStorage.setItem('selectedClassId', cls.id.toString());
        localStorage.setItem('selectedClassName', cls.name);
        navigate('/students');
    };

    const handleCreateClass = async () => {
        if (!newClassName) return alert('Vui lòng nhập tên lớp');
        try {
            await api.post('/classes', { name: newClassName, school_year: newSchoolYear });
            alert('Tạo lớp thành công!');
            setShowModal(false);
            setNewClassName('');
            fetchClasses();
        } catch (error) {
            alert('Lỗi khi tạo lớp');
        }
    };

    return (
        <div className="dashboard-layout">
            {}
            <aside className="sidebar">
                <div className="logo-area">
                    <span>⚡ ClassManager</span>
                </div>
                <div className="menu-item active">
                    <span>📚</span> Danh Sách Lớp
                </div>
                <div className="menu-item">
                    <span>⚙️</span> Cài Đặt
                </div>
            </aside>

            <main className="main-content">
                <header className="page-header">
                    <div className="welcome-text">
                        <h1>Xin chào, {user?.full_name}!</h1>
                        <p>Chọn lớp học để bắt đầu làm việc.</p>
                    </div>
                    {}
                    <button className="btn-create" onClick={() => setShowModal(true)}>
                        <span>+</span> Tạo Lớp Mới
                    </button>
                </header>

                {classes.length === 0 ? (
                    <div className="empty-state">
                        <div style={{ fontSize: 50, marginBottom: 20 }}>🚀</div>
                        <h3 style={{ color: '#333' }}>Chưa có lớp học nào</h3>
                        <p style={{ color: '#94a3b8' }}>Hãy tạo lớp học đầu tiên ngay bây giờ.</p>
                    </div>
                ) : (
                    <div className="class-grid">
                        {classes.map((cls) => (
                            <div
                                key={cls.id}
                                className="glass-card"
                                onClick={() => handleSelectClass(cls)}
                            >
                                <div className="card-header">
                                    <div className="card-info">
                                        <h2>Lớp {cls.name}</h2>
                                        <span>Niên khóa: {cls.school_year}</span>
                                    </div>
                                    <div className="class-icon-box">🎓</div>
                                </div>

                                <div className="card-stats">
                                    <div className="stat-item">
                                        <span>📅</span> <b>{cls.school_year}</b>
                                    </div>
                                    <div className="stat-item">
                                        <span>ID:</span> <b>{cls.id}</b>
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <button className="btn-action primary">Vào Sổ</button>
                                    <button
                                        className="btn-action"
                                        onClick={(e) => handleManageStudents(e, cls)}
                                    >
                                        Học Sinh
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            padding: 30,
                            borderRadius: 16,
                            width: 400,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        }}
                    >
                        <h3
                            style={{
                                color: '#111827',
                                marginTop: 0,
                                marginBottom: 20,
                                fontSize: 20,
                            }}
                        >
                            Thêm Lớp Mới
                        </h3>

                        <div style={{ marginBottom: 15 }}>
                            <label
                                style={{
                                    color: '#4b5563',
                                    display: 'block',
                                    marginBottom: 8,
                                    fontSize: 14,
                                    fontWeight: 500,
                                }}
                            >
                                Tên Lớp
                            </label>
                            <input
                                type="text"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="VD: 12A1"
                                style={{
                                    width: '100%',
                                    padding: 10,
                                    borderRadius: 8,
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    color: '#111827',
                                    fontSize: 15,
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 30 }}>
                            <label
                                style={{
                                    color: '#4b5563',
                                    display: 'block',
                                    marginBottom: 8,
                                    fontSize: 14,
                                    fontWeight: 500,
                                }}
                            >
                                Năm Học
                            </label>
                            <select
                                value={newSchoolYear}
                                onChange={(e) => setNewSchoolYear(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 10,
                                    borderRadius: 8,
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    color: '#111827',
                                    fontSize: 15,
                                }}
                            >
                                <option>2023-2024</option>
                                <option>2024-2025</option>
                                <option>2025-2026</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: '1px solid #e5e7eb',
                                    background: 'white',
                                    color: '#4b5563',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateClass}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#2563eb',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                                }}
                            >
                                Tạo Lớp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassSelectionPage;
