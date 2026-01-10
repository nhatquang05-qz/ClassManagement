import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FaClock, FaArrowUp, FaArrowDown, FaTimes } from 'react-icons/fa';
import '../assets/styles/ExamTakingPage.css';

const MatchingQuestion = ({ data, value, onChange }: any) => {
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const pairs = value || {};

    const handleLeftClick = (text: string) => {
        if (!pairs[text]) setSelectedLeft(text);
    };
    const handleRightClick = (rightText: string) => {
        if (selectedLeft) {
            onChange({ ...pairs, [selectedLeft]: rightText });
            setSelectedLeft(null);
        }
    };
    const removePair = (leftText: string) => {
        const n = { ...pairs };
        delete n[leftText];
        onChange(n);
    };
    const isRightMatched = (text: string) => Object.values(pairs).includes(text);

    return (
        <div className="matching-container">
            <div className="col-left">
                {data.pairs?.map((p: any, idx: number) => (
                    <div
                        key={idx}
                        className={`match-item left ${selectedLeft === p.left ? 'selected' : ''} ${pairs[p.left] ? 'matched' : ''}`}
                        onClick={() => handleLeftClick(p.left)}
                    >
                        {p.left}
                    </div>
                ))}
            </div>
            <div className="col-right">
                {data.pairs?.map((p: any, idx: number) => (
                    <div
                        key={idx}
                        className={`match-item right ${isRightMatched(p.right) ? 'matched' : ''}`}
                        onClick={() => !isRightMatched(p.right) && handleRightClick(p.right)}
                    >
                        {p.right}
                    </div>
                ))}
            </div>
            <div className="matched-results">
                <strong>Đã nối:</strong>
                <div className="pair-tags">
                    {Object.entries(pairs).map(([l, r]: any) => (
                        <span key={l} className="pair-tag">
                            {l} ↔ {r}{' '}
                            <button onClick={() => removePair(l)}>
                                <FaTimes />
                            </button>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const OrderingQuestion = ({ data, value, onChange }: any) => {
    const [items, setItems] = useState<any[]>([]);
    useEffect(() => {
        if (value && value.length > 0) setItems(value);
        else if (data.items) setItems([...data.items]);
    }, [data, value]);

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...items];
        if (direction === 'up' && index > 0)
            [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        else if (direction === 'down' && index < newItems.length - 1)
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        setItems(newItems);
        onChange(newItems);
    };

    return (
        <div className="ordering-container">
            {items.map((item: any, index: number) => (
                <div key={index} className="order-item">
                    <div className="order-actions">
                        <button disabled={index === 0} onClick={() => moveItem(index, 'up')}>
                            <FaArrowUp />
                        </button>
                        <button
                            disabled={index === items.length - 1}
                            onClick={() => moveItem(index, 'down')}
                        >
                            <FaArrowDown />
                        </button>
                    </div>
                    <div className="order-content">
                        <span className="index-badge">{index + 1}</span>
                        {item.text}
                    </div>
                </div>
            ))}
        </div>
    );
};

const QuestionRenderer = ({ question, answer, onAnswer }: any) => {
    const { type, content, media_url, content_data, points } = question;
    const data = typeof content_data === 'string' ? JSON.parse(content_data) : content_data;

    return (
        <div
            className="question-card"
            style={{
                background: 'white',
                padding: 20,
                marginBottom: 20,
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
        >
            <div style={{ marginBottom: 15, fontSize: '1.1rem', fontWeight: 600 }}>
                <span style={{ color: '#007bff', marginRight: 8 }}>Câu hỏi:</span>
                {content}{' '}
                <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 'normal' }}>
                    ({points} điểm)
                </span>
            </div>
            {media_url && (
                <div style={{ marginBottom: 15, textAlign: 'center' }}>
                    {question.media_type === 'audio' ? (
                        <audio controls src={media_url} style={{ width: '100%' }} />
                    ) : (
                        <img src={media_url} style={{ maxWidth: '100%', maxHeight: 300 }} />
                    )}
                </div>
            )}

            {type === 'multiple_choice' && (
                <div className="mc-options">
                    {data.options?.map((opt: any) => (
                        <label
                            key={opt.id}
                            className={`mc-label ${answer === opt.id ? 'selected' : ''}`}
                        >
                            <input
                                type="radio"
                                name={`q-${question.id}`}
                                checked={answer === opt.id}
                                onChange={() => onAnswer(opt.id)}
                            />
                            {opt.text}
                        </label>
                    ))}
                </div>
            )}
            {(type === 'fill_in_blank' || type === 'fill_blank') && (
                <div className="fill-blank-area">
                    <input
                        type="text"
                        className="fill-input"
                        value={answer || ''}
                        onChange={(e) => onAnswer(e.target.value)}
                        placeholder="Nhập câu trả lời..."
                    />
                </div>
            )}
            {type === 'matching' && (
                <MatchingQuestion data={data} value={answer} onChange={onAnswer} />
            )}
            {(type === 'ordering' || type === 'reorder') && (
                <OrderingQuestion data={data} value={answer} onChange={onAnswer} />
            )}
        </div>
    );
};

const ExamTakingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState<any>(null);
    const [answers, setAnswers] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [submissionId, setSubmissionId] = useState<number | null>(null);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        const initExam = async () => {
            try {
                const resExam = await api.get(`/exams/${id}`);
                setExam(resExam.data);

                const resStart = await api.post('/exams/start', { examId: id });
                setSubmissionId(resStart.data.submissionId);

                const startedAt = new Date(resStart.data.startedAt).getTime();
                const durationMs = resStart.data.durationMinutes * 60 * 1000;
                const now = new Date().getTime();
                const remaining = Math.max(0, Math.floor((startedAt + durationMs - now) / 1000));

                setTimeLeft(remaining);
                setLoading(false);
            } catch (err: any) {
                console.error('Init Error:', err);
                alert(err.response?.data?.message || 'Lỗi tải đề thi.');
                navigate('/student-exams');
            }
        };
        initExam();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id, navigate]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev && prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmit(true);
                        return 0;
                    }
                    return prev ? prev - 1 : 0;
                });
            }, 1000);
        }
    }, [timeLeft]);

    const handleSubmit = async (force = false) => {
        if (!force && !window.confirm('Nộp bài ngay?')) return;
        try {
            const res = await api.post('/exams/submit', {
                submissionId: submissionId,
                answers: answers,
            });
            alert(`Nộp bài thành công! Điểm: ${res.data.score}/${res.data.total}`);
            navigate(`/exam-review/${submissionId}`);
        } catch (err) {
            alert('Lỗi nộp bài.');
        }
    };

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600),
            m = Math.floor((s % 3600) / 60),
            sec = s % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;
    if (!exam)
        return <div style={{ padding: 40, textAlign: 'center' }}>Không tìm thấy đề thi.</div>;

    return (
        <div className="exam-taking-page">
            <div className="exam-header">
                <div>
                    <h3 style={{ margin: 0 }}>{exam.title}</h3>
                </div>
                <div className={`timer-badge ${timeLeft && timeLeft < 300 ? 'warning' : ''}`}>
                    <FaClock /> {timeLeft !== null ? formatTime(timeLeft) : '--:--:--'}
                </div>
                <button className="btn-submit" onClick={() => handleSubmit(false)}>
                    Nộp bài
                </button>
            </div>
            <div className="exam-body-container">
                {exam.sections?.map((sec: any) => (
                    <div key={sec.id} className="section-block">
                        <div className="section-title">
                            <h4>{sec.title}</h4>
                            {sec.description && <p>{sec.description}</p>}
                        </div>
                        {sec.media_url && (
                            <div style={{ marginBottom: 15 }}>
                                <audio controls src={sec.media_url} style={{ width: '100%' }} />
                            </div>
                        )}
                        {sec.questions?.map((q: any) => (
                            <QuestionRenderer
                                key={q.id}
                                question={q}
                                answer={answers[q.id]}
                                onAnswer={(val: any) => setAnswers({ ...answers, [q.id]: val })}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExamTakingPage;
