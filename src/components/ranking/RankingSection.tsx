import React from 'react';
import { Ranking } from '../../types/rankingTypes';

interface Props {
    rankings: Ranking[];
}

const RankingSection: React.FC<Props> = ({ rankings }) => {
    const top1 = rankings[0];
    const top2 = rankings[1];
    const top3 = rankings[2];
    const rest = rankings.slice(3);

    return (
        <section className="section-card ranking-section">
            <h2 className="section-title" style={{ color: '#1e293b', textAlign: 'center' }}>
                🏆 Xếp Hạng Tổ Thi Đua 🏆
            </h2>

            <div
                className="ranking-podium"
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    gap: '20px',
                    marginBottom: '30px',
                    paddingTop: '20px',
                }}
            >
                {top2 && (
                    <div
                        className="rank-card top-2"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transform: 'scale(0.9)',
                            opacity: 0.9,
                        }}
                    >
                        <div style={{ fontSize: '2rem' }}>🥈</div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            Tổ {top2.group_number}
                        </div>
                        <div className="rank-score" style={{ color: '#64748b' }}>
                            {top2.total_points} điểm
                        </div>
                    </div>
                )}

                {top1 && (
                    <div
                        className="rank-card top-1"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transform: 'scale(1.3)',
                            zIndex: 10,
                            border: '2px solid #eab308',
                            borderRadius: '12px',
                            padding: '15px',
                            backgroundColor: '#fffbeb',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <div style={{ fontSize: '2.5rem' }}>👑</div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#b45309' }}>
                            Tổ {top1.group_number}
                        </div>
                        <div
                            className="rank-score"
                            style={{ fontWeight: 'bold', color: '#d97706' }}
                        >
                            {top1.total_points} điểm
                        </div>
                    </div>
                )}

                {top3 && (
                    <div
                        className="rank-card top-3"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transform: 'scale(0.85)',
                            opacity: 0.8,
                        }}
                    >
                        <div style={{ fontSize: '2rem' }}>🥉</div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            Tổ {top3.group_number}
                        </div>
                        <div className="rank-score" style={{ color: '#78350f' }}>
                            {top3.total_points} điểm
                        </div>
                    </div>
                )}
            </div>

            {rest.length > 0 && (
                <div
                    className="ranking-list"
                    style={{
                        marginTop: '20px',
                        borderTop: '1px solid #e2e8f0',
                        paddingTop: '20px',
                    }}
                >
                    {rest.map((rank, index) => (
                        <div
                            key={rank.group_number}
                            className="rank-card"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '10px',
                                margin: '5px 0',
                                background: '#f8fafc',
                                borderRadius: '8px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 'bold', color: '#64748b' }}>
                                    #{index + 4}
                                </span>
                                <span>Tổ {rank.group_number}</span>
                            </div>
                            <div className="rank-score">{rank.total_points} điểm</div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default RankingSection;
