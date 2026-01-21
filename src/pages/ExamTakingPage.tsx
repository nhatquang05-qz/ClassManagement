import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    FaClock, FaSave, FaThLarge, FaTimes, FaList 
} from 'react-icons/fa';
import api from '../utils/api';
import QuestionRenderer from '../components/exam/taking/QuestionRenderer';
import '../assets/styles/ExamTakingPage.css';

const ExamTakingPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState<any>(null);
    const [answers, setAnswers] = useState<any>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    
    
    const submissionIdRef = useRef<number | null>(null);
    
    const [isNavOpen, setIsNavOpen] = useState(false);
    const hasFetched = useRef(false);
    const isSubmitting = useRef(false); 
    const questionRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

    const violationCountRef = useRef(0);
    const totalAwayTimeRef = useRef(0);
    const lastLeaveTimeRef = useRef<number | null>(null);
    const answersRef = useRef(answers); 

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const initExam = async () => {
            try {
                const startRes = await api.post('/exams/start', { examId: id });
                
                
                submissionIdRef.current = startRes.data.submissionId;
                console.log("Submission ID initialized:", submissionIdRef.current);

                const durationSec = startRes.data.durationMinutes * 60;
                setTimeLeft(durationSec);

                const examRes = await api.get(`/exams/${id}?mode=taking`);
                setExam(examRes.data);

            } catch (error: any) {
                if (!isSubmitting.current) {
                    console.error("Lỗi vào thi:", error);
                    
                    navigate('/student-exams');
                }
            }
        };
        initExam();
    }, [id, navigate]);

    
    const doSubmit = async (isForced = false) => {
        
        const subId = submissionIdRef.current;

        if (!subId) {
            console.error("CRITICAL ERROR: Không tìm thấy submissionId lúc nộp bài.");
            alert("Lỗi hệ thống: Không tìm thấy mã bài thi. Vui lòng F5 và thử lại.");
            return;
        }

        if (isSubmitting.current) return; 
        isSubmitting.current = true; 

        try {
            console.log("Đang nộp bài với ID:", subId);
            await api.post('/exams/submit', {
                submissionId: subId,
                answers: answersRef.current 
            });
            
            if (isForced) {
                alert('Hệ thống nộp bài tự động do vi phạm quy chế.');
            } else {
                alert('Nộp bài thành công!');
            }
            
            
            const targetUrl = `/exam-review/${subId}`;
            console.log("Navigating to:", targetUrl);
            
            
            navigate(targetUrl, { replace: true });

        } catch (error) {
            console.error("Lỗi khi submit:", error);
            
            
            navigate(`/exam-review/${subId}`, { replace: true });
        }
    };

    
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    doSubmit(false); 
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]); 

    
    const handleSubmitManual = (e?: React.MouseEvent) => {
        if (e) e.preventDefault(); 
        if (window.confirm('Bạn chắc chắn muốn nộp bài?')) {
            doSubmit(false);
        }
    };

    
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                lastLeaveTimeRef.current = Date.now();
            } else {
                if (lastLeaveTimeRef.current) {
                    const now = Date.now();
                    const awayDuration = (now - lastLeaveTimeRef.current) / 1000;
                    
                    totalAwayTimeRef.current += awayDuration;
                    violationCountRef.current += 1;
                    lastLeaveTimeRef.current = null;

                    if (violationCountRef.current >= 3 || totalAwayTimeRef.current > 30) {
                        doSubmit(true);
                    } else {
                        alert(`CẢNH BÁO ${violationCountRef.current}/3: Bạn đã rời màn hình.`);
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []); 

    
    const handleAnswerChange = (qId: number, val: any) => {
        setAnswers((prev: any) => ({ ...prev, [qId]: val }));
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const allQuestions = exam?.sections ? exam.sections.flatMap((s: any) => s.questions || []) : [];

    const isQuestionAnswered = (qId: number) => {
        const ans = answers[qId];
        if (Array.isArray(ans)) return ans.length > 0;
        if (typeof ans === 'object' && ans !== null) return Object.keys(ans).length > 0;
        return ans !== undefined && ans !== '' && ans !== null;
    };

    const scrollToQuestion = (index: number) => {
        const el = questionRefs.current[index];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setIsNavOpen(false);
        }
    };

    const answeredCount = allQuestions.filter((q: any) => isQuestionAnswered(q.id)).length;
    const totalCount = allQuestions.length;
    const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

    if (!exam) return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            height: '100vh', background: '#f0f2f5', flexDirection: 'column', gap: 15
        }}>
            <div style={{fontSize: '1.2rem', fontWeight: 600, color: '#555'}}>Đang tải dữ liệu bài thi...</div>
        </div>
    );

    return (
        <div className="exam-taking-page">
            <div className="exam-header">
                <h3>{exam.title}</h3>
                <div className={`timer-badge ${timeLeft < 300 ? 'warning' : ''}`}>
                    <FaClock /> {formatTime(timeLeft)}
                </div>
                {}
                <button type="button" className="btn-submit" onClick={handleSubmitManual}>
                    Nộp bài
                </button>
            </div>

            <div className="exam-layout-wrapper">
                <div className="exam-body-container">
                    {exam.sections?.map((section: any, sIdx: number) => (
                        <div key={sIdx} className="section-block">
                            <div className="section-title">
                                <h4>{section.title}</h4>
                                {section.description && <p>{section.description}</p>}
                            </div>
                            
                            {section.questions?.map((q: any) => {
                                const globalIndex = allQuestions.findIndex((item: any) => item.id === q.id);
                                return (
                                    <div 
                                        key={q.id} 
                                        id={`question-${q.id}`}
                                        ref={el => questionRefs.current[globalIndex] = el}
                                        className="question-wrapper-item"
                                    >
                                        <div className="question-index-badge">Câu {globalIndex + 1}</div>
                                        <QuestionRenderer 
                                            question={q} 
                                            answer={answers[q.id]} 
                                            onAnswer={(val) => handleAnswerChange(q.id, val)} 
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div 
                    className={`exam-nav-overlay ${isNavOpen ? 'exam-nav-open' : ''}`} 
                    onClick={() => setIsNavOpen(false)}
                ></div>

                <aside className={`exam-nav-sidebar ${isNavOpen ? 'exam-nav-open' : ''}`}>
                    <div className="exam-nav-header">
                        <span className="exam-nav-title">
                            <FaThLarge style={{marginRight: 8, color: '#3498db'}}/> 
                            Danh sách câu hỏi
                        </span>
                        <button type="button" className="btn-icon-close" onClick={() => setIsNavOpen(false)}>
                            <FaTimes />
                        </button>
                    </div>

                    <div className="exam-nav-stats">
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom: 5, fontSize:'0.9rem', fontWeight: 600}}>
                            <span>Tiến độ:</span>
                            <span>{answeredCount}/{totalCount} câu</span>
                        </div>
                        <div style={{width: '100%', height: 6, background: '#ddd', borderRadius: 3, overflow: 'hidden'}}>
                            <div style={{width: `${progressPercent}%`, height: '100%', background: '#27ae60', transition: 'width 0.3s'}}></div>
                        </div>
                    </div>

                    <div className="exam-nav-grid">
                        {allQuestions.map((q: any, idx: number) => {
                            const isAnswered = isQuestionAnswered(q.id);
                            return (
                                <button
                                    type="button"
                                    key={q.id}
                                    className={`exam-nav-item ${isAnswered ? 'exam-nav-done' : ''}`}
                                    onClick={() => scrollToQuestion(idx)}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{marginTop: 20, textAlign: 'center'}}>
                        <button type="button" className="btn-submit-full" onClick={handleSubmitManual}>
                            <FaSave style={{marginRight: 5}}/> Nộp bài ngay
                        </button>
                    </div>
                </aside>
            </div>

            <button type="button" className="exam-nav-mobile-toggle" onClick={() => setIsNavOpen(true)}>
                <FaList />
            </button>
        </div>
    );
};

export default ExamTakingPage;