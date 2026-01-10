import React, { useEffect, useState } from 'react';
import { FaPlus, FaEye, FaTrash, FaClock } from 'react-icons/fa';
import api from '../../../utils/api';
import { useClass } from '../../../contexts/ClassContext';

// Import Component Detail (Sẽ tạo ở dưới)
import ExamDetail from './ExamDetail';

interface ExamSummary {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
}

const ExamList = ({ onCreate }: any) => {
    const { selectedClass } = useClass();
    const [exams, setExams] = useState<ExamSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null); // State để chuyển sang trang chi tiết

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
                fetchExams(); // Reload list
            } catch (err) {
                alert('Lỗi khi xoá đề thi.');
            }
        }
    };

    // Nếu đang xem chi tiết, render ExamDetail
    if (selectedExamId) {
        return <ExamDetail examId={selectedExamId} onBack={() => setSelectedExamId(null)} />;
    }

    return (
        <div className="exam-list-container">
            <div
                className="exam-list-header"
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}
            >
                <h2>Ngân hàng đề thi - Lớp {selectedClass?.name}</h2>
                <button className="btn-primary" onClick={onCreate}>
                    <FaPlus /> Tạo đề mới
                </button>
            </div>

            {loading ? (
                <p>Đang tải...</p>
            ) : (
                <table
                    className="exam-table"
                    style={{
                        width: '100%',
                        background: 'white',
                        borderCollapse: 'collapse',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    <thead>
                        <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                            <th style={{ padding: 15 }}>Tiêu đề</th>
                            <th>Thời gian</th>
                            <th>Ngày tạo</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map((exam) => (
                            <tr key={exam.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: 15 }}>
                                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                                        {exam.title}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {new Date(exam.start_time).toLocaleDateString()} -{' '}
                                        {new Date(exam.end_time).toLocaleDateString()}
                                    </div>
                                </td>
                                <td>{exam.duration_minutes} phút</td>
                                <td>{new Date(exam.start_time).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        className="btn-icon"
                                        onClick={() => setSelectedExamId(exam.id)}
                                        title="Xem chi tiết & Kết quả"
                                        style={{
                                            marginRight: 10,
                                            color: '#007bff',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <FaEye size={18} />
                                    </button>
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleDelete(exam.id)}
                                        title="Xoá đề thi"
                                        style={{
                                            color: '#dc3545',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <FaTrash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ExamList;
