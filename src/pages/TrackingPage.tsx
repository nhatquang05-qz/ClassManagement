import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import DailyTrackingTable from '../components/tracking/DailyTrackingTable';
import { Student, ViolationType, DailyLogPayload } from '../types/trackingTypes';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/TrackingPage.css';

const TrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy danh sách các lỗi vi phạm
        const violationRes = await api.get('/violations');
        setViolationTypes(violationRes.data);

        // 2. Lấy danh sách học sinh
        // Nếu là tổ trưởng -> chỉ lấy tổ viên. Nếu là lớp trưởng/admin -> lấy cả lớp.
        let url = '/users';
        if (user?.role === 'group_leader' && user.group_number) {
            url = `/users?group_number=${user.group_number}`;
        }
        
        const studentRes = await api.get(url);
        setStudents(studentRes.data);

      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        alert("Không thể tải dữ liệu lớp học. Hãy kiểm tra Backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSubmit = async (logs: DailyLogPayload[]) => {
    if (logs.length === 0) {
      alert("Bạn chưa ghi nhận lỗi nào!");
      return;
    }

    if (!window.confirm(`Xác nhận ghi nhận ${logs.length} lỗi/điểm cộng?`)) return;

    try {
      // Gửi dữ liệu lên Server
      await api.post('/reports/bulk', {
        reports: logs,
        reporter_id: user?.id,
        log_date: new Date().toISOString().split('T')[0] // Lấy ngày hôm nay YYYY-MM-DD
      });
      
      alert("Ghi sổ thành công!");
      window.location.reload(); // Tải lại trang để reset bảng
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu sổ. Vui lòng thử lại.");
    }
  };

  if (loading) return <div className="loading-container">Đang tải sổ theo dõi...</div>;

  return (
    <div className="tracking-page">
      <header className="page-header">
        <button onClick={() => window.history.back()} className="back-btn">← Quay lại</button>
        <div className="header-info">
            <h1>SỔ THEO DÕI</h1>
            <p>
                Người chấm: <b>{user?.full_name}</b> 
                {user?.group_number ? ` - Tổ ${user.group_number}` : ''}
            </p>
        </div>
      </header>
      
      <div className="page-content">
        <div className="date-badge">
          Ngày: <b>{new Date().toLocaleDateString('vi-VN')}</b>
        </div>
        
        {/* Component bảng chấm điểm */}
        <DailyTrackingTable 
          students={students} 
          violationTypes={violationTypes} 
          onSubmit={handleSubmit} 
        />
      </div>
    </div>
  );
};

export default TrackingPage;