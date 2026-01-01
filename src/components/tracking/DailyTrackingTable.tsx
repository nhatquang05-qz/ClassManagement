import React, { useState, useEffect, useMemo } from 'react';
import '../../assets/styles/TrackingTable.css';
import { Student, ViolationType, DailyLogPayload } from '../../types/trackingTypes';

interface Props {
  students: Student[];
  violationTypes: ViolationType[];
  initialData: DailyLogPayload[]; 
  isReadOnly: boolean; 
  onSubmit: (logs: DailyLogPayload[]) => void;
}


const COLUMNS_CONFIG = [
  { key: 'Vắng (P)', label: 'P', group: 'GIỜ GIẤC', subGroup: 'Vắng' },
  { key: 'Vắng (K)', label: 'K', group: 'GIỜ GIẤC', subGroup: 'Vắng' },
  { key: 'Đi trễ', label: 'Trễ', group: 'GIỜ GIẤC', subGroup: null },
  { key: 'Bỏ tiết', label: 'Bỏ tiết', group: 'GIỜ GIẤC', subGroup: null },
  { key: 'Không làm bài tập', label: 'Làm BT', group: 'HỌC TẬP', subGroup: 'KHÔNG' },
  { key: 'Không chuẩn bị bài', label: 'Soạn bài', group: 'HỌC TẬP', subGroup: 'KHÔNG' },
  { key: 'Không thuộc bài', label: 'Thuộc bài', group: 'HỌC TẬP', subGroup: 'KHÔNG' },
  { key: 'Trực nhật', label: 'Trực nhật', group: 'NỀ NẾP', subGroup: null }, 
  { key: 'Mất vệ sinh', label: 'Giữ vệ sinh', group: 'NỀ NẾP', subGroup: null },
  { key: 'Sai đồng phục', label: 'Đồng phục', group: 'NỀ NẾP', subGroup: null },
  { key: 'Mất trật tự', label: 'Giữ trật tự', group: 'NỀ NẾP', subGroup: null },
  { key: 'Đánh nhau', label: 'Đánh nhau', group: 'MẮC THÁI ĐỘ SAI', subGroup: null },
  { key: 'Nói tục', label: 'Nói tục', group: 'MẮC THÁI ĐỘ SAI', subGroup: null },
  { key: 'Vô lễ', label: 'Vô lễ', group: 'MẮC THÁI ĐỘ SAI', subGroup: null },
  { key: 'Điểm 1-4', label: '1-4', group: 'ĐIỂM TRẢ BÀI', subGroup: null }, 
  { key: 'Điểm kiểm tra 5-7', label: '5-7', group: 'ĐIỂM TRẢ BÀI', subGroup: null },
  { key: 'Điểm kiểm tra 8-10', label: '8-10', group: 'ĐIỂM TRẢ BÀI', subGroup: null },
  { key: 'Phát biểu', label: 'Tham gia', group: 'PHÁT BIỂU', subGroup: null },
];

const DailyTrackingTable: React.FC<Props> = ({ students, violationTypes, initialData, isReadOnly, onSubmit }) => {
  const [logs, setLogs] = useState<Record<string, boolean>>({});

  const violationMap = useMemo(() => {
    const map: Record<string, ViolationType> = {};
    violationTypes.forEach(v => {
      map[v.name.toLowerCase()] = v;
    });
    return map;
  }, [violationTypes]);

  const getViolationIdByKey = (key: string): number | undefined => {
    const lowerKey = key.toLowerCase();
    if (violationMap[lowerKey]) return violationMap[lowerKey].id;
    const found = Object.values(violationMap).find(v => v.name.toLowerCase().includes(lowerKey));
    return found?.id;
  };

  
  useEffect(() => {
    const newLogs: Record<string, boolean> = {};
    initialData.forEach(item => {
        const key = `${item.student_id}-${item.violation_type_id}`;
        newLogs[key] = true;
    });
    setLogs(newLogs);
  }, [initialData]);

  const handleCheck = (studentId: number, violationId: number) => {
    if (isReadOnly) return; 
    const key = `${studentId}-${violationId}`;
    setLogs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const calculateStudentScore = (studentId: number) => {
    let total = 0; 
    COLUMNS_CONFIG.forEach(col => {
        const vId = getViolationIdByKey(col.key);
        if (vId && logs[`${studentId}-${vId}`]) {
            const v = violationTypes.find(type => type.id === vId);
            if (v) total += v.points;
        }
    });
    return total;
  };

  
  
  
  const handleSubmit = () => {
    const payload: DailyLogPayload[] = [];
    Object.keys(logs).forEach(key => {
      if (logs[key]) {
        const [studentId, violationId] = key.split('-').map(Number);
        payload.push({
          student_id: studentId,
          violation_type_id: violationId,
          quantity: 1
        });
      }
    });
    onSubmit(payload);
  };
    
    
  const sortedStudents = useMemo(() => {
    const sorted = [...students];
    return sorted.sort((a, b) => {
      const groupA = a.group_number || 999; 
      const groupB = b.group_number || 999;
      if (groupA !== groupB) return groupA - groupB;
      return (a.full_name || '').localeCompare(b.full_name || '');
    });
  }, [students]);

  const getPointDisplay = (key: string) => {
    const id = getViolationIdByKey(key);
    if (!id) return '';
    const violation = violationTypes.find(v => v.id === id);
    if (!violation) return '';
    return violation.points > 0 ? `+${violation.points}` : violation.points;
  };

  return (
    <div className="tracking-container">
      <div className="table-wrapper">
        <table className="tracking-table">
          <thead>
            <tr>
              <th rowSpan={4} className="sticky-col stt-col" style={{ left: 0, zIndex: 21, minWidth: '40px', textAlign: 'center', verticalAlign: 'middle' }}>STT</th>
              <th rowSpan={4} className="sticky-col name-col" style={{ left: '40px', zIndex: 21, padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', minHeight: '40px' }}>Họ và tên</div>
              </th>
              {}
              <th rowSpan={4} className="sticky-col total-col" style={{ zIndex: 20, minWidth: '60px', backgroundColor: '#f8f9fa' }}>Tổng</th>
              
              <th colSpan={4} className="group-header">GIỜ GIẤC</th>
              <th colSpan={3} className="group-header">HỌC TẬP</th>
              <th colSpan={4} className="group-header">NỀ NẾP</th>
              <th colSpan={3} className="group-header">MẮC THÁI ĐỘ SAI</th>
              <th colSpan={3} className="group-header">ĐIỂM TRẢ BÀI</th>
              <th colSpan={1} className="group-header">PHÁT BIỂU</th>
            </tr>
            <tr>
              <th colSpan={2} className="sub-group-header">Vắng</th>
              <th rowSpan={2} className="th-rotate"><div><span>Trễ</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Bỏ tiết</span></div></th>
              <th colSpan={3} className="sub-group-header">KHÔNG</th>
              <th rowSpan={2} className="th-rotate"><div><span>Trực nhật</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Giữ vệ sinh</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Đồng phục</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Giữ trật tự</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Đánh nhau</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Nói tục</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Vô lễ</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>1-4</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>5-7</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>8-10</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Tham gia</span></div></th>
            </tr>
            <tr>
              <th>P</th>
              <th>K</th>
              <th className="th-rotate"><div><span>Làm BT</span></div></th>
              <th className="th-rotate"><div><span>Soạn bài</span></div></th>
              <th className="th-rotate"><div><span>Thuộc bài</span></div></th>
            </tr>
            <tr className="points-row">
              {COLUMNS_CONFIG.map((col, index) => (
                <th key={`point-${index}`} className="text-center text-xs font-semibold" style={{ color: '#555' }}>
                  {getPointDisplay(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {sortedStudents.map((student, index) => {
              const totalScore = calculateStudentScore(student.id);
              return (
                <tr key={student.id}>
                  <td className="sticky-col stt-col" style={{ left: 0, textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                  <td className="sticky-col name-col" style={{ left: '40px' }}>
                    <span className="name">{student.full_name}</span>
                  </td>
                  {}
                  <td className="text-center font-bold" style={{ color: totalScore < 0 ? 'red' : 'blue' }}>
                    {totalScore > 0 ? `+${totalScore}` : totalScore}
                  </td>

                  {COLUMNS_CONFIG.map((col, colIndex) => {
                    const violationId = getViolationIdByKey(col.key);
                    if (!violationId) return <td key={colIndex} className="checkbox-cell disabled bg-gray-100"></td>;

                    const isChecked = logs[`${student.id}-${violationId}`] || false;
                    const violation = violationTypes.find(v => v.id === violationId);
                    const isBonus = (violation?.points || 0) > 0;

                    return (
                      <td key={`${student.id}-${colIndex}`} className={`checkbox-cell ${isBonus ? 'bonus-cell' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleCheck(student.id, violationId)}
                          disabled={isReadOnly} 
                          title={violation?.name} 
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!isReadOnly && (
        <div className="action-bar">
          <button className="btn-submit" onClick={handleSubmit}>Lưu Sổ Tuần Này</button>
        </div>
      )}
    </div>
  );
};

export default DailyTrackingTable;