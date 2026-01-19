import React, { useState, useEffect } from 'react';
import { FaSave, FaPlus, FaMinus, FaTimes } from 'react-icons/fa';
import '../../assets/styles/DutyTracking.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (studentIds: string[] | null, note: string) => void;
    data: {
        group: number;
        type: string;
        date: string;
        typeName: string;
    } | null;
    students: any[];
    allowAllGroup?: boolean;
}

const DutyViolationModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSave,
    data,
    students,
    allowAllGroup = true,
}) => {
    const [selectedIds, setSelectedIds] = useState<string[]>(['']);
    const [modalNote, setModalNote] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(['']);
            setModalNote('');
        }
    }, [isOpen, data]);

    if (!isOpen || !data) return null;

    const groupStudents = students.filter((s) => s.group_number === data.group);

    const handleAddSlot = () => {
        setSelectedIds([...selectedIds, '']);
    };

    const handleRemoveSlot = (index: number) => {
        const newIds = [...selectedIds];
        newIds.splice(index, 1);
        setSelectedIds(newIds);
    };

    const handleChangeSlot = (index: number, value: string) => {
        const newIds = [...selectedIds];
        newIds[index] = value;
        if (allowAllGroup && index === 0 && value === '') {
            setSelectedIds(['']);
            return;
        }
        setSelectedIds(newIds);
    };

    const handleSave = () => {
        const isAllGroup = allowAllGroup && selectedIds.length === 1 && selectedIds[0] === '';

        if (isAllGroup) {
            onSave(null, modalNote);
        } else {
            const validIds = selectedIds.filter((id) => id !== '');
            if (validIds.length === 0) {
                onSave(null, modalNote);
            } else {
                onSave(validIds, modalNote);
            }
        }
        setSelectedIds(['']);
        setModalNote('');
    };

    const isFirstRowAllGroup = allowAllGroup && selectedIds.length > 0 && selectedIds[0] === '';

    return (
        <div className="duty-modal-overlay">
            <div className="duty-modal-content">
                <div className="duty-modal-header">
                    <span>{data.typeName}</span>
                    <button className="duty-close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="duty-modal-info">
                    <strong>Ngày:</strong> {new Date(data.date).toLocaleDateString('vi-VN')}
                    <span className="duty-divider">|</span>
                    <strong>Tổ:</strong> {data.group}
                </div>

                <div className="duty-form-group">
                    <label className="duty-form-label">Người vi phạm:</label>
                    <div className="duty-student-list">
                        {selectedIds.map((id, index) => (
                            <div key={index} className="duty-student-row">
                                <select
                                    className="duty-form-select"
                                    value={id}
                                    onChange={(e) => handleChangeSlot(index, e.target.value)}
                                >
                                    {index === 0 && allowAllGroup && (
                                        <option value="">-- Cả tổ {data.group} --</option>
                                    )}

                                    <option value="">
                                        {allowAllGroup
                                            ? '-- Chọn học sinh --'
                                            : '-- Không chọn cụ thể --'}
                                    </option>

                                    {groupStudents.map((s) => (
                                        <option
                                            key={s.id}
                                            value={s.id}
                                            disabled={
                                                selectedIds.includes(s.id.toString()) &&
                                                id !== s.id.toString()
                                            }
                                        >
                                            {s.full_name}
                                        </option>
                                    ))}
                                </select>

                                {selectedIds.length > 1 && (
                                    <button
                                        className="duty-icon-btn remove"
                                        onClick={() => handleRemoveSlot(index)}
                                    >
                                        <FaMinus />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {!isFirstRowAllGroup && groupStudents.length > selectedIds.length && (
                        <button className="duty-add-btn" onClick={handleAddSlot}>
                            <FaPlus /> Thêm người
                        </button>
                    )}
                </div>

                <div className="duty-form-group">
                    <label className="duty-form-label">Ghi chú:</label>
                    <textarea
                        className="duty-form-textarea"
                        rows={3}
                        value={modalNote}
                        onChange={(e) => setModalNote(e.target.value)}
                        placeholder="Nhập chi tiết..."
                    />
                </div>

                <div className="duty-modal-actions">
                    <button className="duty-btn duty-btn-secondary" onClick={onClose}>
                        Hủy
                    </button>
                    <button className="duty-btn duty-btn-primary" onClick={handleSave}>
                        <FaSave /> Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DutyViolationModal;
