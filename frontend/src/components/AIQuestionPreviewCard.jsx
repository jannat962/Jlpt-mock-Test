import React from 'react';

const AIQuestionPreviewCard = ({
  q,
  idx,
  editingQuestionIdx,
  setEditingQuestionIdx,
  updateGenQ,
  updateGenQOption,
  toggleRationale,
  expandedRationale,
  handleRegenerateQuestion,
  isRegeneratingIdx,
  getDistractorRationales
}) => {
  const isExpanded = expandedRationale.has(idx);
  const isEditing = editingQuestionIdx === idx;
  return (
    <div className="q-preview-card">
      <div className="q-preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="q-preview-number">Q{idx + 1}</span>
          <span className="q-preview-meta">{q.type} • {q.difficulty}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className={`engine-badge ${q.source?.toLowerCase().includes('local') ? 'fallback' : 'ai'}`}>{q.source || 'AI Core'}</span>
          <button className="regen-btn" onClick={() => handleRegenerateQuestion(idx)} disabled={isRegeneratingIdx === idx}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            {isRegeneratingIdx === idx ? 'Regenerating...' : 'Regen'}
          </button>
          <button className="edit-question-btn" onClick={() => setEditingQuestionIdx(isEditing ? -1 : idx)}>
            {isEditing ? '✓ Done' : '✏️ Edit'}
          </button>
        </div>
      </div>
      {isEditing ? (
        <textarea className="inline-edit-input" rows="3" value={q.question_text} onChange={e => updateGenQ(idx, 'question_text', e.target.value)} style={{ marginBottom: '0.75rem', width: '100%', padding: '0.5rem' }} />
      ) : (
        <p className="q-preview-text">{q.question_text}</p>
      )}
      <div className="question-options-list">
        {q.options.map((opt, oi) => {
          const isCorrect = oi === q.correct_index;
          return (
            <div key={oi} className={`gen-option-card ${isCorrect ? 'correct' : ''}`}>
              {isEditing ? (
                <>
                  <input type="radio" name={`correct-gen-${idx}`} checked={isCorrect} onChange={() => updateGenQ(idx, 'correct_index', oi)} style={{ accentColor: '#6366f1' }} />
                  <span className="opt-letter">{String.fromCharCode(65 + oi)}.</span>
                  <input className="inline-edit-input" value={opt} onChange={e => updateGenQOption(idx, oi, e.target.value)} style={{ flex: 1, padding: '0.3rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                </>
              ) : (
                <>
                  <span className="opt-letter">{String.fromCharCode(65 + oi)}.</span>
                  <span className="opt-text">{opt}</span>
                  {isCorrect && <span className="correct-badge">Correct Option</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="q-preview-actions">
        <button className="btn-nav" onClick={() => toggleRationale(idx)}>
          {isExpanded ? 'Hide Diagnostic Rationales ▲' : 'Show Diagnostic Rationales ▼'}
        </button>
      </div>
      {isExpanded && (
        <div className="distractor-rationale animate-fade">
          <div className="distractor-rationale-title">🔬 Distractor Rationale Diagnostics</div>
          {getDistractorRationales(q).map((rat, ri) => (
            <div key={ri} className="distractor-rationale-item" style={{ borderLeftColor: ri === q.correct_index ? '#16a34a' : '#ef4444' }}>
              <strong>Option {String.fromCharCode(65 + ri)}:</strong> {rat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIQuestionPreviewCard;
