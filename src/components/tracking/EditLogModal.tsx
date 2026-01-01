import React, { useState, useEffect } from 'react';
import { EditingCellData } from '../../types/trackingTypes';

interface Props {
  data: EditingCellData;
  onClose: () => void;
  onSave: (quantity: number, note: string) => void;
}

const EditLogModal: React.FC<Props> = ({ data, onClose, onSave }) => {
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (data.isAbsence) {
        setQuantity(data.currentQuantity > 0 ? 1 : 0);
    } else {
        setQuantity(data.currentQuantity || 1);
    }
    setNote(data.currentNote || '');
  }, [data]);

  const handleSave = () => {
    onSave(quantity, note);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{data.studentName}</h3>
        <p className="modal-subtitle">{data.violationName}</p>
        
        {data.isAbsence ? (
          <div className="form-group-modal">
            <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input 
                type="checkbox" 
                checked={quantity > 0} 
                onChange={(e) => setQuantity(e.target.checked ? 1 : 0)}
                style={{width: 'auto', margin: 0}}
              /> 
              <span>Có vắng mặt (P)</span>
            </label>
          </div>
        ) : (
          <div className="form-group-modal">
            {}
            <label>
              {data.isBonus ? 'Số lần:' : 'Số lượng vi phạm (lần/tiết):'}
            </label>
            <input 
              type="number" 
              min="0" 
              value={quantity} 
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="input-qty"
              autoFocus 
            />
          </div>
        )}

        <div className="form-group-modal">
          <label>Ghi chú:</label>
          <textarea 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            placeholder="Nhập lý do hoặc chi tiết..."
            rows={3}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Hủy</button>
          <button className="btn-save" onClick={handleSave}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
};

export default EditLogModal;