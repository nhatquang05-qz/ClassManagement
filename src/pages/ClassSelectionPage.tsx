import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/ClassSelection.css';

interface ClassItem {
  id: number;
  name: string;
  school_year: string;
}

const ClassSelectionPage = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const { setSelectedClass } = useClass();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/classes')
      .then(res => setClasses(res.data))
      .catch(err => console.error("Lỗi lấy danh sách lớp", err));
  }, []);

  const handleSelectClass = (cls: ClassItem) => {
    setSelectedClass(cls);
    navigate('/'); 
  };

  const handleManageStudents = (e: React.MouseEvent, cls: ClassItem) => {
    e.stopPropagation();
    setSelectedClass(cls);
    navigate('/students'); 
  };

  
  return (
    <div className="dashboard-layout">
      {}
      <aside className="sidebar">
        <div className="logo-area">
          <span>⚡ ClassManager</span>
        </div>
        <div className="menu-item active">
          <span>🏠</span> Trang Chủ
        </div>
        <div className="menu-item" onClick={() => navigate('/classes')}>
          <span>📚</span> Quản Lý Lớp
        </div>
        <div className="menu-item">
          <span>⚙️</span> Cài Đặt
        </div>
      </aside>

      {}
      <main className="main-content">
        <header className="page-header">
          <div className="welcome-text">
            <h1>Xin chào, {user?.full_name || 'Giáo viên'}!</h1>
            <p>Hôm nay bạn muốn làm việc với lớp nào?</p>
          </div>
          <button className="btn-create" onClick={() => navigate('/classes')}>
            <span>+</span> Tạo Lớp Mới
          </button>
        </header>

        {classes.length === 0 ? (
          <div className="empty-state">
             <div style={{fontSize: 50, marginBottom: 20}}>🚀</div>
             <h3 style={{color: 'white'}}>Chưa có lớp học nào</h3>
             <p style={{color: '#94a3b8'}}>Hãy tạo lớp học đầu tiên để bắt đầu quản lý</p>
          </div>
        ) : (
          <div className="class-grid">
            {classes.map((cls) => (
              <div 
                key={cls.id} 
                className="glass-card" 
                onClick={() => handleSelectClass(cls)}
              >
                <div className="card-header">
                  <div className="card-info">
                    <h2>Lớp {cls.name}</h2>
                    <span>Niên khóa: {cls.school_year}</span>
                  </div>
                  <div className="class-icon-box">
                    🎓
                  </div>
                </div>

                <div className="card-stats">
                  <div className="stat-item">
                    <span>📅</span> <b>Tuần 14</b>
                  </div>
                  <div className="stat-item">
                     <span>👥</span> <b>45 HS</b>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="btn-action primary">
                    Vào Sổ Ngay
                  </button>
                  <button 
                    className="btn-action"
                    onClick={(e) => handleManageStudents(e, cls)}
                  >
                    Học Sinh
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClassSelectionPage;