import React, { useState, useEffect, useMemo } from 'react';
import '../../assets/styles/TrackingTable.css';
import { Student, ViolationType, DailyLogPayload, EditingCellData } from '../../types/trackingTypes';
import EditLogModal from './EditLogModal';

interface Props {
  students: Student[];
  violationTypes: ViolationType[];
  initialData: DailyLogPayload[]; 
  isReadOnly: boolean; 
  weekDates: string[]; 
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

const DAYS_LABEL = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const DailyTrackingTable: React.FC<Props> = ({ students, violationTypes, initialData, isReadOnly, weekDates, onSubmit }) => {
  const [logs, setLogs] = useState<DailyLogPayload[]>([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0); 
  const [editingCell, setEditingCell] = useState<EditingCellData | null>(null);

  const activeDate = weekDates[activeDayIndex];

  // Đồng bộ dữ liệu khi props thay đổi (khi load lại trang hoặc lưu thành công)
  useEffect(() => {
    setLogs(initialData);
  }, [initialData]);

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

  const findLog = (studentId: number, violationId: number, date: string) => {
    return logs.find(l => 
      l.student_id === studentId && 
      l.violation_type_id === violationId && 
      l.log_date === date
    );
  };

  const calculateStudentScore = (studentId: number) => {
    let total = 0; 
    logs.filter(l => l.student_id === studentId).forEach(log => {
        const v = violationTypes.find(type => type.id === log.violation_type_id);
        const points = log.points !== undefined ? log.points : (v?.points || 0);
        total += (points * (log.quantity || 1));
    });
    return total;
  };

  // Helper: Xóa các loại vắng khác của cùng HS ngày hôm đó
  const removeOtherAbsenceTypes = (currentLogs: DailyLogPayload[], studentId: number, date: string, excludeViolationId: number) => {
    const absenceP_ID = getViolationIdByKey('Vắng (P)');
    const absenceK_ID = getViolationIdByKey('Vắng (K)');
    
    return currentLogs.filter(l => {
        const isTarget = l.student_id === studentId && l.log_date === date;
        if (!isTarget) return true; 

        // Nếu là log Vắng mà khác với loại đang tick -> Xóa
        if ((l.violation_type_id === absenceP_ID || l.violation_type_id === absenceK_ID) && l.violation_type_id !== excludeViolationId) {
            return false; 
        }
        return true;
    });
  };

  const handleCellClick = (student: Student, colKey: string, subGroup: string | null) => {
    if (isReadOnly) return;
    
    const violationId = getViolationIdByKey(colKey);
    if (!violationId) return;

    const violationType = violationTypes.find(v => v.id === violationId);
    const isBonus = (violationType?.points || 0) > 0;
    const existingLog = findLog(student.id, violationId, activeDate);

    // --- LOGIC CHO CÁC Ô VẮNG (Tự động Toggle & Exclusive) ---
    if (subGroup === 'Vắng') {
        setLogs(prev => {
            // 1. Xóa các loại vắng khác (P hoặc K)
            let newLogs = removeOtherAbsenceTypes(prev, student.id, activeDate, violationId);
            
            // 2. Tìm xem loại vắng NÀY đã có chưa để Toggle
            const exists = newLogs.find(l => l.student_id === student.id && l.violation_type_id === violationId && l.log_date === activeDate);
            
            if (exists) {
                // Đang có -> Xóa (Toggle OFF)
                newLogs = newLogs.filter(l => l !== exists);
            } else {
                // Chưa có -> Thêm (Toggle ON)
                newLogs.push({
                    student_id: student.id,
                    violation_type_id: violationId,
                    quantity: 1,
                    log_date: activeDate,
                    note: ''
                });
            }
            return newLogs;
        });
        return; // Dừng, không hiện Modal
    }

    // --- LOGIC CHO CÁC LỖI KHÁC (Hiện Modal) ---
    setEditingCell({
        studentId: student.id,
        violationId: violationId,
        violationName: colKey,
        studentName: student.full_name,
        isAbsence: false, // Các lỗi khác không phải Vắng
        isBonus: isBonus,
        currentQuantity: existingLog ? existingLog.quantity : 0,
        currentNote: existingLog?.note || ''
    });
  };

  const handleSaveModal = (quantity: number, note: string) => {
    if (!editingCell) return;

    setLogs(prev => {
        // Xóa log cũ để cập nhật mới
        const newLogs = prev.filter(l => !(
            l.student_id === editingCell.studentId && 
            l.violation_type_id === editingCell.violationId && 
            l.log_date === activeDate
        ));

        if (quantity > 0) {
            newLogs.push({
                student_id: editingCell.studentId,
                violation_type_id: editingCell.violationId,
                quantity: quantity,
                log_date: activeDate,
                note: note
            });
        }
        return newLogs;
    });
    setEditingCell(null);
  };

  const getPointDisplay = (key: string) => {
    const id = getViolationIdByKey(key);
    if (!id) return '';
    const violation = violationTypes.find(v => v.id === id);
    if (!violation) return '';
    return violation.points > 0 ? `+${violation.points}` : violation.points;
  };

  // Helper để hiển thị ngày trên Tab
  const getDisplayDate = (dateStr: string) => {
      if(!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}`;
  };

  return (
    <div className="tracking-container">
      <div className="day-tabs">
        {DAYS_LABEL.map((day, index) => (
            <button 
                key={day} 
                className={`day-tab ${activeDayIndex === index ? 'active' : ''}`}
                onClick={() => setActiveDayIndex(index)}
            >
                {day} <span className="date-small">({getDisplayDate(weekDates[index])})</span>
            </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="tracking-table">
          <thead>
            <tr>
              <th rowSpan={4} className="sticky-col stt-col" style={{ left: 0, zIndex: 21 }}>STT</th>
              <th rowSpan={4} className="sticky-col name-col" style={{ left: '40px', zIndex: 21 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Họ và tên</div>
              </th>
              <th rowSpan={4} className="sticky-col total-col" style={{ zIndex: 20 }}>Tổng</th>
              <th colSpan={4} className="group-header">GIỜ GIẤC</th>
              <th colSpan={3} className="group-header">HỌC TẬP</th>
              <th colSpan={4} className="group-header">NỀ NẾP</th>
              <th colSpan={3} className="group-header">MẮC THÁI ĐỘ SAI</th>
              <th colSpan={3} className="group-header">ĐIỂM TRẢ BÀI</th>
              <th colSpan={1} className="group-header">PHÁT BIỂU</th>
            </tr>
            <tr>
              <th colSpan={2} className="sub-group-header">Vắng</th>
              {/* Các cột khác giữ nguyên */}
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
                <th key={`point-${index}`} className="text-center text-xs" style={{ color: '#555' }}>
                  {getPointDisplay(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {students.map((student, index) => {
              const totalScore = calculateStudentScore(student.id);
              return (
                <tr key={student.id}>
                  <td className="sticky-col stt-col" style={{ left: 0 }}>{index + 1}</td>
                  <td className="sticky-col name-col" style={{ left: '40px' }}>
                    <span className="name">{student.full_name}</span>
                  </td>
                  <td className="text-center font-bold" style={{ color: totalScore < 0 ? 'red' : 'blue' }}>
                    {totalScore > 0 ? `+${totalScore}` : totalScore}
                  </td>

                  {COLUMNS_CONFIG.map((col, colIndex) => {
                    const violationId = getViolationIdByKey(col.key);
                    if (!violationId) return <td key={colIndex} className="checkbox-cell disabled"></td>;

                    const log = findLog(student.id, violationId, activeDate);
                    const quantity = log?.quantity || 0;
                    const isBonus = (violationTypes.find(v => v.id === violationId)?.points || 0) > 0;
                    const hasNote = log?.note && log.note.trim() !== '';

                    return (
                      <td 
                        key={`${student.id}-${colIndex}`} 
                        className={`checkbox-cell ${isBonus ? 'bonus-cell' : ''} ${quantity > 0 ? 'has-data' : ''}`}
                        onClick={() => handleCellClick(student, col.key, col.subGroup)}
                      >
                         {col.subGroup === 'Vắng' ? (
                            <div className="cell-content">
                                <input 
                                    type="checkbox" 
                                    checked={quantity > 0} 
                                    readOnly 
                                    style={{pointerEvents: 'none'}} 
                                />
                                {hasNote && <span className="note-indicator">📝</span>}
                            </div>
                         ) : (
                            <div className="cell-content">
                                {quantity > 0 && <span className="quantity-badge">{quantity}</span>}
                                {hasNote && <span className="note-indicator">📝</span>}
                            </div>
                         )}
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
          <button className="btn-submit" onClick={() => onSubmit(logs)}>Lưu Sổ Cả Tuần</button>
        </div>
      )}

      {editingCell && (
        <EditLogModal 
            data={editingCell} 
            onClose={() => setEditingCell(null)} 
            onSave={handleSaveModal} 
        />
      )}
    </div>
  );
};

export default DailyTrackingTable;