import React from 'react';
import { GroupDetail } from '../../types/rankingTypes';

interface Props {
    groups: GroupDetail[];
}

const GroupDetailsGrid: React.FC<Props> = ({ groups }) => {
    return (
        <section className="group-grid">
            {groups.map((group) => (
                <div key={group.group_number} className="section-card group-detail-card">
                    <div className="group-header">
                        <h3 style={{ margin: 0 }}>Tổ {group.group_number}</h3>
                        <div style={{ fontWeight: 'bold', color: '#2563eb' }}>
                            Tổng: {group.total_group_points}
                        </div>
                    </div>
                    <table className="group-table">
                        <thead>
                            <tr>
                                <th className="text-left">Tên</th>
                                <th style={{ color: '#16a34a' }}>(+)</th>
                                <th style={{ color: '#dc2626' }}>(-)</th>
                                <th>Tổng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(group.members).length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>
                                        Chưa có điểm
                                    </td>
                                </tr>
                            ) : (
                                Object.values(group.members).map((mem, idx) => (
                                    <tr key={idx}>
                                        <td>{mem.name}</td>
                                        <td style={{ textAlign: 'center', color: '#16a34a' }}>
                                            {mem.plus > 0 ? `+${mem.plus}` : 0}
                                        </td>
                                        <td style={{ textAlign: 'center', color: '#dc2626' }}>
                                            {mem.minus}
                                        </td>
                                        <td
                                            style={{
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                                color: mem.total >= 0 ? '#16a34a' : '#dc2626',
                                            }}
                                        >
                                            {mem.total}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ))}
        </section>
    );
};

export default GroupDetailsGrid;
