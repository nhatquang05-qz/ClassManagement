import React, { useState, useMemo } from 'react';
import '../../assets/styles/TrackingTable.css';
import { Student, ViolationType, DailyLogPayload } from '../../types/trackingTypes';

interface Props {
  students: Student[];
  violationTypes: ViolationType[];
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

  
  { key: 'Điểm kiểm tra 1-4', label: '1-4', group: 'ĐIỂM TRẢ BÀI', subGroup: null }, 
  { key: 'Điểm kiểm tra 5-7', label: '5-7', group: 'ĐIỂM TRẢ BÀI', subGroup: null },
  { key: 'Điểm kiểm tra 8-10', label: '8-10', group: 'ĐIỂM TRẢ BÀI', subGroup: null },

  
  { key: 'Phát biểu', label: 'Tham gia', group: 'PHÁT BIỂU', subGroup: null },
];

const DailyTrackingTable: React.FC<Props> = ({ students, violationTypes, onSubmit }) => {
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

  const handleCheck = (studentId: number, violationId: number) => {
    const key = `${studentId}-${violationId}`;
    setLogs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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

  return (
    <div className="tracking-container">
      <div className="table-wrapper">
        <table className="tracking-table">
          <thead>
            {}
            <tr>
              <th rowSpan={3} className="sticky-col name-col" style={{ zIndex: 20 }}>Họ và tên</th>
              <th colSpan={4} className="group-header">GIỜ GIẤC</th>
              <th colSpan={3} className="group-header">HỌC TẬP</th>
              <th colSpan={4} className="group-header">NỀ NẾP</th>
              <th colSpan={3} className="group-header">MẮC THÁI ĐỘ SAI</th>
              <th colSpan={3} className="group-header">ĐIỂM TRẢ BÀI</th>
              <th colSpan={1} className="group-header">PHÁT BIỂU</th>
            </tr>
            
            {}
            <tr>
              {}
              <th colSpan={2} className="sub-group-header">Vắng</th>
              <th rowSpan={2} className="th-rotate"><div><span>Trễ</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Bỏ tiết</span></div></th>

              {}
              <th colSpan={3} className="sub-group-header">KHÔNG</th>

              {}
              <th rowSpan={2} className="th-rotate"><div><span>Trực nhật</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Giữ vệ sinh</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Đồng phục</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Giữ trật tự</span></div></th>

              {}
              <th rowSpan={2} className="th-rotate"><div><span>Đánh nhau</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Nói tục</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>Vô lễ</span></div></th>

              {}
              <th rowSpan={2} className="th-rotate"><div><span>1-4</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>5-7</span></div></th>
              <th rowSpan={2} className="th-rotate"><div><span>8-10</span></div></th>

              {}
              <th rowSpan={2} className="th-rotate"><div><span>Tham gia</span></div></th>
            </tr>

            {}
            <tr>
              {}
              <th>P</th>
              <th>K</th>

              {}
              <th className="th-rotate"><div><span>Làm BT</span></div></th>
              <th className="th-rotate"><div><span>Soạn bài</span></div></th>
              <th className="th-rotate"><div><span>Thuộc bài</span></div></th>
            </tr>
          </thead>
          
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id}>
                <td className="sticky-col name-col">
                  <div className="stt-name">
                    <span className="stt">{index + 1}</span>
                    <span className="name">{student.full_name}</span>
                  </div>
                </td>
                {COLUMNS_CONFIG.map((col, colIndex) => {
                  const violationId = getViolationIdByKey(col.key);
                  
                  if (!violationId) {
                    return <td key={colIndex} className="checkbox-cell disabled bg-gray-100"></td>;
                  }

                  const isChecked = logs[`${student.id}-${violationId}`] || false;
                  
                  const violation = violationTypes.find(v => v.id === violationId);
                  const isBonus = (violation?.points || 0) > 0;

                  return (
                    <td key={`${student.id}-${colIndex}`} className={`checkbox-cell ${isBonus ? 'bonus-cell' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleCheck(student.id, violationId)}
                        title={violation?.name} 
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="action-bar">
        <button className="btn-submit" onClick={handleSubmit}>Lưu Sổ Theo Dõi</button>
      </div>
    </div>
  );
};

export default DailyTrackingTable;