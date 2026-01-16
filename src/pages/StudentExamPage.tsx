import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useClass } from '../contexts/ClassContext';
import { FaClock, FaPlayCircle, FaHistory, FaCheckCircle, FaEye, FaCalendarAlt } from 'react-icons/fa';

const StudentExamPage = () => {
  const { selectedClass } = useClass();
  const [exams, setExams] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedClass?.id) {
      api.get(`/exams/class/${selectedClass.id}`)
         .then(res => setExams(res.data))
         .catch(err => console.error(err));
    }
  }, [selectedClass]);

  const handleStartExam = (examId: number) => {
      navigate(`/take-exam/${examId}`);
  };

  const handleReview = (submissionId: number) => {
      navigate(`/exam-review/${submissionId}`);
  };

  return (
    <div style={{padding: 20}}>
      <h2>Bài kiểm tra của lớp {selectedClass?.name}</h2>
      <div className="exam-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:20, marginTop:20}}>
        {exams.map(exam => {
           const isUnlimited = exam.max_attempts === 999;
           const attemptsUsed = exam.attempt_count || 0;
           const attemptsRemaining = exam.max_attempts - attemptsUsed;
           
           
           const now = new Date();
           const startTime = new Date(exam.start_time);
           const endTime = new Date(exam.end_time);
           const isOpen = now >= startTime && now <= endTime;
           const isEnded = now > endTime;
           const isUpcoming = now < startTime;

           
           const canDo = (isUnlimited || attemptsRemaining > 0) && isOpen;

           return (
             <div key={exam.id} style={{background:'white', padding:20, borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.1)', display:'flex', flexDirection:'column'}}>
                <h3 style={{marginTop:0, marginBottom: 10}}>{exam.title}</h3>
                
                <div style={{color:'#555', marginBottom:15, fontSize:'0.9rem', flex: 1}}>
                   {}
                   <p style={{display:'flex', alignItems:'center', gap:8, margin:'5px 0'}}>
                      <FaCalendarAlt color="#28a745" /> 
                      <span>Mở: {startTime.toLocaleString()}</span>
                   </p>
                   <p style={{display:'flex', alignItems:'center', gap:8, margin:'5px 0'}}>
                      <FaCalendarAlt color="#dc3545" /> 
                      <span>Đóng: {endTime.toLocaleString()}</span>
                   </p>
                   
                   <div style={{borderTop:'1px dashed #eee', margin:'10px 0'}}></div>

                   <p style={{display:'flex', alignItems:'center', gap:8, margin:'5px 0'}}>
                      <FaClock color="#007bff" /> 
                      <span>Thời gian làm: <strong>{exam.duration_minutes} phút</strong></span>
                   </p>
                   <p style={{display:'flex', alignItems:'center', gap:8, margin:'5px 0'}}>
                      <FaHistory color="#666" /> 
                      <span>Số lần làm: {attemptsUsed} / {isUnlimited ? '∞' : exam.max_attempts}</span>
                   </p>
                   
                   {exam.best_score !== null && (
                      <p style={{display:'flex', alignItems:'center', gap:8, margin:'5px 0', color:'#28a745', fontWeight:'bold'}}>
                         <FaCheckCircle /> Điểm cao nhất: {exam.best_score}
                      </p>
                   )}
                </div>

                {}
                <div style={{marginBottom: 10, fontSize:'0.85rem', fontWeight:'bold', textAlign:'center'}}>
                    {isUpcoming && <span style={{color:'#e67e22'}}>⚠️ Chưa đến giờ làm bài</span>}
                    {isEnded && <span style={{color:'#dc3545'}}>⛔ Đã hết hạn nộp bài</span>}
                    {isOpen && <span style={{color:'#28a745'}}>✅ Đang mở</span>}
                </div>

                <div style={{display:'flex', gap:10}}>
                   {canDo ? (
                      <button 
                        onClick={() => handleStartExam(exam.id)}
                        style={{flex:1, padding:10, background:'#28a745', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:5}}
                      >
                        <FaPlayCircle /> Làm bài
                      </button>
                   ) : (
                      <button disabled style={{flex:1, padding:10, background:'#ccc', color:'#666', border:'none', borderRadius:4, cursor:'not-allowed'}}>
                         {isUpcoming ? 'Chưa mở' : (isEnded ? 'Hết hạn' : 'Hết lượt')}
                      </button>
                   )}

                   {exam.last_submission_id && (
                      <button 
                        onClick={() => handleReview(exam.last_submission_id)}
                        style={{flex:1, padding:10, background:'#007bff', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:5}}
                      >
                        <FaEye /> Xem lại
                      </button>
                   )}
                </div>
             </div>
           );
        })}
        {exams.length === 0 && <p style={{color:'#666', fontStyle:'italic'}}>Chưa có bài kiểm tra nào.</p>}
      </div>
    </div>
  );
};

export default StudentExamPage;