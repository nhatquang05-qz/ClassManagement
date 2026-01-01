import React, { useEffect, useState } from 'react';
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

const MyRecordPage: React.FC = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<LogRecord[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);

    useEffect(() => {
        const fetchMyLogs = async () => {
            try {
                const res = await api.get('/reports/my-logs');
                setLogs(res.data);

                const total = res.data.reduce((sum: number, item: LogRecord) => {
                    return sum + item.points * item.quantity;
                }, 0);
                setTotalPoints(total);
            } catch (error) {
                console.error('Lỗi tải dữ liệu', error);
            }
        };
        fetchMyLogs();
    }, []);

    return (
        <div className="record-container">
            <header className="record-header">
                <button onClick={() => (window.location.href = '/')} className="back-btn">
                    ← Trang chủ
                </button>
                <h2>Hạnh Kiểm: {user?.full_name}</h2>
            </header>

            <div className="summary-card">
                <h3>Tổng điểm thi đua</h3>
                <div className={`score ${totalPoints >= 0 ? 'positive' : 'negative'}`}>
                    {totalPoints > 0 ? '+' : ''}
                    {totalPoints}
                </div>
                <p>Học kỳ 1 - Năm học 2024-2025</p>
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
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="no-data">
                                    Chưa có ghi nhận nào (Ngoan quá!)
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
        </div>
    );
};

export default MyRecordPage;
