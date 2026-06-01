import React from 'react';

const AISidebarPanel = ({ coverage, quality, diffStats, generatedQuestionsLength, openSimulator, openExportModal, resetQuestions }) => (
  <div className="diag-sidebar">
    <div className="glass-panel sidebar-section">
      <div className="sidebar-section-title">📊 Live Syllabus Coverage Map</div>
      {[
        { key: 'vocab', label: 'Vocabulary Units' },
        { key: 'grammar', label: 'Grammar Structures' },
        { key: 'reading', label: 'Reading Comprehension' },
        { key: 'kanji', label: 'Kanji Orthography Density' }
      ].map(bar => (
        <div key={bar.key} className="coverage-bar-container">
          <div className="coverage-bar-label">
            <span className="name">{bar.label}</span>
            <span className="pct">{coverage[bar.key]}%</span>
          </div>
          <div className="coverage-bar-track">
            <div className={`coverage-bar-fill ${bar.key}`} style={{ width: `${coverage[bar.key]}%` }} />
          </div>
        </div>
      ))}
      <div className="coverage-summary">
        <span>Composite Coverage</span>
        <strong>{coverage.overall}%</strong>
      </div>
    </div>

    <div className="glass-panel sidebar-section">
      <div className="sidebar-section-title">🧠 Computed Quality Score</div>
      <div className={`quality-badge ${quality.cls}`}>{quality.grade}</div>
      <p className="sidebar-note">{quality.label}</p>
    </div>

    <div className="glass-panel sidebar-section">
      <div className="sidebar-section-title">📈 Platform Integration Stats</div>
      <div className="metric-grid">
        <div className="metric-card"><div className="metric-value">{generatedQuestionsLength}</div><div className="metric-label">Total Qs</div></div>
        <div className="metric-card"><div className="metric-value">{diffStats.easy || 0}</div><div className="metric-label">Easy tier</div></div>
        <div className="metric-card"><div className="metric-value">{diffStats.medium || 0}</div><div className="metric-label">Medium tier</div></div>
        <div className="metric-card"><div className="metric-value">{diffStats.hard || 0}</div><div className="metric-label">Hard tier</div></div>
      </div>
    </div>

    {generatedQuestionsLength > 0 && (
      <div className="glass-panel sidebar-section sidebar-actions">
        <button className="btn-nav" onClick={openSimulator}>🎓 Open Student Simulator</button>
        <button className="btn-nav" onClick={openExportModal}>📥 Open Export Panel</button>
        <button className="btn-danger" onClick={resetQuestions}>🗑️ Discard Questions</button>
      </div>
    )}
  </div>
);

export default AISidebarPanel;
