import React from 'react';
import { FaCalendarAlt, FaClock, FaEdit, FaEye, FaPlus, FaTrash } from 'react-icons/fa';
import '../../../assets/styles/ExamList.css';

interface ExamListProps {
    exams: any[];
    onCreate: () => void;
    onViewDetail: (id: number) => void;
    onEdit: (exam: any) => void;
    onDelete: (id: number) => void;
}

const ExamList: React.FC<ExamListProps> = ({ exams, onCreate, onViewDetail, onEdit, onDelete }) => {
    return (
        <div className="exam-list-container">
            <div className="exam-list-header">
                <h2>Danh sách bài kiểm tra</h2>
                <button className="btn-create-exam" onClick={onCreate}>
                    <FaPlus /> Tạo đề mới
                </button>
            </div>

            <div className="exam-grid">
                {exams.length === 0 ? (
                    <p className="empty-text">Chưa có bài kiểm tra nào.</p>
                ) : (
                    exams.map((exam) => (
                        <div key={exam.id} className="exam-card">
                            <div className="exam-card-body" onClick={() => onViewDetail(exam.id)}>
                                <h3 className="exam-title">{exam.title}</h3>
                                <p className="exam-desc">{exam.description || 'Không có mô tả'}</p>
                                <div className="exam-meta">
                                    <span>
                                        <FaClock /> {exam.duration_minutes} phút
                                    </span>
                                    <span>
                                        <FaCalendarAlt />
                                        {new Date(exam.start_time).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                            <div className="exam-card-actions">
                                <button
                                    className="btn-action-icon btn-view"
                                    onClick={() => onViewDetail(exam.id)}
                                    title="Xem kết quả"
                                >
                                    <FaEye />
                                </button>
                                <button
                                    className="btn-action-icon btn-edit"
                                    onClick={() => onEdit(exam)}
                                    title="Chỉnh sửa đề"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    className="btn-action-icon btn-delete"
                                    onClick={() => onDelete(exam.id)}
                                    title="Xóa đề thi"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ExamList;
