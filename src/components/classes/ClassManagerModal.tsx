import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useClass } from '../../contexts/ClassContext';
import { FaPlus, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import '../../assets/styles/ClassManagerModal.css';

interface ClassItem {
    id: number;
    name: string;
    school_year: string;
    start_date?: string;
}

interface ClassManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ClassManagerModal: React.FC<ClassManagerModalProps> = ({ isOpen, onClose }) => {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const { selectedClass, setSelectedClass } = useClass();

    const [isEditingMode, setIsEditingMode] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isEditForm, setIsEditForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [className, setClassName] = useState('');
    const [schoolYear, setSchoolYear] = useState('');
    const [startDate, setStartDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchClasses();
        }
    }, [isOpen]);

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
        localStorage.setItem('currentClass', JSON.stringify(cls));
        onClose();
        window.location.reload();
    };

    const resetForm = () => {
        setClassName('');
        setSchoolYear('2024-2025');
        setStartDate('');
        setIsEditForm(false);
        setEditingId(null);
        setShowForm(false);
    };

    const openCreateForm = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditForm = (e: React.MouseEvent, cls: ClassItem) => {
        e.stopPropagation();
        setClassName(cls.name);
        setSchoolYear(cls.school_year);
        setStartDate(cls.start_date ? cls.start_date.split('T')[0] : '');
        setIsEditForm(true);
        setEditingId(cls.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!className) return alert('Vui lòng nhập tên lớp');
        try {
            const payload = {
                name: className,
                school_year: schoolYear,
                start_date: startDate || null,
            };
            if (isEditForm && editingId) {
                await api.put(`/classes/${editingId}`, payload);
            } else {
                await api.post('/classes', payload);
            }
            resetForm();
            fetchClasses();
        } catch (error) {
            alert('Lỗi lưu dữ liệu');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="cm-overlay">
            <div className="cm-box">
                {}
                <div className="cm-header">
                    <h2 className="cm-title">
                        {showForm
                            ? isEditForm
                                ? 'Cập Nhật Lớp'
                                : 'Thêm Lớp Mới'
                            : 'Chọn Lớp Làm Việc'}
                    </h2>
                    <button className="cm-close-btn" onClick={onClose} title="Đóng">
                        <FaTimes />
                    </button>
                </div>

                {}
                {showForm ? (
                    <div>
                        <div className="cm-form-group">
                            <label className="cm-label">Tên Lớp</label>
                            <input
                                className="form-control"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                placeholder="Ví dụ: 12A1"
                            />
                        </div>
                        <div className="cm-form-group">
                            <label className="cm-label">Niên Khóa</label>
                            <input
                                className="form-control"
                                value={schoolYear}
                                onChange={(e) => setSchoolYear(e.target.value)}
                                placeholder="Ví dụ: 2024-2025"
                            />
                        </div>
                        <div className="cm-form-group">
                            <label className="cm-label">Ngày Khai Giảng (Tuần 1)</label>
                            <input
                                type="date"
                                className="form-control"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="cm-footer">
                            <button className="btn btn-outline" onClick={() => setShowForm(false)}>
                                Quay lại
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                Lưu thông tin
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="cm-controls">
                            <button className="btn btn-primary btn-sm" onClick={openCreateForm}>
                                <FaPlus /> Thêm Lớp
                            </button>
                            <button
                                className={`btn btn-sm ${isEditingMode ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setIsEditingMode(!isEditingMode)}
                            >
                                {isEditingMode ? 'Xong' : 'Chỉnh sửa'}
                            </button>
                        </div>

                        <div className="cm-grid-list">
                            {classes.map((cls) => (
                                <div
                                    key={cls.id}
                                    className={`cm-item ${selectedClass?.id === cls.id ? 'selected' : ''}`}
                                    onClick={() => !isEditingMode && handleSelectClass(cls)}
                                >
                                    <div className="cm-item-name">{cls.name}</div>
                                    <div className="cm-item-info">{cls.school_year}</div>

                                    {selectedClass?.id === cls.id && (
                                        <div className="cm-check-icon">
                                            <FaCheck />
                                        </div>
                                    )}

                                    {isEditingMode && (
                                        <button
                                            className="cm-item-edit-btn"
                                            onClick={(e) => openEditForm(e, cls)}
                                            title="Sửa thông tin lớp"
                                        >
                                            <FaEdit /> Sửa
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ClassManagerModal;
