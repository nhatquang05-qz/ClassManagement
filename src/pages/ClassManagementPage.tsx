import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/Dashboard.css';

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
    const [schoolYear, setSchoolYear] = useState('2024-2025');
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
        setSchoolYear('2024-2025');
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
        if (!className) return alert('Chưa nhập tên lớp');

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
        if (!window.confirm('Xóa lớp này sẽ xóa toàn bộ dữ liệu sổ điểm. Bạn chắc chứ?')) return;
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
        <div className="container" style={{ padding: 20 }}>
            <h1>QUẢN LÝ LỚP HỌC</h1>
            <button className="btn-submit" onClick={handleOpenCreate}>
                + Thêm Lớp Mới
            </button>

            <div
                className="class-grid"
                style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}
            >
                {classes.map((cls) => (
                    <div
                        key={cls.id}
                        className="card"
                        style={{
                            padding: 20,
                            border: '1px solid #ddd',
                            width: 280,
                            cursor: 'pointer',
                            position: 'relative',
                            backgroundColor: '#fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                        onClick={() => handleSelectClass(cls)}
                    >
                        <h2 style={{ color: '#2196f3', marginTop: 0 }}>{cls.name}</h2>
                        <p style={{ margin: '5px 0' }}>
                            Năm học: <b>{cls.school_year}</b>
                        </p>

                        {}
                        <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#666' }}>
                            Ngày bắt đầu:{' '}
                            {cls.start_date
                                ? new Date(cls.start_date).toLocaleDateString('vi-VN')
                                : '(Chưa đặt)'}
                        </p>

                        <div
                            style={{
                                marginTop: 15,
                                display: 'flex',
                                gap: 10,
                                justifyContent: 'flex-end',
                            }}
                        >
                            {}
                            <button
                                style={{
                                    backgroundColor: '#ff9800',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                }}
                                onClick={(e) => handleOpenEdit(cls, e)}
                            >
                                Sửa
                            </button>

                            {}
                            <button
                                style={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                }}
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

            {}
            {showModal && (
                <div
                    className="modal-overlay"
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
                        className="modal-content"
                        style={{ background: 'white', padding: 30, borderRadius: 8, width: 400 }}
                    >
                        <h3 style={{ marginTop: 0 }}>
                            {isEditing ? 'Cập Nhật Lớp' : 'Thêm Lớp Mới'}
                        </h3>

                        <div style={{ marginBottom: 15 }}>
                            <label
                                style={{ fontWeight: 'bold', display: 'block', marginBottom: 5 }}
                            >
                                Tên Lớp (VD: 12A1):
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 8,
                                    border: '1px solid #ccc',
                                    borderRadius: 4,
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 15 }}>
                            <label
                                style={{ fontWeight: 'bold', display: 'block', marginBottom: 5 }}
                            >
                                Năm Học:
                            </label>
                            <select
                                className="form-control"
                                value={schoolYear}
                                onChange={(e) => setSchoolYear(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 8,
                                    border: '1px solid #ccc',
                                    borderRadius: 4,
                                    boxSizing: 'border-box',
                                }}
                            >
                                <option>2023-2024</option>
                                <option>2024-2025</option>
                                <option>2025-2026</option>
                            </select>
                        </div>

                        {}
                        <div style={{ marginBottom: 20 }}>
                            <label
                                style={{ fontWeight: 'bold', display: 'block', marginBottom: 5 }}
                            >
                                Ngày Khai Giảng (Tuần 1):
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 8,
                                    border: '1px solid #ccc',
                                    borderRadius: 4,
                                    boxSizing: 'border-box',
                                }}
                            />
                            <small
                                style={{
                                    color: '#666',
                                    display: 'block',
                                    marginTop: 5,
                                    fontStyle: 'italic',
                                    fontSize: '0.85em',
                                }}
                            >
                                * Tuần 1 sẽ bắt đầu từ ngày này. <br />
                                Ví dụ: Chọn Thứ 5 (05/09), Tuần 1 là từ Thứ 5 đến Chủ Nhật (08/09).
                            </small>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '8px 15px',
                                    cursor: 'pointer',
                                    background: '#eee',
                                    border: 'none',
                                    borderRadius: 4,
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn-submit"
                                onClick={handleSaveClass}
                                style={{
                                    padding: '8px 15px',
                                    cursor: 'pointer',
                                    background: '#2196f3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 4,
                                }}
                            >
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
