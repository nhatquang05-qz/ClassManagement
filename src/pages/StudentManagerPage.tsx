import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const StudentManagerPage = () => {
    const classId = localStorage.getItem('selectedClassId');
    const className = localStorage.getItem('selectedClassName');
    const [file, setFile] = useState<File | null>(null);
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        if(classId) fetchStudents();
    }, [classId]);

    const fetchStudents = async () => {
        const res = await api.get(`/users?class_id=${classId}`);
        setStudents(res.data);
    };

    const handleUpload = async () => {
        if (!file || !classId) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('class_id', classId);

        try {
            await api.post('/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Import thành công!');
            fetchStudents();
        } catch (error) {
            alert('Lỗi import');
        }
    };
    
    
    const toggleLock = async (id: number, currentStatus: number) => {
        await api.put(`/users/${id}`, { is_locked: currentStatus === 0 ? 1 : 0 });
        fetchStudents();
    };

    return (
        <div style={{padding: 20}}>
            <h2>Danh sách học sinh lớp {className}</h2>
            
            <div style={{border: '1px solid #ccc', padding: 15, marginBottom: 20, borderRadius: 8}}>
                <h4>Nhập danh sách từ Excel</h4>
                <p style={{fontSize: 13, color: '#666'}}>File Excel cần có cột: <b>HoTen</b> và <b>To</b></p>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                <button onClick={handleUpload} style={{marginLeft: 10, background: 'green', color: 'white', padding: '5px 10px', border: 'none'}}>Upload</button>
            </div>

            <table className="tracking-table" style={{width: '100%'}}>
                <thead>
                    <tr>
                        <th>Tên</th>
                        <th>Tổ</th>
                        <th>Username</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => (
                        <tr key={s.id}>
                            <td>{s.full_name}</td>
                            <td>{s.group_number}</td>
                            <td>{s.username}</td>
                            <td style={{color: s.is_locked ? 'red' : 'green'}}>
                                {s.is_locked ? 'Đã khóa' : 'Hoạt động'}
                            </td>
                            <td>
                                <button onClick={() => toggleLock(s.id, s.is_locked)}>
                                    {s.is_locked ? 'Mở khóa' : 'Khóa'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
export default StudentManagerPage;