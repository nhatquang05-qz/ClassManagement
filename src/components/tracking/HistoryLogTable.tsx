import React, { useState, useMemo, useEffect } from 'react';
import { DailyLogPayload } from '../../types/trackingTypes';
import '../../assets/styles/TrackingTable.css';

interface Props {
    logs: DailyLogPayload[];
    onDelete: (id: number) => void;
    activeDate?: string; 
}

const HistoryLogTable: React.FC<Props> = ({ logs, onDelete, activeDate }) => {
    
    const [activeTab, setActiveTab] = useState<'day' | 'week'>('week');
    
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    
    useEffect(() => {
        if (activeDate) {
            setActiveTab('day');
        } else {
            setActiveTab('week');
        }
    }, [activeDate]);

    
    const categories = useMemo(() => {
        const cats = new Set(logs.map((l) => l.category).filter(Boolean));
        return Array.from(cats);
    }, [logs]);

    
    const isSameDate = (d1?: string, d2?: string) => {
        if (!d1 || !d2) return false;
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    };

    
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            
            
            if (activeTab === 'day' && activeDate) {
                if (!isSameDate(log.log_date, activeDate)) return false;
            }

            
            const lowerSearch = searchTerm.toLowerCase();
            const matchName = log.student_name?.toLowerCase().includes(lowerSearch);
            const matchViolation = log.violation_name?.toLowerCase().includes(lowerSearch);
            
            
            if (searchTerm && !matchName && !matchViolation) return false;

            
            if (filterCategory !== 'all' && log.category !== filterCategory) return false;

            return true;
        });
    }, [logs, activeTab, activeDate, searchTerm, filterCategory]);

    
    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        
        if (isNaN(d.getTime())) return dateStr;
        
        const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const date = d.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
        return `${time} ${date}`;
    };

    
    const formatDateOnly = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    return (
        <div className="trk-history-container">
            <div className="trk-history-header">
                <h3 className="history-title">📋 Nhật Ký Hoạt Động</h3>

                <div className="trk-history-tabs">
                    <button
                        className={`trk-history-tab-btn ${activeTab === 'day' ? 'active' : ''}`}
                        onClick={() => setActiveTab('day')}
                        disabled={!activeDate} 
                        style={{ opacity: !activeDate ? 0.5 : 1, cursor: !activeDate ? 'not-allowed' : 'pointer' }}
                        title={!activeDate ? 'Chọn một ngày cụ thể ở bảng trên để xem log ngày đó' : ''}
                    >
                        Theo Ngày {activeDate ? `(${formatDateOnly(activeDate)})` : ''}
                    </button>
                    <button
                        className={`trk-history-tab-btn ${activeTab === 'week' ? 'active' : ''}`}
                        onClick={() => setActiveTab('week')}
                    >
                        Cả Tuần
                    </button>
                </div>
            </div>

            <div className="trk-history-filters">
                <input
                    type="text"
                    placeholder="🔍 Tìm tên học sinh hoặc lỗi..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="trk-filter-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="all">Tất cả nhóm</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat as string}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            <div className="trk-table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th style={{ width: '130px' }}>Thời gian</th>
                            <th style={{ width: '80px' }}>Ngày</th>
                            <th>Học sinh</th>
                            <th>Nội dung</th>
                            <th>Nhóm</th>
                            <th style={{ width: '50px', textAlign: 'center' }}>SL</th>
                            <th style={{ width: '60px', textAlign: 'center' }}>Điểm</th>
                            <th>Ghi chú</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="trk-history-empty">
                                    {activeTab === 'day' && activeDate 
                                        ? `Chưa có ghi nhận nào trong ngày ${formatDateOnly(activeDate)}.`
                                        : "Không tìm thấy dữ liệu phù hợp."}
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log, index) => {
                                const totalPoints = (log.points || 0) * log.quantity;
                                const isBonus = totalPoints > 0;
                                const canDelete = !!log.id; 

                                return (
                                    <tr key={log.id || index} className="history-row">
                                        <td style={{ fontSize: '12px', color: '#666' }}>
                                            {formatDateTime(log.created_at)}
                                        </td>
                                        <td style={{ fontSize: '13px' }}>
                                            {formatDateOnly(log.log_date)}
                                        </td>
                                        <td style={{ fontWeight: 'bold', textAlign: 'left', color: '#2c3e50' }}>
                                            {log.student_name}
                                        </td>
                                        <td style={{ textAlign: 'left' }}>
                                            <span className={`badge-violation ${isBonus ? 'positive' : 'negative'}`}>
                                                 {log.violation_name}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px' }}>{log.category}</td>
                                        <td style={{ textAlign: 'center' }}>{log.quantity}</td>
                                        <td
                                            style={{
                                                textAlign: 'center',
                                                color: isBonus ? '#16a34a' : '#dc2626',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {totalPoints > 0 ? `+${totalPoints}` : totalPoints}
                                        </td>
                                        <td
                                            style={{
                                                textAlign: 'left',
                                                fontStyle: 'italic',
                                                color: '#666',
                                                fontSize: '12px',
                                                maxWidth: '200px',
                                                whiteSpace: 'normal' 
                                            }}
                                        >
                                            {log.note || ''}
                                        </td>
                                        <td>
                                            {canDelete && (
                                                <button
                                                    className="trk-btn-delete-icon"
                                                    onClick={() => log.id && onDelete(log.id)}
                                                    title="Xóa ghi nhận này"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistoryLogTable;