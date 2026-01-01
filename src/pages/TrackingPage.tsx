import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import DailyTrackingTable from '../components/tracking/DailyTrackingTable';
import HistoryLogTable from '../components/tracking/HistoryLogTable'; 
import { Student, ViolationType, DailyLogPayload } from '../types/trackingTypes';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/TrackingPage.css';

// Hàm helper: Lấy chuỗi YYYY-MM-DD theo giờ địa phương (Fix lỗi lệch ngày)
const getSafeDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Hàm tạo danh sách ngày (T2 -> T7) chuẩn xác
const getWeekDates = (weekNo: number, year: number) => {
    const simple = new Date(year, 0, 1 + (weekNo - 1) * 7);
    const dow = simple.getDay();
    const weekStart = simple;
    // Tìm ngày thứ 2 đầu tuần
    if (dow <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else weekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const dates = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        // Dùng hàm safe string thay vì toISOString()
        dates.push(getSafeDateString(d)); 
    }
    return dates;
};

const TrackingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const [students, setStudents] = useState<Student[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [existingLogs, setExistingLogs] = useState<DailyLogPayload[]>([]);
  
  const currentYear = new Date().getFullYear();
  const [currentRealWeek] = useState(getWeekNumber(new Date()));
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));
  
  const [loading, setLoading] = useState(true);

  const weekDates = useMemo(() => getWeekDates(selectedWeek, currentYear), [selectedWeek, currentYear]);

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
        const points = log.points !== undefined ? log.points : (violationTypes.find(v => v.id === log.violation_type_id)?.points || 0);
        if (students.find(s => s.id === log.student_id)) {
            total += (points * (log.quantity || 1));
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
        year: currentYear
      });
      alert("Lưu thành công!");
      
      const res = await api.get(`/reports/weekly?week=${selectedWeek}&group_number=${user?.group_number || ''}`);
      setExistingLogs(res.data);
      
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi khi lưu sổ.");
    }
  };

  const handleDeleteLog = async (logId: number) => {
    if (!canEdit) {
        alert("Bạn không có quyền chỉnh sửa tuần này!");
        return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa dòng ghi nhận này?")) return;
    
    try {
        await api.delete(`/reports/${logId}`);
        const res = await api.get(`/reports/weekly?week=${selectedWeek}&group_number=${user?.group_number || ''}`);
        setExistingLogs(res.data);
    } catch (error: any) {
        console.error("Lỗi xóa log:", error);
        alert(error.response?.data?.message || "Không thể xóa.");
    }
  };

  return (
    <div className="tracking-page">
      <div className="tracking-header-modern">
        <div className="header-top">
            <button onClick={() => navigate(-1)} className="btn-back-modern">
                <span>←</span> Quay lại
            </button>
            <h1 className="page-title">SỔ THEO DÕI {user?.group_number ? `- TỔ ${user.group_number}` : ''}</h1>
        </div>

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
      
      <div className="page-content">
        {loading ? (
            <div className="loading-container" style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                Đang tải dữ liệu tuần {selectedWeek}...
            </div>
        ) : (
            <>
                <DailyTrackingTable 
                    students={students} 
                    violationTypes={violationTypes} 
                    initialData={existingLogs}
                    isReadOnly={!canEdit}
                    weekDates={weekDates}
                    onSubmit={handleSubmit} 
                />
                
                <HistoryLogTable 
                    logs={existingLogs} 
                    onDelete={handleDeleteLog} 
                />
            </>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;