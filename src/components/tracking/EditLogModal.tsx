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
    
    
    const quantityInputRef = useRef<HTMLInputElement>(null);
    const noteInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        
        
        if (!data.isAbsence && quantityInputRef.current) {
            quantityInputRef.current.focus();
            quantityInputRef.current.select();
        } 
        
        else if (data.isAbsence && noteInputRef.current) {
            noteInputRef.current.focus();
        }
    }, [data.isAbsence]);

    const handleSave = () => {
        
        const finalQuantity = data.isAbsence ? 1 : addQuantity;
        onSave(finalQuantity, note);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <div className="trk-modal-overlay" onClick={onClose}>
            <div className="trk-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="trk-modal-header">
                    <h3>Ghi nhận: {data.violationName}</h3>
                    <button className="trk-btn-close" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="trk-modal-body">
                    <p className="trk-student-name">
                        Học sinh: <strong>{data.studentName}</strong>
                    </p>

                    <div className="trk-current-stat">
                        Số lượng hiện tại:{' '}
                        <span className="trk-badge-count">{data.currentQuantity}</span>
                    </div>

                    {}
                    {!data.isAbsence && (
                        <div className="trk-form-group">
                            <label>Thêm số lượng (+):</label>
                            <input
                                ref={quantityInputRef}
                                type="number"
                                min="1"
                                className="trk-form-control"
                                value={addQuantity}
                                onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    )}

                    <div className="trk-form-group">
                        {}
                        <label>{data.isAbsence ? 'Lý do nghỉ (bắt buộc/tùy chọn):' : 'Ghi chú (nếu có):'}</label>
                        <input
                            ref={noteInputRef}
                            type="text"
                            className="trk-form-control"
                            placeholder={data.isAbsence ? "Ví dụ: Bệnh, việc gia đình..." : "Ví dụ: Tiết 2, Bài số 3..."}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>

                <div className="trk-modal-footer">
                    <button className="trk-btn-cancel" onClick={onClose}>
                        Hủy
                    </button>
                    <button className="trk-btn-save" onClick={handleSave}>
                        {data.isAbsence ? 'Lưu Lý Do' : 'Thêm Mới'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditLogModal;