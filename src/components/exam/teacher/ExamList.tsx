import React, { useEffect, useState } from 'react';
import { FaPlus, FaEye, FaTrash, FaClock, FaHistory, FaCalendarAlt } from 'react-icons/fa';
import api from '../../../utils/api';
import { useClass } from '../../../contexts/ClassContext';
import ExamDetail from './ExamDetail';
import '../../../assets/styles/ExamList.css';

interface ExamSummary {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;

    attempt_count?: number;
    max_attempts: number;
}

const ExamList = ({ onCreate }: any) => {
    const { selectedClass } = useClass();
    const [exams, setExams] = useState<ExamSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

    const fetchExams = () => {
        if (selectedClass?.id) {
            setLoading(true);
            api.get(`/exams/class/${selectedClass.id}`)
                .then((res) => setExams(res.data))
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchExams();
    }, [selectedClass]);

    const handleDelete = async (id: number) => {
        if (
            window.confirm(
                'Bạn có chắc chắn muốn xoá bài kiểm tra này? Toàn bộ bài làm của học sinh sẽ bị mất.'
            )
        ) {
            try {
                await api.delete(`/exams/${id}`);
                alert('Đã xoá thành công!');
                fetchExams();
            } catch (err) {
                alert('Lỗi khi xoá đề thi.');
            }
        }
    };

    if (selectedExamId) {
        return <ExamDetail examId={selectedExamId} onBack={() => setSelectedExamId(null)} />;
    }

    return (
        <div className="exam-list-container">
            <div className="exam-list-header">
                <h2>Ngân hàng đề thi - Lớp {selectedClass?.name}</h2>
                <button className="exam-list-btn-primary" onClick={onCreate}>
                    <FaPlus /> Tạo đề mới
                </button>
            </div>

            {loading ? (
                <div className="exam-list-loading">Đang tải danh sách đề thi...</div>
            ) : (
                <table className="exam-list-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Tiêu đề & Thời gian</th>
                            <th style={{ width: '20%' }}>Cấu hình thi</th>
                            <th style={{ width: '25%' }}>Hiệu lực</th>
                            <th style={{ width: '15%' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map((exam) => {
                            const isUnlimited = exam.max_attempts === 999;
                            return (
                                <tr key={exam.id}>
                                    <td>
                                        <div className="exam-list-title">{exam.title}</div>
                                        <div className="exam-list-meta">
                                            <span className="exam-list-meta-item">
                                                <FaClock size={12} /> {exam.duration_minutes} phút
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="exam-list-meta">
                                            <span className="exam-list-meta-item">
                                                <FaHistory size={12} />
                                                Lượt làm:{' '}
                                                {isUnlimited
                                                    ? 'Không giới hạn'
                                                    : `${exam.max_attempts} lần`}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div
                                            className="exam-list-meta"
                                            style={{
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                gap: 2,
                                            }}
                                        >
                                            <span className="exam-list-meta-item">
                                                <FaCalendarAlt size={12} color="#28a745" /> Mở:{' '}
                                                {new Date(exam.start_time).toLocaleString()}
                                            </span>
                                            <span className="exam-list-meta-item">
                                                <FaCalendarAlt size={12} color="#dc3545" /> Đóng:{' '}
                                                {new Date(exam.end_time).toLocaleString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="exam-list-actions">
                                            <button
                                                className="exam-list-btn-icon exam-list-btn-view"
                                                onClick={() => setSelectedExamId(exam.id)}
                                                title="Xem chi tiết & Kết quả"
                                            >
                                                <FaEye size={18} />
                                            </button>
                                            <button
                                                className="exam-list-btn-icon exam-list-btn-delete"
                                                onClick={() => handleDelete(exam.id)}
                                                title="Xoá đề thi"
                                            >
                                                <FaTrash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {exams.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    style={{ textAlign: 'center', padding: '2rem', color: '#999' }}
                                >
                                    Chưa có bài kiểm tra nào được tạo.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ExamList;
