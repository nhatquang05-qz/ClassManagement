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

    const availableRoles = useMemo(() => {
        const currentStudentId = editingStudent?.id;
        const targetGroup = formData.group_number;

        const usedClassRoles = new Set<number>();
        const usedGroupRoles = new Set<number>();

        students.forEach((s) => {
            if (s.id === currentStudentId) return;

            if ([2, 3, 4].includes(s.role_id)) {
                usedClassRoles.add(s.role_id);
            }

            if (s.group_number === targetGroup && [5, 7].includes(s.role_id)) {
                usedGroupRoles.add(s.role_id);
            }
        });

        return ROLES.filter((role) => {
            if (role.id === 6) return true;

            if ([2, 3, 4].includes(role.id)) {
                return !usedClassRoles.has(role.id);
            }

            if ([5, 7].includes(role.id)) {
                return !usedGroupRoles.has(role.id);
            }

            return true;
        });
    }, [students, formData.group_number, editingStudent]);

    useEffect(() => {
        const isCurrentRoleValid = availableRoles.some((r) => r.id === formData.role_id);
        if (!isCurrentRoleValid) {
            setFormData((prev) => ({ ...prev, role_id: 6 }));
        }
    }, [availableRoles, formData.role_id]);

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
        <div className="sm-container">
            {canEdit && (
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                />
            )}

            <div className="sm-header">
                <div className="sm-header-left">
                    <button className="sm-btn sm-btn-back" onClick={() => navigate('/')}>
                        <span style={{ fontSize: '18px' }}>‹</span> Quay lại
                    </button>
                    <h2 className="sm-title">Quản lý Lớp {className}</h2>
                </div>

                {canEdit && (
                    <div className="sm-header-actions">
                        <button className="sm-btn sm-btn-info" onClick={handleImportClick}>
                            📥 Nhập Excel
                        </button>

                        <button className="sm-btn sm-btn-success" onClick={handleAddNew}>
                            + Thêm Học Sinh
                        </button>
                    </div>
                )}
            </div>

            <div className="sm-stats-bar">
                <strong className="sm-stat-label">Quân số:</strong>
                {Object.keys(groupStats)
                    .sort()
                    .map((g) => (
                        <span key={g} className="sm-stat-item">
                            {g == '0' ? 'Chưa xếp tổ' : `Tổ ${g}`}: <b>{groupStats[g]}</b>
                        </span>
                    ))}
                <span className="sm-stat-item sm-stat-total">
                    Tổng: <b>{students.length}</b> HS
                </span>
            </div>

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div className="sm-table-container">
                    <table className="sm-table">
                        <thead>
                            <tr>
                                <th style={{ width: 60, textAlign: 'center' }}>STT</th>
                                <th>Họ và Tên</th>
                                <th style={{ width: 80, textAlign: 'center' }}>Tổ</th>
                                <th style={{ width: 180 }}>Vai Trò</th>
                                <th style={{ width: 140 }}>Trạng Thái</th>
                                {canEdit && (
                                    <th style={{ textAlign: 'right', paddingRight: 24 }}>
                                        Hành động
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={canEdit ? 6 : 5}
                                        style={{
                                            textAlign: 'center',
                                            padding: 40,
                                            color: '#6c757d',
                                        }}
                                    >
                                        Chưa có học sinh nào.
                                    </td>
                                </tr>
                            ) : (
                                students.map((s, index) => (
                                    <tr key={s.id}>
                                        <td style={{ textAlign: 'center', color: '#868e96' }}>
                                            {index + 1}
                                        </td>
                                        <td style={{ fontWeight: 500, color: '#212529' }}>
                                            {s.full_name}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="sm-group-number">
                                                {s.group_number || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`sm-role-badge ${getRoleClass(s.role_id)}`}
                                            >
                                                {s.role_name || 'Học sinh'}
                                            </span>
                                        </td>
                                        <td>
                                            {s.is_locked ? (
                                                <span className="sm-status-locked">🚫 Đã khóa</span>
                                            ) : (
                                                <span className="sm-status-active">
                                                    ✅ Hoạt động
                                                </span>
                                            )}
                                        </td>

                                        {canEdit && (
                                            <td style={{ textAlign: 'right', paddingRight: 24 }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'flex-end',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <button
                                                        className="sm-btn sm-btn-info"
                                                        style={{ marginRight: 0 }}
                                                        onClick={async () => {
                                                            if (
                                                                window.confirm(
                                                                    `Bạn muốn đặt lại mật khẩu của ${s.full_name} về '123456'?`
                                                                )
                                                            ) {
                                                                try {
                                                                    await api.put(
                                                                        `/users/${s.id}/reset-password`
                                                                    );
                                                                    alert(
                                                                        'Đã reset mật khẩu thành công!'
                                                                    );
                                                                } catch (e) {
                                                                    alert('Lỗi reset mật khẩu');
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        Reset MK
                                                    </button>
                                                    <button
                                                        className="sm-btn sm-btn-edit"
                                                        onClick={() => handleEdit(s)}
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        className={`sm-btn sm-btn-action-lock ${s.is_locked ? 'sm-btn-success' : 'sm-btn-warning'}`}
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
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && canEdit && (
                <div className="sm-modal-overlay">
                    <div className="sm-modal-content">
                        <h3 className="sm-modal-title">
                            {editingStudent ? 'Cập Nhật Thông Tin' : 'Thêm Học Sinh Mới'}
                        </h3>

                        <div className="sm-form-group">
                            <label>
                                Họ và Tên <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                className="sm-form-control"
                                value={formData.full_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, full_name: e.target.value })
                                }
                                placeholder="Nhập họ và tên..."
                            />
                        </div>

                        <div className="sm-form-group">
                            <label>Thuộc Tổ (Nhập số)</label>
                            <input
                                type="number"
                                className="sm-form-control"
                                value={formData.group_number}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        group_number: parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>

                        <div className="sm-form-group">
                            <label>Vai Trò</label>
                            <select
                                className="sm-form-control"
                                value={formData.role_id}
                                onChange={(e) =>
                                    setFormData({ ...formData, role_id: parseInt(e.target.value) })
                                }
                            >
                                {}
                                {availableRoles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="sm-modal-actions">
                            <button
                                className="sm-btn sm-btn-secondary"
                                onClick={() => setShowModal(false)}
                            >
                                Hủy bỏ
                            </button>
                            <button className="sm-btn sm-btn-primary" onClick={handleSave}>
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
