import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import DailyTrackingTable from '../components/tracking/DailyTrackingTable';
import { Student, ViolationType, DailyLogPayload } from '../types/trackingTypes';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/TrackingPage.css';


const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const TrackingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const [students, setStudents] = useState<Student[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [existingLogs, setExistingLogs] = useState<DailyLogPayload[]>([]);
  
  const [currentRealWeek] = useState(getWeekNumber(new Date()));
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));
  
  const [loading, setLoading] = useState(true);

  
  const canEdit = useMemo(() => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'group_leader') return selectedWeek === currentRealWeek;
    return false; 
  }, [user, selectedWeek, currentRealWeek]);

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [vRes, sRes] = await Promise.all([
             api.get('/violations'),
             api.get(user?.role === 'group_leader' ? `/users?group_number=${user.group_number}` : '/users')
        ]);
        setViolationTypes(vRes.data);
        setStudents(sRes.data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu gốc:", error);
      }
    };
    fetchBaseData();
  }, [user]);

  useEffect(() => {
    const fetchWeekData = async () => {
      setLoading(true);
      try {
        let url = `/reports/weekly?week=${selectedWeek}`;
        if (user?.role === 'group_leader' && user.group_number) {
            url += `&group_number=${user.group_number}`;
        }
        const res = await api.get(url);
        setExistingLogs(res.data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu tuần:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchWeekData();
  }, [selectedWeek, user]);

  const groupTotalScore = useMemo(() => {
    let total = 0;
    existingLogs.forEach(log => {
        if (students.find(s => s.id === log.student_id)) {
            const vType = violationTypes.find(v => v.id === log.violation_type_id);
            if (vType) total += (vType.points * (log.quantity || 1));
        }
    });
    return total;
  }, [existingLogs, students, violationTypes]);

  const handleSubmit = async (logs: DailyLogPayload[]) => {
    if (!canEdit) {
        alert("Bạn không có quyền chỉnh sửa tuần này!");
        return;
    }
    
    if (!window.confirm(`Xác nhận lưu sổ cho Tuần ${selectedWeek}?`)) return;

    try {
      await api.post('/reports/bulk', {
        reports: logs,
        reporter_id: user?.id,
        week_number: selectedWeek,
        year: new Date().getFullYear()
      });
      alert("Lưu thành công!");
      const res = await api.get(`/reports/weekly?week=${selectedWeek}&group_number=${user?.group_number || ''}`);
      setExistingLogs(res.data);
      
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi khi lưu sổ.");
    }
  };

  return (
    <div className="tracking-page">
      {}
      <div className="tracking-header-modern">
        
        {}
        <div className="header-top">
            <button onClick={() => navigate(-1)} className="btn-back-modern">
                <span>←</span> Quay lại
            </button>
            <h1 className="page-title">SỔ THEO DÕI {user?.group_number ? `- TỔ ${user.group_number}` : ''}</h1>
        </div>

        {}
        <div className="week-control-area">
            <button 
                className="btn-nav" 
                disabled={selectedWeek <= 1} 
                onClick={() => setSelectedWeek(p => p - 1)}
                title="Tuần trước"
            >
                ❮
            </button>
            
            <div className="week-display">
                <span className="week-label">ĐANG XEM</span>
                <span className="week-number">TUẦN {selectedWeek}</span>
                {selectedWeek === currentRealWeek && (
                    <span className="badge-current">Tuần hiện tại</span>
                )}
            </div>

            <button 
                className="btn-nav" 
                disabled={selectedWeek >= 52} 
                onClick={() => setSelectedWeek(p => p + 1)}
                title="Tuần sau"
            >
                ❯
            </button>
        </div>

        {}
        <div className="info-bar">
            <div className="info-card">
                <div className="info-icon user-icon">👤</div>
                <div className="info-content">
                    <span className="info-label">Người chấm</span>
                    <span className="info-value">{user?.full_name}</span>
                </div>
            </div>

            <div className="info-card">
                <div className="info-icon score-icon">📊</div>
                <div className="info-content">
                    <span className="info-label">Tổng điểm tổ</span>
                    <span className={`info-value score-value ${groupTotalScore >= 0 ? 'positive' : 'negative'}`}>
                        {groupTotalScore > 0 ? `+${groupTotalScore}` : groupTotalScore}
                    </span>
                </div>
            </div>
        </div>
      </div>
      
      {}
      <div className="page-content">
        {loading ? (
            <div className="loading-container" style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                Đang tải dữ liệu tuần {selectedWeek}...
            </div>
        ) : (
            <DailyTrackingTable 
                students={students} 
                violationTypes={violationTypes} 
                initialData={existingLogs}
                isReadOnly={!canEdit}
                onSubmit={handleSubmit} 
            />
        )}
      </div>
    </div>
  );
};

export default TrackingPage;