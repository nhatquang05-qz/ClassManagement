import React, { useState } from 'react';
import { FaSave } from 'react-icons/fa';
import '../../assets/styles/DutyTracking.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (studentId: string | null, note: string) => void;
    data: {
        group: number;
        type: string;
        date: string;
        typeName: string;
    } | null;
    students: any[];
}

const DutyViolationModal: React.FC<Props> = ({ isOpen, onClose, onSave, data, students }) => {
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [modalNote, setModalNote] = useState('');

    if (!isOpen || !data) return null;

    const handleSave = () => {
        onSave(selectedStudent || null, modalNote);

        setSelectedStudent('');
        setModalNote('');
    };

    const groupStudents = students.filter((s) => s.group_number === data.group);

    return (
        <div className="duty-modal-overlay">
            <div className="duty-modal-content">
                <div className="duty-modal-header">Ghi nhận: {data.typeName}</div>

                <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#666' }}>
                    <strong>Ngày:</strong> {new Date(data.date).toLocaleDateString('vi-VN')} <br />
                    <strong>Tổ:</strong> {data.group}
                </div>

                <div className="duty-form-group">
                    <label className="duty-form-label">Người vi phạm (Để trống nếu cả tổ):</label>
                    <select
                        className="duty-form-select"
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                    >
                        <option value="">-- Cả tổ {data.group} --</option>
                        {groupStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.full_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="duty-form-group">
                    <label className="duty-form-label">Ghi chú:</label>
                    <textarea
                        className="duty-form-textarea"
                        rows={3}
                        value={modalNote}
                        onChange={(e) => setModalNote(e.target.value)}
                        placeholder="Nhập ghi chú chi tiết..."
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
