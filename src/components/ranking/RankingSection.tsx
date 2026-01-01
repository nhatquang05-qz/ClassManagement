import React from 'react';
import { Ranking } from '../../types/rankingTypes';

interface Props {
    rankings: Ranking[];
}

const RankingSection: React.FC<Props> = ({ rankings }) => {
    return (
        <section className="section-card ranking-section">
            <h2 className="section-title" style={{ color: '#1e293b' }}>
                🏆 Xếp Hạng Tổ Thi Đua 🏆
            </h2>
            <div className="ranking-list">
                {rankings.map((rank, index) => (
                    <div
                        key={rank.group_number}
                        className={`rank-card ${index === 0 ? 'top-1' : ''}`}
                    >
                        <div>
                            {index === 0 ? '👑 ' : ''}Tổ {rank.group_number}
                        </div>
                        <div className="rank-score">{rank.total_points} điểm</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default RankingSection;
