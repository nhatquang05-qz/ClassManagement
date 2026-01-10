import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaEye, FaDownload, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import '../../../assets/styles/ExamManager.css';

const ExamDetail = ({ examId, onBack }: any) => {
    const navigate = useNavigate();
    const [exam, setExam] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const resExam = await api.get(`/exams/${examId}`);
                setExam(resExam.data);

                const resSub = await api.get(`/exams/${examId}/submissions`);
                setSubmissions(resSub.data);
            } catch (err) {
                console.error('Lỗi tải chi tiết:', err);
                alert('Không thể tải dữ liệu đề thi.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [examId]);

    const handleViewSubmission = (submissionId: number) => {
        navigate(`/exam-review/${submissionId}`);
    };

    if (loading) return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;
    if (!exam) return <div style={{ padding: 20 }}>Không tìm thấy đề thi.</div>;

    return (
        <div className="exam-detail-container">
            {}
            <div style={{ marginBottom: 20 }}>
                <button
                    onClick={onBack}
                    className="btn-back"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#666',
                        marginBottom: 10,
                    }}
                >
                    <FaArrowLeft /> Quay lại danh sách
                </button>
                <div
                    style={{
                        background: 'white',
                        padding: 20,
                        borderRadius: 8,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                >
                    <h2 style={{ margin: '0 0 10px 0' }}>{exam.title}</h2>
                    <div style={{ display: 'flex', gap: 20, color: '#555', fontSize: '0.9rem' }}>
                        <span>
                            ⏱ Thời gian: <strong>{exam.duration_minutes} phút</strong>
                        </span>
                        <span>📅 Bắt đầu: {new Date(exam.start_time).toLocaleString()}</span>
                        <span>📅 Kết thúc: {new Date(exam.end_time).toLocaleString()}</span>
                        <span>
                            👥 Số bài nộp: <strong>{submissions.length}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {}
            <div
                style={{
                    background: 'white',
                    padding: 20,
                    borderRadius: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 15,
                    }}
                >
                    <h3>Kết quả làm bài</h3>
                    <button
                        className="btn-primary"
                        style={{ padding: '5px 15px', fontSize: '0.9rem' }}
                    >
                        <FaDownload style={{ marginRight: 5 }} /> Xuất Excel
                    </button>
                </div>

                <table className="exam-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr
                            style={{
                                background: '#f8f9fa',
                                textAlign: 'left',
                                borderBottom: '2px solid #eee',
                            }}
                        >
                            <th style={{ padding: 12 }}>STT</th>
                            <th>Học sinh</th>
                            <th>Điểm số</th>
                            <th>Lần thi</th>
                            <th>Thời gian nộp</th>
                            <th style={{ textAlign: 'center' }}>Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.length > 0 ? (
                            submissions.map((sub, index) => (
                                <tr key={sub.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: 12 }}>{index + 1}</td>
                                    <td style={{ fontWeight: 500 }}>{sub.student_name}</td>
                                    <td>
                                        <span
                                            style={{
                                                fontWeight: 'bold',
                                                color: sub.score >= 5 ? '#28a745' : '#dc3545',
                                                background: sub.score >= 5 ? '#e8f5e9' : '#f8d7da',
                                                padding: '2px 8px',
                                                borderRadius: 4,
                                            }}
                                        >
                                            {sub.score}
                                        </span>
                                    </td>
                                    <td>{sub.attempt_number}</td>
                                    <td style={{ color: '#666', fontSize: '0.9rem' }}>
                                        {new Date(sub.submitted_at).toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleViewSubmission(sub.id)}
                                            title="Xem bài làm"
                                            style={{
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                color: '#007bff',
                                            }}
                                        >
                                            <FaEye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    style={{ textAlign: 'center', padding: 30, color: '#999' }}
                                >
                                    Chưa có học sinh nào nộp bài.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExamDetail;
