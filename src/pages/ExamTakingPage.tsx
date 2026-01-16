import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FaClock } from 'react-icons/fa';
import '../assets/styles/ExamTakingPage.css';

import QuestionRenderer from '../components/exam/taking/QuestionRenderer';


interface ExamData {
    title: string;
    duration_minutes: number;
    sections: any[];
}

const ExamTakingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamData | null>(null);
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
        console.error("Init Error:", err);
        alert(err.response?.data?.message || "Lỗi tải đề thi.");
        navigate('/student-exams');
      }
    };
    initExam();
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
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
     if(!force && !window.confirm("Nộp bài ngay?")) return;
     try {
        await api.post('/exams/submit', { submissionId: submissionId, answers: answers });
        alert(`Nộp bài thành công!`);
        navigate(`/exam-review/${submissionId}`);
     } catch (err) { alert("Lỗi nộp bài."); }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  if (loading) return <div style={{padding:40, textAlign:'center'}}>Đang tải dữ liệu...</div>;
  if (!exam) return <div style={{padding:40, textAlign:'center'}}>Không tìm thấy đề thi.</div>;

  return (
    <div className="exam-taking-page">
       <div className="exam-header">
          <div><h3 style={{margin:0}}>{exam.title}</h3></div>
          <div className={`timer-badge ${timeLeft && timeLeft < 300 ? 'warning' : ''}`}><FaClock /> {timeLeft !== null ? formatTime(timeLeft) : "--:--:--"}</div>
          <button className="btn-submit" onClick={() => handleSubmit(false)}>Nộp bài</button>
       </div>
       <div className="exam-body-container">
          {exam.sections?.map((sec: any) => (
             <div key={sec.id} className="section-block">
                <div className="section-title"><h4>{sec.title}</h4>{sec.description && <p>{sec.description}</p>}</div>
                {sec.media_url && <div style={{marginBottom:15}}><audio controls src={sec.media_url} style={{width:'100%'}}/></div>}
                
                {}
                {sec.questions?.map((q: any) => (
                   <QuestionRenderer 
                        key={q.id} 
                        question={q} 
                        answer={answers[q.id]} 
                        onAnswer={(val: any) => setAnswers({...answers, [q.id]: val})} 
                   />
                ))}
             </div>
          ))}
       </div>
    </div>
  );
};

export default ExamTakingPage;