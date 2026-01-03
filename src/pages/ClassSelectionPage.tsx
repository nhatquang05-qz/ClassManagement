import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/ClassSelection.css';

import { FaPlus, FaEdit, FaChalkboardTeacher, FaCalendarAlt, FaRocket } from 'react-icons/fa';

interface ClassItem {
    id: number;
    name: string;
    school_year: string;
    start_date?: string;
}

const ClassSelectionPage = () => {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const { setSelectedClass } = useClass();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingClassId, setEditingClassId] = useState<number | null>(null);

    const [className, setClassName] = useState('');
    const [schoolYear, setSchoolYear] = useState('');
    const [startDate, setStartDate] = useState('');

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

    const resetForm = () => {
        setClassName('');
        setSchoolYear('2024-2025');
        setStartDate('');
        setIsEditing(false);
        setEditingClassId(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEdit = (e: React.MouseEvent, cls: ClassItem) => {
        e.stopPropagation();
        setClassName(cls.name);
        setSchoolYear(cls.school_year);
        setStartDate(cls.start_date ? cls.start_date.split('T')[0] : '');
        setIsEditing(true);
        setEditingClassId(cls.id);
        setShowModal(true);
    };

    const handleSaveClass = async () => {
        if (!className || !schoolYear) return alert('Vui lòng nhập tên lớp và niên khóa!');

        try {
            const payload = {
                name: className,
                school_year: schoolYear,
                start_date: startDate || null,
            };

            if (isEditing && editingClassId) {
                await api.put(`/classes/${editingClassId}`, payload);
                alert('Cập nhật lớp thành công!');
            } else {
                await api.post('/classes', payload);
                alert('Tạo lớp thành công!');
            }

            setShowModal(false);
            resetForm();
            fetchClasses();
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi lưu thông tin lớp.');
        }
    };

    const handleSelectClass = (cls: ClassItem) => {
        setSelectedClass(cls);
        localStorage.setItem('selectedClassId', cls.id.toString());
        localStorage.setItem('selectedClassName', cls.name);
        localStorage.setItem('currentClass', JSON.stringify(cls));
        navigate('/');
    };

    const handleManageStudents = (e: React.MouseEvent, cls: ClassItem) => {
        e.stopPropagation();
        localStorage.setItem('selectedClassId', cls.id.toString());
        localStorage.setItem('selectedClassName', cls.name);
        localStorage.setItem('currentClass', JSON.stringify(cls));
        navigate('/students');
    };

    return (
        <div className="class-selection-content">
            <div className="page-header-simple">
                <div>
                    <h2 style={{ margin: 0, color: 'var(--text-color)' }}>Danh Sách Lớp Học</h2>
                    <p style={{ color: '#666', marginTop: '5px' }}>
                        Quản lý và chọn lớp để làm việc
                    </p>
                </div>
                <button className="btn btn-primary" onClick={handleOpenCreate}>
                    <FaPlus /> Tạo Lớp Mới
                </button>
            </div>

            {classes.length === 0 ? (
                <div className="empty-state">
                    <div style={{ fontSize: 50, marginBottom: 20 }}>🚀</div>
                    <h3>Chưa có lớp học nào</h3>
                    <p>Hãy tạo lớp học đầu tiên ngay bây giờ.</p>
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
                                    <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
                                        Lớp {cls.name}
                                    </h3>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                        Niên khóa: {cls.school_year}
                                    </span>
                                </div>
                                <button
                                    className="btn-icon-only"
                                    title="Chỉnh sửa"
                                    onClick={(e) => handleOpenEdit(e, cls)}
                                >
                                    <FaEdit />
                                </button>
                            </div>

                            <div className="card-stats">
                                <div className="stat-item">
                                    <FaCalendarAlt className="icon-small" />
                                    <b>{cls.school_year}</b>
                                </div>
                                <div className="stat-item">
                                    <FaRocket className="icon-small" />
                                    {cls.start_date ? (
                                        `Khai giảng: ${new Date(cls.start_date).toLocaleDateString('vi-VN')}`
                                    ) : (
                                        <span style={{ fontStyle: 'italic', color: '#999' }}>
                                            Chưa set ngày
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="card-actions">
                                <button className="btn btn-outline btn-sm">Vào Sổ</button>
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={(e) => handleManageStudents(e, cls)}
                                >
                                    <FaChalkboardTeacher /> Học Sinh
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h3 className="modal-title">
                            {isEditing ? 'Cập Nhật Lớp' : 'Thêm Lớp Mới'}
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Tên Lớp</label>
                            <input
                                type="text"
                                className="form-control"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                placeholder="VD: 12A1"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Năm Học</label>
                            <input
                                type="text"
                                className="form-control"
                                value={schoolYear}
                                onChange={(e) => setSchoolYear(e.target.value)}
                                placeholder="VD: 2024-2025"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Ngày Khai Giảng (Tuần 1)</label>
                            <input
                                type="date"
                                className="form-control"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <small className="form-hint">
                                * Tuần 1 sẽ được tính bắt đầu từ ngày này.
                            </small>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                                Hủy
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveClass}>
                                {isEditing ? 'Cập Nhật' : 'Tạo Lớp'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassSelectionPage;
