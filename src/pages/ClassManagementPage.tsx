import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/Dashboard.css';

interface ClassItem {
  id: number;
  name: string;
  school_year: string;
}

const ClassManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [newClassName, setNewClassName] = useState('');
  const [newSchoolYear, setNewSchoolYear] = useState('2024-2025');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (error) {
      console.error('Lỗi tải lớp', error);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName) return alert('Chưa nhập tên lớp');
    try {
      await api.post('/classes', { name: newClassName, school_year: newSchoolYear });
      alert('Thêm lớp thành công!');
      setShowModal(false);
      fetchClasses();
    } catch (error) {
      alert('Lỗi tạo lớp');
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm('Xóa lớp này sẽ xóa toàn bộ dữ liệu sổ điểm. Bạn chắc chứ?')) return;
    try {
      await api.delete(`/classes/${id}`);
      fetchClasses();
    } catch (error) {
      alert('Lỗi xóa lớp');
    }
  };

  const handleSelectClass = (cls: ClassItem) => {
    localStorage.setItem('selectedClassId', cls.id.toString());
    localStorage.setItem('selectedClassName', cls.name);

    navigate('/');
  };

  return (
    <div className="container" style={{ padding: 20 }}>
      <h1>QUẢN LÝ LỚP HỌC</h1>
      <button className="btn-submit" onClick={() => setShowModal(true)}>
        + Thêm Lớp Mới
      </button>

      <div
        className="class-grid"
        style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}
      >
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="card"
            style={{ padding: 20, border: '1px solid #ddd', width: 250, cursor: 'pointer' }}
            onClick={() => handleSelectClass(cls)}
          >
            <h2 style={{ color: '#2196f3' }}>{cls.name}</h2>
            <p>
              Năm học: <b>{cls.school_year}</b>
            </p>
            <div style={{ marginTop: 10 }}>
              <button
                style={{
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: 4,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClass(cls.id);
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            className="modal-content"
            style={{ background: 'white', padding: 30, borderRadius: 8, width: 400 }}
          >
            <h3>Thêm Lớp Mới</h3>
            <div style={{ marginBottom: 10 }}>
              <label>Tên Lớp (VD: 12A1):</label>
              <input
                type="text"
                className="form-control"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                style={{ width: '100%', padding: 8, marginTop: 5 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label>Năm Học:</label>
              <select
                className="form-control"
                value={newSchoolYear}
                onChange={(e) => setNewSchoolYear(e.target.value)}
                style={{ width: '100%', padding: 8, marginTop: 5 }}
              >
                <option>2023-2024</option>
                <option>2024-2025</option>
                <option>2025-2026</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn-submit" onClick={handleCreateClass}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagementPage;
