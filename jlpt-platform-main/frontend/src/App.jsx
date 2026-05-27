import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>⚠️ Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              background: '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '1rem' }}>
            Check browser console (F12) for error details
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Sub-components (Moved outside to prevent re-creation on render) ---

const MobileHeader = ({ setIsSidebarOpen }) => (
  <div className="mobile-header">
    <div className="sidebar-logo" style={{ marginBottom: 0 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      <div className="logo-text" style={{ fontSize: '0.75rem' }}>JLPT-PLATFORM</div>
    </div>
    <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>☰</button>
  </div>
);

const Sidebar = ({ user, view, setView, isSidebarOpen, setIsSidebarOpen, handleLogout }) => (
  <>
    <div className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
    <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        <div className="logo-text">JLPT-PLATFORM</div>
      </div>

      <div className="user-profile-badge">
        <div className="profile-label">Logged in as</div>
        <div className="profile-name">{user?.name}</div>
        <div className="profile-role">{user?.role === 'teacher' ? 'Teacher Panel' : 'Learner Dashboard'}</div>
      </div>

      <nav className="nav-section">
        <h3>Navigation</h3>
        <div className="nav-menu">
          {user?.role === 'learner' ? (
            <>
              <button className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }}>
                <span className="icon">🏠</span> Home
              </button>
              <button className={`nav-link ${view === 'leaderboard' ? 'active' : ''}`} onClick={() => { setView('leaderboard'); setIsSidebarOpen(false); }}>
                <span className="icon">🏆</span> Leaderboard
              </button>
            </>
          ) : (
            <>
              <button className={`nav-link ${view === 'admin-dashboard' ? 'active' : ''}`} onClick={() => { setView('admin-dashboard'); setIsSidebarOpen(false); }}>
                <span className="icon">🛠️</span> Test Management
              </button>
              <button className={`nav-link ${view === 'ai-generator' ? 'active' : ''}`} onClick={() => { setView('ai-generator'); setIsSidebarOpen(false); }}>
                <span className="icon">🤖</span> AI Question Generator
              </button>
              <button className={`nav-link ${view === 'ai-listening' ? 'active' : ''}`} onClick={() => { setView('ai-listening'); setIsSidebarOpen(false); }}>
                <span className="icon">🔊</span> AI Listening Generator
              </button>
              <button className={`nav-link ${view === 'module-settings' ? 'active' : ''}`} onClick={() => { setView('module-settings'); setIsSidebarOpen(false); }}>
                <span className="icon">⚙️</span> Module Settings
              </button>
              <button className={`nav-link ${view === 'level-config' ? 'active' : ''}`} onClick={() => { setView('level-config'); setIsSidebarOpen(false); }}>
                <span className="icon">📊</span> Level Configuration
              </button>
              <button className={`nav-link ${view === 'question-bank' ? 'active' : ''}`} onClick={() => { setView('question-bank'); setIsSidebarOpen(false); }}>
                <span className="icon">📚</span> Question Bank
              </button>
            </>
          )}
        </div>
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <span className="icon">🚪</span> Logout
        </button>
      </div>
    </aside>
  </>
);

const AuthView = ({ type, authForm, setAuthForm, handleLogin, handleSignup, setView, loading }) => (
  <div className="auth-container">
    <div className="widget auth-card">
      <div className="auth-header">
        <div className="sidebar-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <div className="logo-text" style={{ fontSize: '1.2rem' }}>JLPT-PLATFORM</div>
        </div>
        <h2>{type === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <p>{type === 'login' ? 'Please enter your details to sign in.' : 'Join us to start your learning journey.'}</p>
      </div>

      <form onSubmit={type === 'login' ? handleLogin : handleSignup}>
        {type === 'signup' && (
          <>
            <div className="form-group">
              <label>NAME</label>
              <input 
                type="text" 
                className="auth-input" 
                placeholder="Full Name"
                required
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>I AM A</label>
              <select 
                className="auth-input"
                value={authForm.role}
                onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                style={{ appearance: 'none', background: 'white' }}
              >
                <option value="learner">Learner (Take tests)</option>
                <option value="teacher">Teacher (Create tests)</option>
              </select>
            </div>
          </>
        )}
        <div className="form-group">
          <label>EMAIL ADDRESS</label>
          <input 
            type="email" 
            className="auth-input" 
            placeholder="name@example.com"
            required
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>PASSWORD</label>
          <input 
            type="password" 
            className="auth-input" 
            placeholder="••••••••"
            required
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
          />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Processing...' : (type === 'login' ? 'Sign In' : 'Sign Up')}
        </button>
      </form>

      <div className="auth-footer">
        {type === 'login' ? (
          <p>Don't have an account? <button onClick={() => setView('signup')}>Sign Up</button></p>
        ) : (
          <p>Already have an account? <button onClick={() => setView('login')}>Sign In</button></p>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = ({ availableTests, startTest }) => (
  <div className="main-content">
    <div className="content-left">
      <section className="mock-tests-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Available Mock Examinations</h2>
        </div>
        <div className="mock-test-grid">
          {availableTests.map(test => (
            <div key={test.id} className="mock-test-card">
              <div className="test-level">{test.level}</div>
              <div className="test-title">{test.title}</div>
              <div className="test-meta">
                <span>⏱ {test.duration} Min</span>
                <span>📝 {test.questions?.length || 0} Qs</span>
              </div>
              <button className="start-test-btn" onClick={() => startTest(test.id)}>Start Now</button>
            </div>
          ))}
        </div>
      </section>
    </div>

    <div className="content-right">
      <div className="widget catch-up-widget">
        <div className="widget-icon" style={{ background: 'var(--primary-light)' }}>🔄</div>
        <h4>Weekly Catch-Up</h4>
        <p>Missed a day? Catch up now.</p>
        <button className="btn-primary">Start Catch-Up</button>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ fontSize: '1.2rem' }}>⭐</div>
          <div className="label">Leaderboard</div>
          <div className="value">You're #2 today</div>
        </div>
      </div>
    </div>
  </div>
);

const AdminDashboard = ({ availableTests, createTest, editTest, deleteTest }) => (
  <div className="main-content">
    <div className="content-left">
      <header className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Teacher Dashboard</h1>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={createTest}>+ New Test</button>
      </header>

      <section className="admin-tests-list">
        <div className="mock-test-grid">
          {availableTests.map(test => (
            <div key={test.id} className="mock-test-card admin-card">
              <div className="test-level">{test.level}</div>
              <div className="test-title">{test.title}</div>
              <div className="test-meta">
                <span>📝 {test.questions?.length || 0} Questions</span>
                <span>⏱ {test.duration} Min</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn-nav" style={{ flex: 1 }} onClick={() => editTest(test)}>Edit</button>
                <button className="btn-nav" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }} onClick={() => deleteTest(test.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

const TestEditor = ({ editingTest, setEditingTest, saveTest, setView, generateAudio, loading, generatingAudioIdx }) => {
  const getFullAudioUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    // In production, the backend might be on a different domain.
    // We construct the absolute URL using the base API URL.
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${url}`;
  };

  const addQuestion = () => {
    const newQ = {
      question_text: '',
      options: ['', '', '', ''],
      correct_index: 0,
      section: 0,
      number: (editingTest.questions?.length || 0) + 1,
      type: 'Multiple Choice'
    };
    setEditingTest({
      ...editingTest,
      questions: [...(editingTest.questions || []), newQ]
    });
  };

  const updateQuestion = (idx, field, value) => {
    const newQs = [...editingTest.questions];
    newQs[idx][field] = value;
    
    // Auto-assign sections for better scoring reports
    // Section 2 is dedicated to Listening in the backend submission logic
    if (field === 'type') {
      if (value === 'Listening') {
        newQs[idx].section = 2;
      } else {
        newQs[idx].section = 0; // Default to Vocabulary & Grammar for Reading
      }
    }
    
    setEditingTest({ ...editingTest, questions: newQs });
  };

  const updateOption = (qIdx, optIdx, value) => {
    const newQs = [...editingTest.questions];
    newQs[qIdx].options[optIdx] = value;
    setEditingTest({ ...editingTest, questions: newQs });
  };

  const removeQuestion = (idx) => {
    const newQs = editingTest.questions.filter((_, i) => i !== idx);
    setEditingTest({ ...editingTest, questions: newQs });
  };

  return (
    <div className="main-content">
      <div className="content-left">
        <header className="header-section" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h1>{editingTest?.id ? 'Edit' : 'Create'} Mock Test</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" style={{ width: 'auto' }} onClick={saveTest}>💾 Save Test</button>
            <button className="btn-nav" style={{ width: 'auto' }} onClick={() => setView('admin-dashboard')}>Cancel</button>
          </div>
        </header>
        
        <div className="widget" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '1rem' }}>
            <div>
              <label className="profile-label">Test Title</label>
              <input 
                type="text" className="auth-input" placeholder="e.g. N4 Mock Exam #1"
                value={editingTest?.title || ''}
                onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })}
              />
            </div>
            <div>
              <label className="profile-label">Level</label>
              <select className="auth-input" value={editingTest?.level} onChange={(e) => setEditingTest({...editingTest, level: e.target.value})}>
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>
            <div className="form-group">
              <label className="profile-label">Mins</label>
              <input 
                type="number" 
                className="auth-input" 
                value={editingTest?.duration || 0} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setEditingTest({...editingTest, duration: isNaN(val) ? 0 : val});
                }}
              />
            </div>
          </div>
        </div>

        <section className="question-bank">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Question Bank ({editingTest.questions?.length || 0})</h2>
            <button className="btn-nav" style={{ width: 'auto', fontSize: '0.8rem' }} onClick={addQuestion}>+ Add Question</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {editingTest.questions?.map((q, qIdx) => (
              <div key={`q-${q.id || qIdx}`} className="widget" style={{ borderLeft: `4px solid ${q.type === 'Listening' ? '#7c3aed' : 'var(--primary)'}` }}>
                {/* Question Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: '800', color: q.type === 'Listening' ? '#7c3aed' : 'var(--primary)', fontSize: '0.8rem' }}>
                      QUESTION #{qIdx + 1}
                    </span>
                    {q.type === 'Listening' && (
                      <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.65rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '20px', letterSpacing: '0.05em' }}>
                        🎧 LISTENING
                      </span>
                    )}
                    {q.audio_url && q.type === 'Listening' && (
                      <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.65rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                        ✅ AUDIO READY
                      </span>
                    )}
                  </div>
                  <button onClick={() => removeQuestion(qIdx)} style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '600' }}>Remove</button>
                </div>

                {/* Question Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="profile-label">Question Type</label>
                    <select 
                      className="auth-input" 
                      value={q.type}
                      onChange={(e) => updateQuestion(qIdx, 'type', e.target.value)}
                    >
                      <option value="Reading">Reading / Vocabulary</option>
                      <option value="Listening">Listening (Choukai)</option>
                    </select>
                  </div>
                  {q.type === 'Listening' && (
                    <div className="form-group">
                      <label className="profile-label">AI VOICE ENGINE (PREMIUM)</label>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '1rem', 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                        padding: '1.25rem', 
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button 
                            className="btn-primary" 
                            style={{ 
                              width: 'auto', 
                              padding: '0.6rem 1.25rem', 
                              fontSize: '0.85rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.6rem',
                              borderRadius: '8px',
                              background: 'var(--primary)',
                              boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)'
                            }}
                            onClick={() => generateAudio(qIdx)}
                            disabled={generatingAudioIdx !== null}
                          >
                            <span style={{ display: generatingAudioIdx === qIdx ? 'flex' : 'none', alignItems: 'center', gap: '0.6rem' }}>
                              <span className="animate-spin">⏳</span> Processing...
                            </span>
                            <span style={{ display: generatingAudioIdx === qIdx ? 'none' : 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              ✨ Generate AI Voice
                            </span>
                          </button>
                          
                          {q.audio_url && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ 
                                background: '#dcfce7', 
                                color: '#166534', 
                                padding: '0.25rem 0.75rem', 
                                borderRadius: '20px', 
                                fontSize: '0.65rem', 
                                fontWeight: '800',
                                letterSpacing: '0.05em'
                              }}>
                                AI ENGINE READY
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div style={{ width: '100%', minHeight: '40px', position: 'relative' }}>
                          <div style={{ display: q.audio_url ? 'block' : 'none' }}>
                            <div key={`audio-prev-box-${qIdx}-${q.audio_url || 'none'}`} style={{ width: '100%' }}>
                              <audio 
                                key={`audio-prev-el-${qIdx}-${q.audio_url || 'none'}`}
                                controls 
                                src={q.audio_url ? getFullAudioUrl(q.audio_url) : ''} 
                                style={{ width: '100%', height: '36px', borderRadius: '8px' }} 
                              />
                              <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                Tip: AI voice is ready for preview.
                              </p>
                            </div>
                          </div>
                          <div style={{ display: !q.audio_url ? 'block' : 'none' }}>
                            <div style={{ textAlign: 'center', padding: '0.5rem', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                              <p style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                No audio yet. Type script below and click generate.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="profile-label">
                    {q.type === 'Listening' ? 'LISTENING SCRIPT (CONVERTED TO AI VOICE)' : 'QUESTION TEXT'}
                  </label>
                  <textarea 
                    className="auth-input" 
                    rows="4"
                    placeholder={q.type === 'Listening' ? 'Enter the script the AI should speak here...' : 'Enter your question here...'}
                    style={{ resize: 'vertical', border: q.type === 'Listening' ? '1px solid var(--primary)' : '' }}
                    value={q.question_text}
                    onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
                  />
                  {q.type === 'Listening' && (
                    <p style={{ fontSize: '0.65rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 'bold' }}>
                      💡 The learner will HEAR this text but will NOT see it during the exam.
                    </p>
                  )}
                </div>

                <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="form-group">
                      <label className="profile-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        Option {optIdx + 1}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6rem', cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name={`correct-${qIdx}`} 
                            checked={q.correct_index === optIdx}
                            onChange={() => updateQuestion(qIdx, 'correct_index', optIdx)}
                          /> Correct
                        </label>
                      </label>
                      <input 
                        type="text" 
                        className="auth-input" 
                        value={opt}
                        onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const AIQuestionGenerator = ({ token }) => {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState('N5');
  const [activeSection, setActiveSection] = useState('vocabulary');
  const [contentBySection, setContentBySection] = useState({ vocabulary: '', grammar: '', reading: '' });
  const [fileLabel, setFileLabel] = useState('No file selected');
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState({ MCQ: true, 'fill-blank': false, matching: false, reading: false, listening: false });
  const [difficultyMode, setDifficultyMode] = useState('auto-balanced');
  const [options, setOptions] = useState({ explain: true, preventDuplicates: true, tagByCategory: true });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const stepLabels = ['Input', 'Configure', 'Preview', 'Export'];

  const questionTypeLabels = {
    MCQ: 'MCQ',
    'fill-blank': 'Fill in the blank',
    matching: 'Matching',
    reading: 'Reading passage',
    listening: 'Listening'
  };

  const handleTypeToggle = (key) => {
    setQuestionTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const parseCsv = (text) => {
    const rows = text.trim().split(/\r?\n/).filter(Boolean);
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    const contentLines = rows.slice(1).map(row => {
      const cols = row.split(',').map(c => c.trim());
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = cols[index] || '';
      });
      return JSON.stringify(entry);
    });
    return contentLines.join('\n');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileLabel(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (!text) return;
      let parsed = text;
      if (file.name.toLowerCase().endsWith('.csv')) {
        parsed = parseCsv(text);
      } else if (file.name.toLowerCase().endsWith('.json')) {
        try {
          const json = JSON.parse(text);
          parsed = JSON.stringify(json, null, 2);
        } catch (err) {
          setError('Unable to parse JSON file. Please check the file format.');
          return;
        }
      }
      setContentBySection(prev => ({ ...prev, [activeSection]: parsed }));
    };
    reader.readAsText(file);
  };

  const validateGenerate = () => {
    const hasSectionContent = Object.values(contentBySection).some((value) => value.trim());
    if (!hasSectionContent) {
      setError('Please paste or upload syllabus content for at least one section before generating.');
      return false;
    }
    if (!Object.values(questionTypes).some(Boolean)) {
      setError('Select at least one question type.');
      return false;
    }
    if (questionCount < 5 || questionCount > 500) {
      setError('Question count must be between 5 and 500.');
      return false;
    }
    return true;
  };

  const sectionMap = {
    vocabulary: 1,
    grammar: 2,
    reading: 3,
    listening: 4
  };

  const saveGeneratedSet = async () => {
    if (!questions.length) {
      setSaveStatus('Generate a question set before saving.');
      return;
    }

    setSaveLoading(true);
    setSaveStatus('');

    try {
      const filledSections = Object.keys(contentBySection).filter((key) => contentBySection[key].trim());
      const titleSection = filledSections.length === 1 ? filledSections[0] : 'Mixed';
      const titleSectionLabel = titleSection.charAt(0).toUpperCase() + titleSection.slice(1);

      const payload = {
        title: saveTitle || `AI ${level.toUpperCase()} ${titleSectionLabel} Set`,
        level,
        duration: Math.max(30, Math.min(180, Math.floor(questionCount * 1.2))),
        questions: questions.map((q, idx) => ({
          number: idx + 1,
          section: typeof q.section === 'number' ? q.section : sectionMap[q.section] || sectionMap[activeSection] || 1,
          type: q.type || 'MCQ',
          question_text: q.question_text,
          options: q.options,
          correct_index: q.correct_answer_index ?? q.correct_index,
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation,
          tags: q.tags || []
        }))
      };

      const res = await fetch(`${API_URL}/admin/ai/save-generated-set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to save generated set' }));
        throw new Error(err.detail || 'Failed to save generated set');
      }

      setSaveStatus('AI-generated set saved successfully.');
    } catch (err) {
      console.error(err);
      setSaveStatus(`Save failed: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const buildRequestPayload = () => ({
    level,
    section: 'mixed',
    count: questionCount,
    question_types: Object.keys(questionTypes).filter(key => questionTypes[key]),
    difficulty_mode: difficultyMode,
    include_explanations: options.explain,
    prevent_duplicates: options.preventDuplicates,
    tag_by_category: options.tagByCategory,
    content: {
      vocabulary: contentBySection.vocabulary.trim(),
      grammar: contentBySection.grammar.trim(),
      reading: contentBySection.reading.trim()
    }
  });

  const handleGenerate = async () => {
    if (!validateGenerate()) return;
    setLoading(true);
    setError('');
    try {
      const payload = buildRequestPayload();
      const res = await fetch(`${API_URL}/admin/ai/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to generate questions' }));
        throw new Error(err.detail || 'Failed to generate questions');
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Unexpected response from the AI service');
      }
      setQuestions(data);
      setStep(3);
      setEditingIndex(null);
    } catch (err) {
      console.error('AI generate error', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, index) => index !== idx));
  };

  const handleEditQuestion = (idx, field, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const downloadFile = (filename, contentText) => {
    const blob = new Blob([contentText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    downloadFile(`jlpt-ai-questions-${level.toLowerCase()}.json`, JSON.stringify(questions, null, 2));
  };

  const exportCsv = () => {
    const headers = ['id', 'type', 'level', 'section', 'difficulty', 'question_text', 'options', 'correct_answer_index', 'explanation', 'tags'];
    const rows = questions.map((q) => [
      q.id ?? '',
      q.type,
      q.level,
      q.section,
      q.difficulty,
      `"${(q.question_text || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(q.options || [])}"`,
      q.correct_answer_index,
      `"${(q.explanation || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(q.tags || [])}"`
    ].join(','));
    downloadFile(`jlpt-ai-questions-${level.toLowerCase()}.csv`, [headers.join(','), ...rows].join('\n'));
  };

  const summary = {
    total: questions.length,
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
    bySection: questions.reduce((acc, q) => {
      acc[q.section] = (acc[q.section] || 0) + 1;
      return acc;
    }, {})
  };

  return (
    <div className="main-content">
      <div className="content-left" style={{ paddingBottom: '4rem' }}>
        <header className="header-section" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1>AI Question Generator</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Generate JLPT question sets in bulk using AI and save them to your question bank.</p>
          </div>
        </header>

        <div className="widget" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {stepLabels.map((label, index) => (
              <div key={label} style={{ flex: '1 1 130px', minWidth: '130px', padding: '0.9rem 1rem', borderRadius: '14px', border: step === index + 1 ? '1px solid var(--primary)' : '1px solid var(--border-tertiary)', background: step === index + 1 ? 'rgba(83, 74, 183, 0.08)' : 'white', color: step === index + 1 ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: step === index + 1 ? '700' : '500', textAlign: 'center' }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="widget" style={{ background: '#fee2e2', borderColor: '#fecaca', color: '#991b1b', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="widget" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Step 1 — Content Input</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem' }}>
            <div>
              <div className="form-group">
                <label className="profile-label">JLPT Level</label>
                <select className="auth-input" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>

              <div className="form-group">
                <label className="profile-label">Upload content for</label>
                <select className="auth-input" value={activeSection} onChange={(e) => setActiveSection(e.target.value)}>
                  <option value="vocabulary">Vocabulary</option>
                  <option value="grammar">Grammar</option>
                  <option value="reading">Reading</option>
                </select>
              </div>

              <div className="form-group">
                <label className="profile-label">Vocabulary syllabus</label>
                <textarea className="auth-input" rows="6" value={contentBySection.vocabulary} onChange={(e) => setContentBySection(prev => ({ ...prev, vocabulary: e.target.value }))} placeholder="Enter vocabulary syllabus content for this JLPT level..." />
              </div>

              <div className="form-group">
                <label className="profile-label">Grammar syllabus</label>
                <textarea className="auth-input" rows="6" value={contentBySection.grammar} onChange={(e) => setContentBySection(prev => ({ ...prev, grammar: e.target.value }))} placeholder="Enter grammar syllabus content for this JLPT level..." />
              </div>

              <div className="form-group">
                <label className="profile-label">Reading syllabus</label>
                <textarea className="auth-input" rows="6" value={contentBySection.reading} onChange={(e) => setContentBySection(prev => ({ ...prev, reading: e.target.value }))} placeholder="Enter reading syllabus content for this JLPT level..." />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="profile-label">Upload content file to active section</label>
                <input type="file" accept=".txt,.csv,.json" onChange={handleFileChange} />
                <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{fileLabel}</div>
              </div>

              <div className="card" style={{ padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-tertiary)' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Quick tips</h3>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <li>Use plain text, CSV, or JSON.</li>
                  <li>Keep prompts focused on the selected JLPT level.</li>
                  <li>For listening, include dialogue or short spoken passages.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="widget" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Step 2 — Configuration</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="profile-label">Question count</label>
              <input className="auth-input" type="number" min="5" max="500" value={questionCount} onChange={(e) => setQuestionCount(Math.max(5, Math.min(500, parseInt(e.target.value) || 5)))} />
            </div>

            <div className="form-group">
              <label className="profile-label">Difficulty mode</label>
              <select className="auth-input" value={difficultyMode} onChange={(e) => setDifficultyMode(e.target.value)}>
                <option value="auto-balanced">Auto-balanced</option>
                <option value="easy-only">Easy only</option>
                <option value="medium-only">Medium only</option>
                <option value="hard-only">Hard only</option>
                <option value="fully-random">Fully random</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            {Object.entries(questionTypeLabels).map(([key, label]) => (
              <button key={key} type="button" className={`btn ${questionTypes[key] ? 'primary' : ''}`} onClick={() => handleTypeToggle(key)} style={{ textAlign: 'left' }}>
                {questionTypes[key] ? '✔ ' : ''}{label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            <label className="toggle-row"><span className="toggle-info"><p>Answer key + explanations</p></span><input type="checkbox" checked={options.explain} onChange={() => setOptions(prev => ({ ...prev, explain: !prev.explain }))} /></label>
            <label className="toggle-row"><span className="toggle-info"><p>Prevent duplicate questions</p></span><input type="checkbox" checked={options.preventDuplicates} onChange={() => setOptions(prev => ({ ...prev, preventDuplicates: !prev.preventDuplicates }))} /></label>
            <label className="toggle-row"><span className="toggle-info"><p>Tag by category</p></span><input type="checkbox" checked={options.tagByCategory} onChange={() => setOptions(prev => ({ ...prev, tagByCategory: !prev.tagByCategory }))} /></label>
          </div>
        </div>

        <div className="widget" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Ready to generate?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>The AI will produce a structured question list you can review and export.</p>
          </div>
          <button className="btn-primary" type="button" style={{ minWidth: '180px' }} onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating…' : 'Generate Questions'}
          </button>
        </div>

        {questions.length > 0 && (
          <div className="widget" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(100px, 1fr))', gap: '0.75rem' }}>
              <div className="card" style={{ padding: '1rem' }}><div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{summary.total}</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total questions</div></div>
              <div className="card" style={{ padding: '1rem' }}><div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{summary.easy}</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Easy</div></div>
              <div className="card" style={{ padding: '1rem' }}><div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{summary.medium}</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Medium</div></div>
              <div className="card" style={{ padding: '1rem' }}><div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{summary.hard}</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Hard</div></div>
            </div>
          </div>
        )}

        {questions.length > 0 && (
          <div className="widget" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ margin: 0 }}>Step 3 — Preview</h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn" onClick={exportJson}>Export JSON</button>
                <button className="btn" onClick={exportCsv}>Export CSV</button>
                <button className="btn-primary" onClick={saveGeneratedSet} disabled={saveLoading}>{saveLoading ? 'Saving…' : 'Save to Question Bank'}</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <input className="auth-input" placeholder="Generated set title" value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} style={{ flex: '1 1 320px' }} />
              {saveStatus && <p style={{ color: saveStatus.startsWith('Save failed') ? '#b91c1c' : '#166534', margin: 0, alignSelf: 'center' }}>{saveStatus}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              {questions.map((q, idx) => (
                <div key={`ai-q-${idx}`} className="widget" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: '800', marginBottom: '0.25rem' }}>{q.type || 'MCQ'}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{q.difficulty || 'medium'} • {q.section ?? activeSection}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn" style={{ padding: '0.45rem 0.8rem' }} onClick={() => setEditingIndex(idx)}>Edit</button>
                      <button className="btn" style={{ padding: '0.45rem 0.8rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleRemoveQuestion(idx)}>Remove</button>
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>{q.question_text}</div>
                  {q.options?.length > 0 && (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '999px', background: q.correct_answer_index === optIdx ? '#4338ca' : '#e2e8f0', color: q.correct_answer_index === optIdx ? 'white' : '#334155', display: 'grid', placeItems: 'center', fontSize: '0.75rem' }}>{String.fromCharCode(65 + optIdx)}</div>
                          <div>{opt}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {editingIndex === idx && (
                    <div style={{ marginTop: '1rem', padding: '0.9rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <label className="profile-label">Edit question text</label>
                      <textarea className="auth-input" rows="3" value={q.question_text} onChange={(e) => handleEditQuestion(idx, 'question_text', e.target.value)} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx}>
                            <label className="profile-label">Option {optIdx + 1}</label>
                            <input className="auth-input" value={opt} onChange={(e) => {
                              const newOpts = [...(q.options || [])];
                              newOpts[optIdx] = e.target.value;
                              handleEditQuestion(idx, 'options', newOpts);
                            }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button className="btn" onClick={() => setEditingIndex(null)}>Close</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AIListeningGenerator = ({ token }) => {
  const [script, setScript] = useState('');
  const [speakerCount, setSpeakerCount] = useState(1);
  const [voiceStyle, setVoiceStyle] = useState('female');
  const [speechSpeed, setSpeechSpeed] = useState('standard');
  const [level, setLevel] = useState('N5');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDuration, setSaveDuration] = useState(120);
  const [saveStatus, setSaveStatus] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateStatus, setTemplateStatus] = useState('');
  const [templateLoading, setTemplateLoading] = useState(false);

  const getFullAudioUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL.replace('/api', '')}${url}`;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = { script, speaker_count: speakerCount, voice_style: voiceStyle, speech_speed: speechSpeed, generate_questions: true, level, question_count: questionCount, section: 'listening' };
      const res = await fetch(`${API_URL}/admin/listening/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to generate audio' }));
        throw new Error(err.detail || 'Failed to generate audio');
      }
      const data = await res.json();
      setResult(data);
      setSaveTitle(`AI Listening Set ${level}`);
      setSaveDuration(level === 'N5' || level === 'N4' ? 110 : level === 'N3' ? 140 : level === 'N2' ? 155 : 170);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSet = async () => {
    if (!result || !result.questions?.length) {
      setSaveStatus('Generate audio and questions before saving.');
      return;
    }
    setSaveLoading(true);
    setSaveStatus('');
    try {
      const payload = {
        title: saveTitle || `AI Listening Set ${new Date().toISOString()}`,
        level,
        duration: saveDuration,
        questions: result.questions.map((q, idx) => ({
          number: idx + 1,
          section: 2,
          type: 'Listening',
          question_text: q.question_text,
          options: q.options,
          correct_index: q.correct_answer_index,
          difficulty: q.difficulty,
          explanation: q.explanation,
          tags: q.tags || [],
          audio_url: result.audio_url
        }))
      };
      const res = await fetch(`${API_URL}/admin/ai/save-generated-set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to save generated set' }));
        throw new Error(err.detail || 'Failed to save generated set');
      }
      setSaveStatus('Saved to your question bank successfully.');
    } catch (err) {
      console.error(err);
      setSaveStatus(`Save failed: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!result || !result.questions?.length) {
      setTemplateStatus('Generate audio and questions before saving a template.');
      return;
    }
    if (!templateName.trim()) {
      setTemplateStatus('Enter a template name.');
      return;
    }
    setTemplateLoading(true);
    setTemplateStatus('');
    try {
      const payload = {
        name: templateName,
        level,
        section: 'listening',
        description: `AI-generated listening template for ${level} level`,
        questions: result.questions.map((q) => ({
          type: 'Listening',
          level,
          section: 2,
          difficulty: q.difficulty,
          question_text: q.question_text,
          options: q.options,
          correct_answer_index: q.correct_answer_index,
          explanation: q.explanation,
          tags: q.tags || []
        }))
      };
      const res = await fetch(`${API_URL}/admin/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to save template' }));
        throw new Error(err.detail || 'Failed to save template');
      }
      setTemplateStatus('Template saved successfully.');
      setTemplateName('');
    } catch (err) {
      console.error(err);
      setTemplateStatus(`Template save failed: ${err.message}`);
    } finally {
      setTemplateLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="content-left">
        <header className="header-section" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1>AI Listening Generator</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Generate listening audio and comprehension questions from a Japanese script.</p>
          </div>
        </header>

        {error && (
          <div className="widget" style={{ background: '#fee2e2', borderColor: '#fecaca', color: '#991b1b', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="widget" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="profile-label">JLPT Level</label>
              <select className="auth-input" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>
            <div>
              <label className="profile-label">Question count</label>
              <input className="auth-input" type="number" min="3" max="10" value={questionCount} onChange={(e) => setQuestionCount(Math.max(3, Math.min(10, parseInt(e.target.value) || 3)))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label className="profile-label">Speakers</label>
              <select className="auth-input" value={speakerCount} onChange={(e) => setSpeakerCount(parseInt(e.target.value))}>
                <option value={1}>1 speaker</option>
                <option value={2}>2 speakers</option>
                <option value={3}>Group</option>
              </select>
            </div>
            <div>
              <label className="profile-label">Voice style</label>
              <select className="auth-input" value={voiceStyle} onChange={(e) => setVoiceStyle(e.target.value)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="profile-label">Speech speed</label>
              <select className="auth-input" value={speechSpeed} onChange={(e) => setSpeechSpeed(e.target.value)}>
                <option value="slow">Slow</option>
                <option value="standard">Standard</option>
                <option value="fast">Fast</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="profile-label">Japanese dialogue or monologue script</label>
            <textarea className="auth-input" rows="8" value={script} onChange={(e) => setScript(e.target.value)} placeholder="Paste the Japanese script here..." />
          </div>

          <button className="btn-primary" style={{ width: 'auto', marginTop: '1rem' }} onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating audio…' : 'Generate Listening Audio'}
          </button>
        </div>

        {result && (
          <div className="widget" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Generated audio</h2>
            <div style={{ marginBottom: '1rem' }}>
              <audio controls src={getFullAudioUrl(result.audio_url)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="card"><div style={{ fontWeight: '700' }}>{result.metadata?.voice_style}</div><div style={{ color: 'var(--text-secondary)' }}>Voice style</div></div>
              <div className="card"><div style={{ fontWeight: '700' }}>{result.metadata?.speech_speed}</div><div style={{ color: 'var(--text-secondary)' }}>Speed</div></div>
              <div className="card"><div style={{ fontWeight: '700' }}>{result.metadata?.speaker_count}</div><div style={{ color: 'var(--text-secondary)' }}>Speakers</div></div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem' }}>Generated questions</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {result.questions.map((q, idx) => (
                  <div key={idx} className="card" style={{ padding: '0.9rem' }}>
                    <div style={{ fontWeight: '700', marginBottom: '0.35rem' }}>Question {idx + 1}</div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{q.question_text}</div>
                    {q.options?.map((opt, optIdx) => (
                      <div key={optIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '999px', background: q.correct_answer_index === optIdx ? '#4338ca' : '#e2e8f0', color: q.correct_answer_index === optIdx ? 'white' : '#334155', display: 'grid', placeItems: 'center', fontSize: '0.78rem' }}>{String.fromCharCode(65 + optIdx)}</div>
                        <div>{opt}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 320px' }}>
                <label className="profile-label">Save set title</label>
                <input className="auth-input" value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} />
              </div>
              <div style={{ flex: '0 0 140px' }}>
                <label className="profile-label">Duration (min)</label>
                <input className="auth-input" type="number" value={saveDuration} onChange={(e) => setSaveDuration(parseInt(e.target.value) || 120)} />
              </div>
              <button className="btn-primary" onClick={handleSaveSet} disabled={saveLoading}>{saveLoading ? 'Saving…' : 'Save to Question Bank'}</button>
            </div>
            {saveStatus && <p style={{ marginTop: '0.75rem', color: saveStatus.startsWith('Save failed') ? '#b91c1c' : '#166534' }}>{saveStatus}</p>}

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-tertiary)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Or save as template</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <label className="profile-label">Template name</label>
                  <input className="auth-input" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g., Restaurant Conversation N4" />
                </div>
                <button className="btn" onClick={handleSaveTemplate} disabled={templateLoading}>{templateLoading ? 'Saving…' : 'Save as Template'}</button>
              </div>
              {templateStatus && <p style={{ marginTop: '0.75rem', color: templateStatus.startsWith('Template save failed') ? '#b91c1c' : '#166534' }}>{templateStatus}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ModuleSettings = ({ token }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/admin/settings`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  const toggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      module_toggles: {
        ...prev.module_toggles,
        [key]: !prev.module_toggles[key]
      }
    }));
  };

  const save = async () => {
    if (!settings) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ module_toggles: settings.module_toggles })
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSaved('Settings saved successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) return <div className="main-content"><div className="widget">Loading settings...</div></div>;
  if (error) return <div className="main-content"><div className="widget" style={{ background: '#fee2e2', borderColor: '#fecaca', color: '#991b1b' }}>{error}</div></div>;

  return (
    <div className="main-content">
      <div className="content-left">
        <header className="header-section" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1>Module Settings</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Enable or disable teacher and student features individually.</p>
          </div>
        </header>

        <div className="widget" style={{ marginBottom: '1.5rem' }}>
          {Object.entries(settings?.module_toggles || {}).map(([key, value]) => (
            <div key={key} className="toggle-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="toggle-info">
                <p style={{ margin: 0, fontWeight: '600', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</p>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Toggle {key.replace(/_/g, ' ')}</span>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={value} onChange={() => toggle(key)} />
                <span className="slider"></span>
              </label>
            </div>
          ))}

          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={save}>Save Module Settings</button>
          {saved && <p style={{ marginTop: '0.75rem', color: '#166534' }}>{saved}</p>}
        </div>
      </div>
    </div>
  );
};

const LevelConfiguration = ({ token }) => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const fetchLevels = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/admin/levels`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load level settings');
        const data = await res.json();
        setLevels(data.levels || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLevels();
  }, [token]);

  const updateLevel = (idx, field, value) => {
    setLevels((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const save = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/levels`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(levels)
      });
      if (!res.ok) throw new Error('Failed to save level settings');
      const data = await res.json();
      setLevels(data.levels || []);
      setSaved('Level configuration saved successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !levels.length) return <div className="main-content"><div className="widget">Loading level configuration...</div></div>;
  if (error) return <div className="main-content"><div className="widget" style={{ background: '#fee2e2', borderColor: '#fecaca', color: '#991b1b' }}>{error}</div></div>;

  return (
    <div className="main-content">
      <div className="content-left">
        <header className="header-section" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1>Level Configuration</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Override duration, question count, and pass score for each JLPT level.</p>
          </div>
        </header>

        <div className="widget" style={{ display: 'grid', gap: '1rem' }}>
          {levels.map((item, idx) => (
            <div key={item.level} className="card" style={{ padding: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem' }}>{item.level}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="profile-label">Duration (min)</label>
                  <input className="auth-input" type="number" value={item.duration} onChange={(e) => updateLevel(idx, 'duration', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="profile-label">Questions</label>
                  <input className="auth-input" type="number" value={item.questions} onChange={(e) => updateLevel(idx, 'questions', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="profile-label">Pass score (%)</label>
                  <input className="auth-input" type="number" value={item.pass_score} onChange={(e) => updateLevel(idx, 'pass_score', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          ))}

          <button className="btn-primary" onClick={save}>Save Level Configuration</button>
          {saved && <p style={{ marginTop: '0.75rem', color: '#166534' }}>{saved}</p>}
        </div>
      </div>
    </div>
  );
};

const QuestionBank = ({ token, availableTests }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/admin/templates`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Unable to load templates');
        const data = await res.json();
        setTemplates(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [token]);

  const deleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/templates/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Unable to delete template');
      setTemplates((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="main-content">
      <div className="content-left">
        <header className="header-section" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1>Question Bank</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>View saved test sets and templates in your account.</p>
          </div>
        </header>

        <div className="widget" style={{ marginBottom: '1.5rem' }}>
          <h2>Saved Tests</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {availableTests.map((test) => (
              <div key={test.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700' }}>{test.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{test.level} • {test.duration} min</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{test.questions?.length || 0} Qs</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="widget">
          <h2>Saved Templates</h2>
          {loading && <p>Loading templates…</p>}
          {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
          <div style={{ display: 'grid', gap: '1rem' }}>
            {templates.map((template) => (
              <div key={template.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700' }}>{template.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{template.level} • {template.questions?.length || 0} questions</div>
                  </div>
                  <button className="btn-nav" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => deleteTemplate(template.id)}>Delete</button>
                </div>
              </div>
            ))}
            {!loading && templates.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No templates saved yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const ExamView = ({ questions, currentIndex, setCurrentIndex, answers, handleAnswer, timeLeft, formatTime, submitTest, user, setView }) => {
  const getFullAudioUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${url}`;
  };

  const audioRef = useRef(null);
  const q = questions[currentIndex];
  const isListening = q?.type === 'Listening' && q?.audio_url;
  const selectedIdx = answers.find(a => a.question_id === q?.id)?.selected_index;

  // Auto-play audio when question changes (avoids React DOM reconciliation bug from autoPlay attr)
  useEffect(() => {
    if (isListening && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {
        // Browser blocked autoplay — user must press play manually
      });
    }
  }, [currentIndex, isListening]);

  return (
    <div className="exam-view-full">
      <div className="exam-card">
        <header className="exam-header">
          <div className="test-info">
            <h2 style={{ fontSize: '1rem', color: 'var(--text-light)' }}>Mock Examination</h2>
            <div style={{ fontWeight: '700' }}>Question {currentIndex + 1} of {questions.length}</div>
          </div>
          <div className="timer-box">{formatTime(timeLeft)}</div>
          <button className="btn-nav" onClick={() => setView(user.role === 'teacher' ? 'admin-dashboard' : 'dashboard')}>Exit</button>
        </header>

        <main className="question-content">
          {/* LISTENING AUDIO PLAYER */}
          {isListening && (
            <div style={{ marginBottom: '1.75rem', background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid #c4b5fd', boxShadow: '0 4px 24px rgba(124,58,237,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, boxShadow: '0 4px 8px rgba(124,58,237,0.3)' }}>🎧</div>
                <div>
                  <div style={{ fontWeight: '800', color: '#7c3aed', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>聴解 — Listening Section</div>
                  <div style={{ fontSize: '0.7rem', color: '#9333ea', marginTop: '0.1rem' }}>Audio plays automatically. You may replay it.</div>
                </div>
              </div>
              <audio
                ref={audioRef}
                controls
                src={getFullAudioUrl(q.audio_url)}
                style={{ width: '100%', borderRadius: '10px' }}
              />
              <p style={{ fontSize: '0.65rem', color: '#7c3aed', marginTop: '0.6rem', fontWeight: '700', textAlign: 'center', letterSpacing: '0.03em' }}>
                ⚠️ The audio script is hidden. Listen carefully and select the correct answer below.
              </p>
            </div>
          )}

          {/* QUESTION TEXT — hidden for listening, shown for reading */}
          {q?.type !== 'Listening' ? (
            <div className="question-text">{q?.question_text}</div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: '#7c3aed', fontStyle: 'italic', textAlign: 'center', padding: '0.75rem 1.25rem', background: '#f5f3ff', borderRadius: '10px', border: '1px dashed #c4b5fd', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              🎧 Listen to the recording above, then select the correct answer.
            </div>
          )}

          {/* ANSWER OPTIONS */}
          <div className="options-list">
            {q?.options.map((opt, idx) => (
              <button
                key={idx}
                className={`option-btn ${selectedIdx === idx ? 'selected' : ''}`}
                onClick={() => handleAnswer(q?.id, idx)}
                style={{
                  borderColor: selectedIdx === idx ? (isListening ? '#7c3aed' : 'var(--primary)') : undefined,
                  background: selectedIdx === idx ? (isListening ? '#ede9fe' : 'var(--primary-light)') : undefined
                }}
              >
                <div className="option-index" style={{ background: selectedIdx === idx ? (isListening ? '#7c3aed' : 'var(--primary)') : undefined, color: selectedIdx === idx ? 'white' : undefined }}>
                  {['A','B','C','D'][idx]}
                </div>
                <div className="option-val">{opt}</div>
              </button>
            ))}
          </div>
        </main>

        <footer className="exam-footer">
          <button className="btn-nav" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>← Previous</button>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            <div style={{ fontWeight: '700' }}>{answers.length} / {questions.length}</div>
            <div>answered</div>
          </div>
          {currentIndex === questions.length - 1 ? (
            <button className="btn-next btn-nav" onClick={() => submitTest()}>Finish Exam ✓</button>
          ) : (
            <button className="btn-next btn-nav" onClick={() => setCurrentIndex(prev => prev + 1)}>Next →</button>
          )}
        </footer>
      </div>
    </div>
  );
};

const ResultView = ({ result, setView }) => (
  <div className="result-card widget">
    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎓</div>
    <h1>Test Result</h1>
    <div className="score-circle">
      <div className="val">{result?.score_percentage}%</div>
      <div className="label">Total Score</div>
    </div>
    <button className="btn-primary" onClick={() => setView('dashboard')}>Back to Dashboard</button>
  </div>
);

// --- Main App Component ---

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [generatingAudioIdx, setGeneratingAudioIdx] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [availableTests, setAvailableTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(7200);

  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'learner' });
  const [editingTest, setEditingTest] = useState(null);

  // Auth persistence
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      setView('login');
    }
  }, [token]);

  // Restore user session from saved token on page reload
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken && !user) {
      fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Token expired');
      })
      .then(userData => {
        setToken(savedToken);
        setUser(userData);
        setView(userData.role === 'teacher' ? 'admin-dashboard' : 'dashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      });
    }
  }, []);

  // Fetch tests
  const fetchTests = async () => {
    if (!token) return;
    try {
      const endpoint = user?.role === 'teacher' ? `${API_URL}/admin/` : `${API_URL}/tests/`;
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableTests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && token) fetchTests();
  }, [user, view]);

  // Timer
  useEffect(() => {
    let timer;
    if (view === 'exam' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && view === 'exam') {
      submitTest(true);
    }
    return () => clearInterval(timer);
  }, [view, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Auth Handlers
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log(`[SIGNUP] Attempting signup to ${API_URL}/auth/signup`);
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      
      console.log(`[SIGNUP] Response status: ${res.status} ${res.statusText}`);
      const contentType = res.headers.get("content-type");
      let data = {};
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error(`[SIGNUP] Non-JSON response: ${text}`);
        throw new Error(`Server Error: ${res.status} ${res.statusText}. Response: ${text.substring(0, 200)}`);
      }

      if (!res.ok) {
        console.error(`[SIGNUP] Error response:`, data);
        throw new Error(data.detail || "Signup failed");
      }
      console.log(`[SIGNUP] Success!`);
      alert("Account created! Please login.");
      setView('login');
    } catch (err) { 
      console.error(`[SIGNUP] Exception:`, err);
      alert(`Signup failed: ${err.message}`); 
    }
    finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log(`[LOGIN] Attempting login to ${API_URL}/auth/login`);
      const formData = new URLSearchParams();
      formData.append('username', authForm.email);
      formData.append('password', authForm.password);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      
      console.log(`[LOGIN] Response status: ${res.status} ${res.statusText}`);
      const contentType = res.headers.get("content-type");
      let data = {};
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error(`[LOGIN] Non-JSON response: ${text}`);
        throw new Error(`Server Error: ${res.status} ${res.statusText}. Response: ${text.substring(0, 200)}`);
      }

      if (!res.ok) {
        console.error(`[LOGIN] Error response:`, data);
        throw new Error(data.detail || "Invalid credentials");
      }
      
      console.log(`[LOGIN] Success!`);
      setToken(data.access_token);
      setUser(data.user);
      setView(data.user.role === 'teacher' ? 'admin-dashboard' : 'dashboard');
    } catch (err) { 
      console.error(`[LOGIN] Exception:`, err);
      alert(`Login failed: ${err.message}`); 
    }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setView('login');
  };

  // Exam Handlers
  const startTest = async (testId) => {
    setLoading(true);
    try {
      const sRes = await fetch(`${API_URL}/tests/start/${testId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!sRes.ok) {
        const errData = await sRes.json().catch(() => ({ detail: 'Failed to start test' }));
        throw new Error(errData.detail || 'Failed to start test');
      }
      const sData = await sRes.json();
      setSession(sData);

      const qRes = await fetch(`${API_URL}/tests/${testId}/questions`);
      const qData = await qRes.json();
      setQuestions(qData);
      const test = availableTests.find(t => t.id === testId);
      setTimeLeft((test?.duration || 120) * 60);
      setView('exam');
      setCurrentIndex(0);
      setAnswers([]);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const submitTest = async (isAuto = false) => {
    if (!isAuto && !window.confirm("Submit?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tests/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ session_id: session.id, answers })
      });
      const data = await res.json();
      setResult(data);
      setView('result');
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleAnswer = (qId, sIdx) => {
    const newAns = [...answers];
    const idx = newAns.findIndex(a => a.question_id === qId);
    if (idx > -1) newAns[idx].selected_index = sIdx;
    else newAns.push({ question_id: qId, selected_index: sIdx });
    setAnswers(newAns);
  };

  // Teacher Handlers
  const createTest = () => { 
    setEditingTest({ title: '', level: 'N4', duration: 120, questions: [] }); 
    setView('test-editor'); 
  };
  const editTest = (t) => { 
    setEditingTest(t); 
    setView('test-editor'); 
  };
  const deleteTest = async (id) => {
    if (window.confirm('Delete?')) {
      await fetch(`${API_URL}/admin/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchTests();
    }
  };
  const saveTest = async () => {
    try {
      const method = editingTest.id ? 'PUT' : 'POST';
      const url = editingTest.id ? `${API_URL}/admin/${editingTest.id}` : `${API_URL}/admin/`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingTest)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(errData.detail || "Failed to save test");
      }
      setView('admin-dashboard');
      fetchTests();
    } catch (err) {
      console.error("Save Test Error:", err);
      alert(`Failed to save test: ${err.message}`);
    }
  };

  const generateAudio = async (qIdx) => {
    try {
      if (!editingTest || !editingTest.questions || qIdx < 0 || qIdx >= editingTest.questions.length) {
        alert("Invalid question index. Please refresh and try again.");
        return;
      }
      
      const q = editingTest.questions[qIdx];
      if (!q.question_text) return alert("Please enter question text first");
      
      console.log(`[AUDIO] Starting generation for question ${qIdx}:`, q.question_text.substring(0, 50) + "...");
      setGeneratingAudioIdx(qIdx);
      
      const qId = q.id || 0;
      const res = await fetch(`${API_URL}/tests/generate-audio/${qId}`, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ text: q.question_text })
      }); 
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(errData.detail || "Audio generation failed");
      }
      
      const data = await res.json();
      console.log(`[AUDIO] Generation successful, URL:`, data.audio_url);
      
      // Store relative URL in state - full URL constructed at render time
      const newQs = [...editingTest.questions];
      newQs[qIdx].audio_url = data.audio_url;
      
      console.log(`[AUDIO] Updating state with audio URL`);
      setEditingTest({ ...editingTest, questions: newQs });
      console.log(`[AUDIO] State updated successfully`);
    } catch (err) { 
      console.error("[AUDIO] Generation Error:", err);
      alert(`AI Generation Failed: ${err.message}`); 
    } finally { 
      setGeneratingAudioIdx(null); 
    }
  };

  return (
    <ErrorBoundary>
      <div className="app-shell">
      {(view === 'login' || view === 'signup') && (
        <AuthView 
          type={view} 
          authForm={authForm} 
          setAuthForm={setAuthForm} 
          handleLogin={handleLogin} 
          handleSignup={handleSignup} 
          setView={setView} 
          loading={loading}
        />
      )}

      {['dashboard', 'admin-dashboard', 'test-editor', 'leaderboard', 'ai-generator'].includes(view) && (
        <>
          <MobileHeader setIsSidebarOpen={setIsSidebarOpen} />
          <Sidebar 
            user={user} 
            view={view} 
            setView={setView} 
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen} 
            handleLogout={handleLogout} 
          />
        </>
      )}

      {view === 'dashboard' && <Dashboard availableTests={availableTests} startTest={startTest} />}
      {view === 'admin-dashboard' && <AdminDashboard availableTests={availableTests} createTest={createTest} editTest={editTest} deleteTest={deleteTest} />}
      {view === 'ai-generator' && <AIQuestionGenerator token={token} />}
      {view === 'ai-listening' && <AIListeningGenerator token={token} />}
      {view === 'module-settings' && <ModuleSettings token={token} />}
      {view === 'level-config' && <LevelConfiguration token={token} />}
      {view === 'question-bank' && <QuestionBank token={token} availableTests={availableTests} />}
      {view === 'test-editor' && (
        <TestEditor 
          editingTest={editingTest} 
          setEditingTest={setEditingTest} 
          saveTest={saveTest} 
          setView={setView} 
          generateAudio={generateAudio}
          loading={loading}
          generatingAudioIdx={generatingAudioIdx}
        />
      )}

      {view === 'exam' && (
        <ExamView 
          questions={questions} 
          currentIndex={currentIndex} 
          setCurrentIndex={setCurrentIndex} 
          answers={answers} 
          handleAnswer={handleAnswer} 
          timeLeft={timeLeft} 
          formatTime={formatTime} 
          submitTest={submitTest} 
          user={user} 
          setView={setView} 
        />
      )}
      
      {view === 'result' && <ResultView result={result} setView={setView} />}

      {view === 'leaderboard' && (
        <div className="main-content">
          <div className="content-left">
            <div className="widget" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
              <h2>Leaderboard</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Coming Soon — Track your ranking against other learners!</p>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setView('dashboard')}>Back to Dashboard</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
