import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useClass } from '../../contexts/ClassContext';
import {
    FaPlus,
    FaEdit,
    FaTimes,
    FaCheck,
    FaTrash,
    FaSave,
    FaArrowLeft,
    FaCalendarAlt,
} from 'react-icons/fa';
import '../../assets/styles/ClassManagerModal.css';
import ScheduleManagerModal from './ScheduleManagerModal';

interface ClassItem {
    id: number;
    name: string;
    school_year: string;
    start_date?: string;
    schedule_config?: any;
}

interface ClassManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ClassManagerModal: React.FC<ClassManagerModalProps> = ({ isOpen, onClose }) => {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const { selectedClass, setSelectedClass } = useClass();

    const [showForm, setShowForm] = useState(false);
    const [isEditForm, setIsEditForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [className, setClassName] = useState('');
    const [schoolYear, setSchoolYear] = useState('');
    const [startDate, setStartDate] = useState('');

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleTarget, setScheduleTarget] = useState<ClassItem | null>(null);

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

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc chắn muốn xóa lớp này? Mọi dữ liệu liên quan sẽ bị mất.'))
            return;

        try {
            await api.delete(`/classes/${id}`);
            fetchClasses();

            if (selectedClass?.id === id) {
                localStorage.removeItem('selectedClassId');
                localStorage.removeItem('selectedClassName');
                localStorage.removeItem('currentClass');
                setSelectedClass(null);
            }
        } catch (error) {
            alert('Lỗi khi xóa lớp');
        }
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

    const openScheduleConfig = (e: React.MouseEvent, cls: ClassItem) => {
        e.stopPropagation();
        if (!cls.start_date) {
            alert('Vui lòng cập nhật "Ngày khai giảng" cho lớp trước khi cấu hình lịch.');
            return;
        }
        setScheduleTarget(cls);
        setShowScheduleModal(true);
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
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi lưu dữ liệu');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="cm-overlay" onClick={onClose}>
                <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="cm-header">
                        <h2>
                            {showForm
                                ? isEditForm
                                    ? 'Cập Nhật Lớp'
                                    : 'Thêm Lớp Mới'
                                : 'Quản Lý Lớp Học'}
                        </h2>
                        <button className="cm-close-btn" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>

                    <div className="cm-body">
                        {showForm ? (
                            <div className="cm-form">
                                <div className="cm-form-group">
                                    <label>Tên Lớp</label>
                                    <input
                                        className="cm-input"
                                        value={className}
                                        onChange={(e) => setClassName(e.target.value)}
                                        placeholder="VD: 10A1"
                                        autoFocus
                                    />
                                </div>
                                <div className="cm-form-group">
                                    <label>Niên Khóa</label>
                                    <input
                                        className="cm-input"
                                        value={schoolYear}
                                        onChange={(e) => setSchoolYear(e.target.value)}
                                        placeholder="VD: 2024-2025"
                                    />
                                </div>
                                <div className="cm-form-group">
                                    <label>Ngày Khai Giảng</label>
                                    <input
                                        type="date"
                                        className="cm-input"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="cm-form-actions">
                                    <button
                                        className="cm-btn cancel"
                                        onClick={() => setShowForm(false)}
                                    >
                                        <FaArrowLeft /> Quay lại
                                    </button>
                                    <button className="cm-btn submit" onClick={handleSave}>
                                        <FaSave /> Lưu lại
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="cm-controls">
                                    <button
                                        className="cm-btn primary full-width"
                                        onClick={openCreateForm}
                                    >
                                        <FaPlus /> Thêm Lớp Mới
                                    </button>
                                </div>

                                <div className="cm-list">
                                    {classes.length === 0 ? (
                                        <p className="cm-empty">Chưa có lớp nào. Hãy tạo mới.</p>
                                    ) : (
                                        classes.map((cls) => (
                                            <div
                                                key={cls.id}
                                                className={`cm-item ${selectedClass?.id === cls.id ? 'active' : ''}`}
                                                onClick={() => handleSelectClass(cls)}
                                                title="Bấm để chọn lớp này làm việc"
                                            >
                                                <div className="cm-item-content">
                                                    <div className="cm-item-title">
                                                        {cls.name}
                                                        {selectedClass?.id === cls.id && (
                                                            <FaCheck className="cm-check-icon" />
                                                        )}
                                                    </div>
                                                    <div className="cm-item-subtitle">
                                                        {cls.school_year}
                                                    </div>
                                                </div>

                                                <div className="cm-item-actions">
                                                    {}
                                                    <button
                                                        className="cm-action-btn edit"
                                                        style={{
                                                            backgroundColor: '#17a2b8',
                                                            color: 'white',
                                                        }}
                                                        onClick={(e) => openScheduleConfig(e, cls)}
                                                        title="Cấu hình lịch nghỉ/tuần học"
                                                    >
                                                        <FaCalendarAlt />
                                                    </button>

                                                    <button
                                                        className="cm-action-btn edit"
                                                        onClick={(e) => openEditForm(e, cls)}
                                                        title="Sửa"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="cm-action-btn delete"
                                                        onClick={(e) => handleDelete(e, cls.id)}
                                                        title="Xóa"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {}
            {scheduleTarget && (
                <ScheduleManagerModal
                    isOpen={showScheduleModal}
                    onClose={() => {
                        setShowScheduleModal(false);
                        setScheduleTarget(null);
                    }}
                    classId={scheduleTarget.id}
                    className={scheduleTarget.name}
                    schoolYear={scheduleTarget.school_year}
                    startDateStr={scheduleTarget.start_date || ''}
                    initialConfig={
                        typeof scheduleTarget.schedule_config === 'string'
                            ? JSON.parse(scheduleTarget.schedule_config)
                            : scheduleTarget.schedule_config
                    }
                />
            )}
        </>
    );
};

export default ClassManagerModal;
