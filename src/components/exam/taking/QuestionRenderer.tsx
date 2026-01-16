import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaArrowDown, FaTimes } from 'react-icons/fa';

const MatchingQuestion = ({ data, value, onChange }: any) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const pairs = value || {};

  const handleLeftClick = (text: string) => { if (!pairs[text]) setSelectedLeft(text); };
  const handleRightClick = (rightText: string) => {
    if (selectedLeft) { onChange({ ...pairs, [selectedLeft]: rightText }); setSelectedLeft(null); }
  };
  const removePair = (leftText: string) => { const n = { ...pairs }; delete n[leftText]; onChange(n); };
  const isRightMatched = (text: string) => Object.values(pairs).includes(text);

  return (
    <div className="matching-container">
      <div className="col-left">
        {data.pairs?.map((p: any, idx: number) => (
          <div key={idx} className={`match-item left ${selectedLeft === p.left ? 'selected' : ''} ${pairs[p.left] ? 'matched' : ''}`} onClick={() => handleLeftClick(p.left)}>
            {p.left}
          </div>
        ))}
      </div>
      <div className="col-right">
        {data.pairs?.map((p: any, idx: number) => (
          <div key={idx} className={`match-item right ${isRightMatched(p.right) ? 'matched' : ''}`} onClick={() => !isRightMatched(p.right) && handleRightClick(p.right)}>
            {p.right}
          </div>
        ))}
      </div>
      <div className="matched-results">
        <strong>Đã nối:</strong>
        <div className="pair-tags">
           {Object.entries(pairs).map(([l, r]: any) => (
             <span key={l} className="pair-tag">{l} ↔ {r} <button onClick={() => removePair(l)}><FaTimes /></button></span>
           ))}
        </div>
      </div>
    </div>
  );
};

const OrderingQuestion = ({ data, value, onChange }: any) => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (value && value.length > 0) setItems(value);
    else if (data.items) setItems([...data.items]);
  }, [data, value]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    if (direction === 'up' && index > 0) [newItems[index], newItems[index-1]] = [newItems[index-1], newItems[index]];
    else if (direction === 'down' && index < newItems.length-1) [newItems[index], newItems[index+1]] = [newItems[index+1], newItems[index]];
    setItems(newItems); onChange(newItems);
  };

  return (
    <div className="ordering-container">
      {items.map((item: any, index: number) => (
        <div key={index} className="order-item">
          <div className="order-actions">
            <button disabled={index===0} onClick={() => moveItem(index, 'up')}><FaArrowUp/></button>
            <button disabled={index===items.length-1} onClick={() => moveItem(index, 'down')}><FaArrowDown/></button>
          </div>
          <div className="order-content"><span className="index-badge">{index+1}</span>{item.text}</div>
        </div>
      ))}
    </div>
  );
};

const QuestionRenderer = ({ question, answer, onAnswer }: any) => {
   const { type, content, media_url, content_data, points } = question;
   const data = typeof content_data === 'string' ? JSON.parse(content_data) : content_data;
   
   return (
     <div className="question-card" style={{background:'white', padding:20, marginBottom:20, borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
        <div style={{marginBottom:15, fontSize:'1.1rem', fontWeight:600}}>
           <span style={{color:'#007bff', marginRight:8}}>Câu hỏi:</span> 
           {content} <span style={{fontSize:'0.8rem', color:'#999', fontWeight:'normal'}}>({points} điểm)</span>
        </div>
        {media_url && <div style={{marginBottom:15, textAlign:'center'}}>{question.media_type === 'audio' ? <audio controls src={media_url} style={{width:'100%'}}/> : <img src={media_url} style={{maxWidth:'100%', maxHeight:300}}/>}</div>}

        {type === 'multiple_choice' && <div className="mc-options">{data.options?.map((opt:any) => (<label key={opt.id} className={`mc-label ${answer === opt.id ? 'selected' : ''}`}><input type="radio" name={`q-${question.id}`} checked={answer === opt.id} onChange={() => onAnswer(opt.id)}/>{opt.text}</label>))}</div>}
        {(type === 'fill_in_blank' || type === 'fill_blank') && <div className="fill-blank-area"><input type="text" className="fill-input" value={answer || ''} onChange={(e) => onAnswer(e.target.value)} placeholder="Nhập câu trả lời..."/></div>}
        {type === 'matching' && <MatchingQuestion data={data} value={answer} onChange={onAnswer} />}
        {(type === 'ordering' || type === 'reorder') && <OrderingQuestion data={data} value={answer} onChange={onAnswer} />}
     </div>
   );
};

export default QuestionRenderer;