import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/ClassManagement.css';

interface ClassItem {
    id: number;
    name: string;
    school_year: string;
    start_date?: string;
}

const ClassManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassItem[]>([]);
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
        } catch (error) {
            console.error('Lỗi tải lớp', error);
        }
    };

    const resetForm = () => {
        setClassName('');
        setSchoolYear('');
        setStartDate('');
        setIsEditing(false);
        setEditingClassId(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEdit = (cls: ClassItem, e: React.MouseEvent) => {
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
                alert('Cập nhật thành công!');
            } else {
                await api.post('/classes', payload);
                alert('Thêm lớp thành công!');
            }
            setShowModal(false);
            resetForm();
            fetchClasses();
        } catch (error) {
            console.error(error);
            alert('Lỗi lưu thông tin lớp');
        }
    };

    const handleDeleteClass = async (id: number) => {
        if (
            !window.confirm(
                'CẢNH BÁO: Xóa lớp sẽ xóa toàn bộ sổ điểm và dữ liệu liên quan. Bạn chắc chắn chứ?'
            )
        )
            return;
        try {
            await api.delete(`/classes/${id}`);
            fetchClasses();
        } catch (error) {
            alert('Lỗi xóa lớp');
        }
    };

    const handleSelectClass = (cls: ClassItem) => {
        localStorage.setItem('selectedClassId', cls.id.toString());
        localStorage.setItem('selectedClassName', cls.name);
        localStorage.setItem('currentClass', JSON.stringify(cls));
        navigate('/');
    };

    return (
        <div className="class-mgmt-container">
            <h1 className="page-title">QUẢN LÝ LỚP HỌC</h1>

            {}
            <button className="btn btn-primary" onClick={handleOpenCreate}>
                <span>+</span> Thêm Lớp Mới
            </button>

            <div className="class-grid">
                {classes.map((cls) => (
                    <div key={cls.id} className="class-card" onClick={() => handleSelectClass(cls)}>
                        <h2 className="class-name">{cls.name}</h2>
                        <p className="class-info">
                            Niên khóa: <b>{cls.school_year}</b>
                        </p>
                        <p className="start-date-info">
                            📅 Khai giảng:{' '}
                            {cls.start_date
                                ? new Date(cls.start_date).toLocaleDateString('vi-VN')
                                : '(Chưa thiết lập)'}
                        </p>
                        <div className="card-actions">
                            {}
                            <button
                                className="btn btn-warning"
                                onClick={(e) => handleOpenEdit(cls, e)}
                            >
                                Sửa
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClass(cls.id);
                                }}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">
                            {isEditing ? 'Cập Nhật Lớp' : 'Thêm Lớp Mới'}
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Tên Lớp (VD: 12A1):</label>
                            {}
                            <input
                                type="text"
                                className="form-control"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                placeholder="Nhập tên lớp..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Niên Khóa:</label>
                            <input
                                type="text"
                                className="form-control"
                                value={schoolYear}
                                onChange={(e) => setSchoolYear(e.target.value)}
                                placeholder="VD: 2024-2025"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Ngày Bắt Đầu Năm Học (Tuần 1):</label>
                            <input
                                type="date"
                                className="form-control"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <small className="form-hint">
                                * Tuần 1 sẽ bắt đầu từ ngày này đến hết Chủ Nhật cùng tuần.
                            </small>
                        </div>

                        <div className="modal-actions">
                            {}
                            <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                                Hủy
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveClass}>
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassManagementPage;
