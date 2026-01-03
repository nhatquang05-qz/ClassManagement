import React, { useState, useMemo } from 'react';
import { DailyLogPayload } from '../../types/trackingTypes';
import '../../assets/styles/TrackingTable.css';

interface Props {
    logs: DailyLogPayload[];
    onDelete: (id: number) => void;
    activeDate?: string | null;
    viewMode?: 'day' | 'week'; 
}

const HistoryLogTable: React.FC<Props> = ({ 
    logs = [], 
    onDelete, 
    activeDate, 
    viewMode = 'week' 
}) => {
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    const categories = useMemo(() => {
        if (!Array.isArray(logs)) return [];
        const cats = new Set(logs.map((l) => l.category).filter(Boolean));
        return Array.from(cats);
    }, [logs]);

    const getWeekRange = (dateStr: string) => {
        const current = new Date(dateStr);
        if (isNaN(current.getTime())) return null;

        current.setHours(0, 0, 0, 0);
        const day = current.getDay(); 
        const distanceToMonday = day === 0 ? 6 : day - 1;
        
        const startOfWeek = new Date(current);
        startOfWeek.setDate(current.getDate() - distanceToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); 
        endOfWeek.setHours(23, 59, 59, 999);

        return { start: startOfWeek, end: endOfWeek };
    };

    const filteredLogs = useMemo(() => {
        if (!Array.isArray(logs)) return [];

        const lowerSearch = searchTerm.toLowerCase().trim();

        return logs.filter((log) => {
            
            if (activeDate && log.log_date) {
                if (viewMode === 'day') {
                    if (log.log_date.slice(0, 10) !== activeDate.slice(0, 10)) {
                        return false;
                    }
                } else {
                    
                    const range = getWeekRange(activeDate);
                    if (range) {
                        const logDate = new Date(log.log_date);
                        logDate.setHours(0, 0, 0, 0);
                        if (logDate.getTime() < range.start.getTime() || logDate.getTime() > range.end.getTime()) {
                            return false;
                        }
                    }
                }
            }

            if (filterCategory !== 'all' && log.category !== filterCategory) return false;

            if (lowerSearch) {
                const matchName = log.student_name?.toLowerCase().includes(lowerSearch);
                const matchViolation = log.violation_name?.toLowerCase().includes(lowerSearch);
                if (!matchName && !matchViolation) return false;
            }

            return true;
        });
    }, [logs, activeDate, viewMode, searchTerm, filterCategory]);

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateOnly = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            const datePart = dateStr.slice(0, 10); 
            const [year, month, day] = datePart.split('-');
            return `${day}/${month}`;
        } catch (e) { return dateStr; }
    };

    const getDisplayTitle = () => {
        if (!activeDate) return 'Cả Tuần';
        
        if (viewMode === 'day') {
            return `Ngày ${formatDateOnly(activeDate)}`;
        }

        const range = getWeekRange(activeDate);
        if (range) {
            const s = range.start;
            const e = range.end;
            const startStr = `${s.getDate().toString().padStart(2, '0')}/${(s.getMonth() + 1).toString().padStart(2, '0')}`;
            const endStr = `${e.getDate().toString().padStart(2, '0')}/${(e.getMonth() + 1).toString().padStart(2, '0')}`;
            return `Tuần từ ${startStr} đến ${endStr}`;
        }
        
        return 'Cả Tuần';
    };

    return (
        <div className="trk-history-container">
            <div className="trk-history-header">
                <h3 className="history-title">
                    📋 Nhật Ký Hoạt Động 
                    <span style={{ fontWeight: 'normal', fontSize: '0.9em', marginLeft: '10px', color: '#666' }}>
                        ({getDisplayTitle()})
                    </span>
                </h3>
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
                        <option key={cat as string} value={cat as string}>
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
                                    {viewMode === 'day' 
                                        ? `Chưa có ghi nhận nào trong ngày ${formatDateOnly(activeDate || undefined)}.`
                                        : "Chưa có dữ liệu nào trong tuần này."}
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
                                            {formatTime(log.created_at)} <br/>
                                            {formatDateOnly(log.created_at)}
                                        </td>
                                        <td style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>
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