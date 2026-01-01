import React, { useState, useEffect } from 'react';
import '../../assets/styles/TrackingTable.css';
import { Student, ViolationType, DailyLogPayload } from '../../types/trackingTypes';

interface Props {
  students: Student[];
  violationTypes: ViolationType[];
  onSubmit: (logs: DailyLogPayload[]) => void;
}

const DailyTrackingTable: React.FC<Props> = ({ students, violationTypes, onSubmit }) => {
  const [logs, setLogs] = useState<Record<string, boolean>>({});

  const handleCheck = (studentId: number, violationId: number) => {
    const key = `${studentId}-${violationId}`;
    setLogs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = () => {
    const payload: DailyLogPayload[] = [];
    Object.keys(logs).forEach(key => {
      if (logs[key]) {
        const [studentId, violationId] = key.split('-').map(Number);
        payload.push({
          student_id: studentId,
          violation_type_id: violationId,
          quantity: 1
        });
      }
    });
    onSubmit(payload);
  };

  return (
    <div className="tracking-container">
      <div className="table-wrapper">
        <table className="tracking-table">
          <thead>
            <tr>
              <th className="sticky-col name-col">Họ và tên</th>
              {violationTypes.map(v => (
                <th key={v.id} className={`th-rotate category-${v.category.replace(/\s/g, '-')}`}>
                  <div><span>{v.name} ({v.points})</span></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id}>
                <td className="sticky-col name-col">{student.full_name}</td>
                {violationTypes.map(v => {
                  const isChecked = logs[`${student.id}-${v.id}`] || false;
                  return (
                    <td key={v.id} className="checkbox-cell">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleCheck(student.id, v.id)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="action-bar">
        <button className="btn-submit" onClick={handleSubmit}>Lưu Sổ Theo Dõi</button>
      </div>
    </div>
  );
};

export default DailyTrackingTable;