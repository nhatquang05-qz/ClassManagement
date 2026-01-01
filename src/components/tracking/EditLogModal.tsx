import React, { useState, useEffect, useRef } from 'react';
import { EditingCellData } from '../../types/trackingTypes';
import '../../assets/styles/TrackingTable.css';

interface Props {
  data: EditingCellData;
  onClose: () => void;
  onSave: (quantityToAdd: number, note: string) => void;
}

const EditLogModal: React.FC<Props> = ({ data, onClose, onSave }) => {
  const [addQuantity, setAddQuantity] = useState(1);
  const [note, setNote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSave = () => {
    onSave(addQuantity, note);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Ghi nhận: {data.violationName}</h3>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p className="student-name">
            Học sinh: <strong>{data.studentName}</strong>
          </p>

          <div className="current-stat">
            Số lượng hiện tại: <span className="badge-count">{data.currentQuantity}</span>
          </div>

          <div className="form-group">
            <label>Thêm số lượng (+):</label>
            <input
              ref={inputRef}
              type="number"
              min="1"
              className="form-control"
              value={addQuantity}
              onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="form-group">
            <label>Ghi chú (nếu có):</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ví dụ: Tiết 2, Bài số 3..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-save" onClick={handleSave}>
            Thêm Mới
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLogModal;
