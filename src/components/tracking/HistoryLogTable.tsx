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

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            if (activeTab === 'day' && activeDate) {
                if (log.log_date !== activeDate) return false;
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
        return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    return (
        <div className="history-container">
            <div className="history-header">
                <h3 className="history-title">📋 Nhật Ký Hoạt Động</h3>

                <div className="history-tabs">
                    <button
                        className={`history-tab-btn ${activeTab === 'day' ? 'active' : ''}`}
                        onClick={() => setActiveTab('day')}
                        disabled={!activeDate}
                        title={
                            !activeDate ? 'Chọn một ngày cụ thể ở bảng trên để xem log ngày đó' : ''
                        }
                    >
                        Theo Ngày {activeDate ? `(${formatDateOnly(activeDate)})` : ''}
                    </button>
                    <button
                        className={`history-tab-btn ${activeTab === 'week' ? 'active' : ''}`}
                        onClick={() => setActiveTab('week')}
                    >
                        Cả Tuần
                    </button>
                </div>
            </div>

            <div className="history-filters">
                <input
                    type="text"
                    placeholder="🔍 Tìm tên học sinh hoặc lỗi..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="filter-select"
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

            <div className="table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th style={{ width: '140px' }}>Thời gian</th>
                            <th style={{ width: '90px' }}>Ngày</th>
                            <th>Học sinh</th>
                            <th>Nội dung</th>
                            <th>Nhóm</th>
                            <th style={{ width: '50px' }}>SL</th>
                            <th style={{ width: '60px' }}>Điểm</th>
                            <th>Ghi chú</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="history-empty">
                                    Không tìm thấy dữ liệu phù hợp.
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
                                        <td style={{ fontWeight: 'bold', textAlign: 'left' }}>
                                            {log.student_name}
                                        </td>
                                        <td style={{ textAlign: 'left' }}>{log.violation_name}</td>
                                        <td style={{ fontSize: '12px' }}>{log.category}</td>
                                        <td>{log.quantity}</td>
                                        <td
                                            style={{
                                                color: isBonus ? 'blue' : 'red',
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
                                            }}
                                        >
                                            {log.note || ''}
                                        </td>
                                        <td>
                                            {canDelete && (
                                                <button
                                                    className="btn-delete-icon"
                                                    onClick={() => log.id && onDelete(log.id)}
                                                    title="Xóa"
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
