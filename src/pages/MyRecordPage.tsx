import React, { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/MyRecordPage.css';

interface LogRecord {
    id: number;
    log_date: string;
    violation_name: string;
    category: string;
    points: number;
    quantity: number;
    reporter_name: string;
}

type ViewMode = 'week' | 'month' | 'year';

const MyRecordPage: React.FC = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<LogRecord[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);

    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(false);

    // Tính toán ngày bắt đầu và kết thúc dựa trên viewMode và currentDate
    const { startDate, endDate, label } = useMemo(() => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);
        let lbl = '';

        if (viewMode === 'week') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2 là đầu tuần
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);

            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);

            lbl = `Tuần từ ${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
        } else if (viewMode === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);

            end.setMonth(start.getMonth() + 1);
            end.setDate(0); // Ngày cuối tháng
            end.setHours(23, 59, 59, 999);

            lbl = `Tháng ${start.getMonth() + 1}/${start.getFullYear()}`;
        } else if (viewMode === 'year') {
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);

            end.setMonth(11, 31);
            end.setHours(23, 59, 59, 999);

            lbl = `Năm ${start.getFullYear()}`;
        }

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            label: lbl,
        };
    }, [viewMode, currentDate]);

    useEffect(() => {
        const fetchMyLogs = async () => {
            setLoading(true);
            try {
                // Gửi kèm tham số startDate và endDate để lọc
                const res = await api.get('/reports/my-logs', {
                    params: { startDate, endDate },
                });
                setLogs(res.data);

                const total = res.data.reduce((sum: number, item: LogRecord) => {
                    return sum + item.points * item.quantity;
                }, 0);
                setTotalPoints(total);
            } catch (error) {
                console.error('Lỗi tải dữ liệu', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyLogs();
    }, [startDate, endDate]);

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else if (viewMode === 'year') newDate.setFullYear(newDate.getFullYear() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else if (viewMode === 'year') newDate.setFullYear(newDate.getFullYear() + 1);
        setCurrentDate(newDate);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="record-container">
            <header className="record-header">
                <button onClick={() => (window.location.href = '/')} className="back-btn">
                    ← Trang chủ
                </button>
                <h2>Hạnh Kiểm: {user?.full_name}</h2>
            </header>

            {/* Bộ điều khiển Filter */}
            <div className="filter-controls" style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div className="view-mode-tabs" style={{ marginBottom: '15px' }}>
                    <button
                        className={`mode-btn ${viewMode === 'week' ? 'active' : ''}`}
                        onClick={() => setViewMode('week')}
                    >
                        Tuần
                    </button>
                    <button
                        className={`mode-btn ${viewMode === 'month' ? 'active' : ''}`}
                        onClick={() => setViewMode('month')}
                    >
                        Tháng
                    </button>
                    <button
                        className={`mode-btn ${viewMode === 'year' ? 'active' : ''}`}
                        onClick={() => setViewMode('year')}
                    >
                        Năm
                    </button>
                </div>

                <div
                    className="time-nav"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '15px',
                    }}
                >
                    <button onClick={handlePrev} className="nav-btn">
                        ❮ Trước
                    </button>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', minWidth: '200px' }}>
                        {label}
                    </span>
                    <button onClick={handleNext} className="nav-btn">
                        Sau ❯
                    </button>
                    <button
                        onClick={handleToday}
                        className="today-btn"
                        style={{ marginLeft: '10px' }}
                    >
                        Hiện tại
                    </button>
                </div>
            </div>

            <div className="summary-card">
                <h3>
                    Điểm thi đua (
                    {viewMode === 'week' ? 'Tuần' : viewMode === 'month' ? 'Tháng' : 'Năm'})
                </h3>
                <div className={`score ${totalPoints >= 0 ? 'positive' : 'negative'}`}>
                    {loading ? '...' : totalPoints > 0 ? `+${totalPoints}` : totalPoints}
                </div>
            </div>

            <div className="history-table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Ngày</th>
                            <th>Nội dung</th>
                            <th>Loại</th>
                            <th>Người ghi</th>
                            <th>Điểm</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="no-data">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="no-data">
                                    Không có ghi nhận nào trong khoảng thời gian này.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.log_date).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        {log.violation_name}{' '}
                                        {log.quantity > 1 ? `(x${log.quantity})` : ''}
                                    </td>
                                    <td>
                                        <span
                                            className={`tag tag-${log.category.replace(/\s/g, '-')}`}
                                        >
                                            {log.category}
                                        </span>
                                    </td>
                                    <td>{log.reporter_name}</td>
                                    <td className={log.points > 0 ? 'p-plus' : 'p-minus'}>
                                        {log.points * log.quantity}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                .mode-btn {
                    padding: 8px 16px;
                    border: 1px solid #ddd;
                    background: #f5f5f5;
                    cursor: pointer;
                    margin: 0 2px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .mode-btn.active {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }
                .nav-btn, .today-btn {
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .nav-btn:hover, .today-btn:hover {
                    background: #f0f0f0;
                }
            `}</style>
        </div>
    );
};

export default MyRecordPage;
