import React, { useEffect, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import api from '../../../utils/api';

const ExamDetail = ({ examId, onBack }: any) => {
    const [exam, setExam] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cần backend hỗ trợ API lấy submissions. Ví dụ: GET /exams/:id/submissions
                // Hiện tại ta gọi lấy info đề trước
                const resExam = await api.get(`/exams/${examId}`);
                setExam(resExam.data);

                // Mock data submissions (Bạn cần làm API backend thật cho phần này)
                // const resSub = await api.get(`/exams/${examId}/submissions`);
                setSubmissions([
                    {
                        id: 1,
                        student_name: 'Nguyễn Văn A',
                        score: 8.5,
                        submitted_at: '2026-01-10 10:00:00',
                    },
                    {
                        id: 2,
                        student_name: 'Trần Thị B',
                        score: 9.0,
                        submitted_at: '2026-01-10 10:05:00',
                    },
                ]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [examId]);

    if (loading) return <div>Đang tải chi tiết...</div>;

    return (
        <div className="exam-detail-container">
            <button
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: 20,
                }}
            >
                <FaArrowLeft /> Quay lại danh sách
            </button>

            <div style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 20 }}>
                <h2>{exam.title}</h2>
                <p>Thời gian: {exam.duration_minutes} phút</p>
                <p>Mô tả: {exam.description}</p>
            </div>

            <h3>Danh sách bài nộp (Demo)</h3>
            <table style={{ width: '100%', background: 'white', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f1f1f1', textAlign: 'left' }}>
                        <th style={{ padding: 10 }}>Học sinh</th>
                        <th>Điểm số</th>
                        <th>Thời gian nộp</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((sub) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: 10 }}>{sub.student_name}</td>
                            <td
                                style={{
                                    fontWeight: 'bold',
                                    color: sub.score >= 5 ? 'green' : 'red',
                                }}
                            >
                                {sub.score}
                            </td>
                            <td>{sub.submitted_at}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ExamDetail;
