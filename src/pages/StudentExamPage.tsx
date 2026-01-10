import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useClass } from '../contexts/ClassContext';
import { FaClock, FaPlayCircle } from 'react-icons/fa';

const StudentExamPage = () => {
    const { selectedClass } = useClass();
    const [exams, setExams] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (selectedClass?.id) {
            api.get(`/exams/class/${selectedClass.id}`)
                .then((res) => setExams(res.data))
                .catch((err) => console.error(err));
        }
    }, [selectedClass]);

    const handleStartExam = (examId: number) => {
        // Chuyển sang trang làm bài
        navigate(`/take-exam/${examId}`);
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Bài kiểm tra của lớp {selectedClass?.name}</h2>
            <div
                className="exam-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 20,
                    marginTop: 20,
                }}
            >
                {exams.map((exam) => (
                    <div
                        key={exam.id}
                        style={{
                            background: 'white',
                            padding: 20,
                            borderRadius: 8,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>{exam.title}</h3>
                        <p>
                            <FaClock /> Thời gian: {exam.duration_minutes} phút
                        </p>
                        <button
                            onClick={() => handleStartExam(exam.id)}
                            style={{
                                width: '100%',
                                padding: 10,
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                            }}
                        >
                            <FaPlayCircle /> Bắt đầu làm bài
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentExamPage;
