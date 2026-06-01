import React from 'react';

const AISectionTabs = ({ activeGenTab, setActiveGenTab, generatedCount }) => (
  <div className="gen-tabs">
    {[
      { id: 'Input', label: '📝 Syllabus Input' },
      { id: 'Settings', label: '⚙️ Generation Settings' },
      { id: 'Preview', label: `👁️ Preview (${generatedCount})` }
    ].map(tab => (
      <button
        key={tab.id}
        className={`gen-tab ${activeGenTab === tab.id ? 'active' : ''}`}
        onClick={() => setActiveGenTab(tab.id)}
        disabled={tab.id === 'Preview' && generatedCount === 0}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default AISectionTabs;
