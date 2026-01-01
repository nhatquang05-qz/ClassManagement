import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useClass } from '../contexts/ClassContext';

import '../assets/styles/ClassSelection.css';

const ClassSelectionPage = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const { setSelectedClass } = useClass();
  const navigate = useNavigate();

  useEffect(() => {
    
    api.get('/classes')
      .then(res => setClasses(res.data))
      .catch(err => console.error("Lỗi lấy danh sách lớp", err));
  }, []);

  
  const handleSelectClass = (cls: any) => {
    setSelectedClass(cls);
    navigate('/tracking'); 
  };

  
  const handleManageStudents = (e: React.MouseEvent, cls: any) => {
    e.stopPropagation(); 
    setSelectedClass(cls); 
    navigate('/students'); 
  };

  return (
    <div className="class-selection-container">
      <div className="page-header">
        <h1>Danh sách lớp quản lý</h1>
        {}
        <button className="btn-add-class" onClick={() => navigate('/classes')}>
            + Quản lý Lớp học
        </button>
      </div>
      
      {classes.length === 0 ? (
        <div className="empty-state">
            <p>Bạn chưa quản lý lớp học nào.</p>
            <p>Bấm "Quản lý Lớp học" để tạo lớp mới.</p>
        </div>
      ) : (
        <div className="class-grid">
            {classes.map(cls => (
            <div key={cls.id} className="class-card" onClick={() => handleSelectClass(cls)}>
                <div>
                    <h2>{cls.name}</h2>
                    <p>Năm học: <b>{cls.school_year}</b></p>
                </div>
                
                <div className="card-actions">
                    <button 
                        className="btn-manage-student"
                        onClick={(e) => handleManageStudents(e, cls)}
                    >
                        👥 Quản lý HS
                    </button>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ClassSelectionPage;