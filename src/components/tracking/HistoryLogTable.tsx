import React from 'react';
import { DailyLogPayload } from '../../types/trackingTypes';
import '../../assets/styles/TrackingTable.css';

interface Props {
  logs: DailyLogPayload[];
  onDelete: (id: number) => void; // Thêm prop này
}

const HistoryLogTable: React.FC<Props> = ({ logs, onDelete }) => {
  if (!logs || logs.length === 0) {
    return <div className="history-empty">Chưa có dữ liệu ghi nhận trong tuần này.</div>;
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} ${date}`;
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="history-container">
      <h3 className="history-title">📋 Lịch sử chi tiết</h3>
      <div className="table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th style={{width: '160px'}}>Thời gian ghi</th>
              <th style={{width: '100px'}}>Ngày vi phạm</th>
              <th>Học sinh</th>
              <th>Nội dung</th>
              <th style={{width: '50px'}}>SL</th>
              <th style={{width: '60px'}}>Điểm</th>
              <th>Ghi chú</th>
              <th style={{width: '60px'}}>Xóa</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => {
               const totalPoints = (log.points || 0) * log.quantity;
               const isBonus = totalPoints > 0;
               // Chỉ hiển thị nút xóa nếu bản ghi đã được lưu (có ID)
               const canDelete = !!log.id;
               
               return (
                <tr key={log.id || index} className="history-row">
                  <td style={{fontSize: '13px', color: '#555'}}>
                    {formatDateTime(log.created_at)}
                  </td>
                  <td style={{fontSize: '13px'}}>
                     {formatDateOnly(log.log_date)}
                  </td>
                  <td style={{fontWeight: 'bold', textAlign: 'left'}}>{log.student_name}</td>
                  <td style={{textAlign: 'left'}}>{log.violation_name}</td>
                  <td>{log.quantity}</td>
                  <td style={{
                      color: isBonus ? 'blue' : 'red', 
                      fontWeight: 'bold'
                  }}>
                    {totalPoints > 0 ? `+${totalPoints}` : totalPoints}
                  </td>
                  <td style={{textAlign: 'left', fontStyle: 'italic', color: '#666', fontSize: '13px'}}>
                    {log.note || '-'}
                  </td>
                  <td>
                    {canDelete && (
                        <button 
                            className="btn-delete-icon" 
                            onClick={() => log.id && onDelete(log.id)}
                            title="Xóa dòng này"
                        >
                            🗑️
                        </button>
                    )}
                  </td>
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryLogTable;