import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/StudentManager.css';

const ROLES = [
    { id: 2, name: 'Lớp trưởng' },
    { id: 3, name: 'Lớp phó học tập' },
    { id: 4, name: 'Lớp phó lao động' },
    { id: 5, name: 'Tổ trưởng' },
    { id: 7, name: 'Tổ phó' },
    { id: 6, name: 'Học sinh' },
];

const StudentManagerPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const classId = localStorage.getItem('selectedClassId');
    const className = localStorage.getItem('selectedClassName');

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [formData, setFormData] = useState({ full_name: '', group_number: 1, role_id: 6 });

    const canEdit = user?.role !== 'student';

    useEffect(() => {
        if (classId) fetchStudents();
        else navigate('/');
    }, [classId]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users?class_id=${classId}`);
            setStudents(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const groupStats = useMemo(() => {
        const stats: { [key: string]: number } = {};
        students.forEach((s) => {
            const g = s.group_number || 0;
            stats[g] = (stats[g] || 0) + 1;
        });
        return stats;
    }, [students]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !classId) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('class_id', classId);

        try {
            await api.post('/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('Nhập danh sách thành công!');
            fetchStudents();
        } catch (error) {
            alert('Lỗi khi nhập file!');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEdit = (student: any) => {
        setEditingStudent(student);
        setFormData({
            full_name: student.full_name,
            group_number: student.group_number,
            role_id: student.role_id,
        });
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingStudent(null);
        setFormData({ full_name: '', group_number: 1, role_id: 6 });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingStudent) {
                await api.put(`/users/${editingStudent.id}`, formData);
                alert('Cập nhật thành công!');
            } else {
                await api.post('/users/create', { ...formData, class_id: classId });
                alert('Thêm mới thành công!');
            }
            setShowModal(false);
            fetchStudents();
        } catch (e) {
            alert('Đã có lỗi xảy ra');
        }
    };

    const getRoleClass = (roleId: number) => {
        if (roleId === 2) return 'monitor';
        if (roleId === 5) return 'group-leader';
        return 'student';
    };

    return (
        <div className="student-manager-container">
            {canEdit && (
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                />
            )}

            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <button
                        className="btn"
                        onClick={() => navigate('/')}
                        style={{
                            background: '#6c757d',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        ⬅️ Quay lại
                    </button>
                    <h2 style={{ margin: 0 }}>Quản lý Lớp {className}</h2>
                </div>

                {}
                {canEdit && (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            className="btn"
                            onClick={handleImportClick}
                            style={{
                                background: '#17a2b8',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                            }}
                        >
                            📥 Nhập Excel
                        </button>

                        <button className="btn btn-success" onClick={handleAddNew}>
                            + Thêm Học Sinh
                        </button>
                    </div>
                )}
            </div>

            <div className="stats-bar">
                <strong style={{ marginRight: 10 }}>Quân số:</strong>
                {Object.keys(groupStats)
                    .sort()
                    .map((g) => (
                        <span key={g} className="stat-item">
                            {g == '0' ? 'Chưa xếp tổ' : `Tổ ${g}`}: <b>{groupStats[g]}</b>
                        </span>
                    ))}
                <span
                    className="stat-item"
                    style={{ background: '#fff3cd', color: '#856404', marginLeft: 'auto' }}
                >
                    Tổng: <b>{students.length}</b> HS
                </span>
            </div>

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <table className="student-table">
                    <thead>
                        <tr>
                            <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                            <th>Họ và Tên</th>
                            <th style={{ width: 80, textAlign: 'center' }}>Tổ</th>
                            <th style={{ width: 150 }}>Vai Trò</th>
                            <th style={{ width: 120 }}>Trạng Thái</th>
                            {}
                            {canEdit && <th style={{ textAlign: 'right' }}>Hành động</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={canEdit ? 6 : 5}
                                    style={{ textAlign: 'center', padding: 20 }}
                                >
                                    Chưa có học sinh nào.
                                </td>
                            </tr>
                        ) : (
                            students.map((s, index) => (
                                <tr key={s.id}>
                                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                    <td style={{ fontWeight: 500 }}>{s.full_name}</td>
                                    <td
                                        style={{
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            color: '#007bff',
                                        }}
                                    >
                                        {s.group_number || '-'}
                                    </td>
                                    <td>
                                        <span className={`role-badge ${getRoleClass(s.role_id)}`}>
                                            {s.role_name || 'Học sinh'}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            color: s.is_locked ? 'red' : 'green',
                                            fontSize: 13,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {s.is_locked ? '🚫 Đã khóa' : '✅ Hoạt động'}
                                    </td>

                                    {}
                                    {canEdit && (
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn btn-primary"
                                                style={{ marginRight: 5 }}
                                                onClick={() => handleEdit(s)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                className={`btn ${s.is_locked ? 'btn-success' : 'btn-warning'}`}
                                                style={{ minWidth: 60 }}
                                                onClick={async () => {
                                                    if (
                                                        window.confirm(
                                                            `Bạn có chắc muốn ${s.is_locked ? 'mở' : 'khóa'} tài khoản này?`
                                                        )
                                                    ) {
                                                        await api.put(`/users/${s.id}`, {
                                                            is_locked: !s.is_locked,
                                                        });
                                                        fetchStudents();
                                                    }
                                                }}
                                            >
                                                {s.is_locked ? 'Mở' : 'Khóa'}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {}
            {showModal && canEdit && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ marginTop: 0, marginBottom: 20, color: '#343a40' }}>
                            {editingStudent ? 'Cập Nhật Thông Tin' : 'Thêm Học Sinh Mới'}
                        </h3>

                        <div className="form-group">
                            <label>
                                Họ và Tên <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                className="form-control"
                                value={formData.full_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, full_name: e.target.value })
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Thuộc Tổ (Nhập số)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formData.group_number}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        group_number: parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Vai Trò</label>
                            <select
                                className="form-control"
                                value={formData.role_id}
                                onChange={(e) =>
                                    setFormData({ ...formData, role_id: parseInt(e.target.value) })
                                }
                            >
                                {ROLES.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: 25 }}>
                            <button
                                className="btn"
                                style={{ marginRight: 10, background: '#e9ecef', color: '#333' }}
                                onClick={() => setShowModal(false)}
                            >
                                Hủy bỏ
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                {editingStudent ? 'Lưu Thay Đổi' : 'Thêm Mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default StudentManagerPage;
