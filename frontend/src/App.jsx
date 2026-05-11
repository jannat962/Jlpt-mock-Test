import React, { useState, useEffect } from 'react';
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

const TestEditor = ({ editingTest, setEditingTest, saveTest, setView, generateAudio, loading }) => {
  const getFullAudioUrl = (url) => {
    if (!url) return '';
    return url;
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
            <button className="btn-primary" style={{ width: 'auto' }} onClick={saveTest}>Save Test</button>
            <button className="btn-nav" style={{ width: 'auto' }} onClick={() => setView('admin-dashboard')}>Cancel</button>
          </div>
        </header>
        
        <div className="widget" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '1rem' }}>
            <div>
              <label className="profile-label">Test Title</label>
              <input 
                type="text" 
                className="auth-input" 
                placeholder="e.g. N4 Mock Exam #1"
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
            <div>
              <label className="profile-label">Mins</label>
              <input type="number" className="auth-input" value={editingTest?.duration} onChange={(e) => setEditingTest({...editingTest, duration: parseInt(e.target.value)})}/>
            </div>
          </div>
        </div>

        <section className="question-bank">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Question Bank ({editingTest.questions?.length || 0})</h2>
            <button className="btn-nav" style={{ width: 'auto', fontSize: '0.8rem' }} onClick={addQuestion}>+ Add Question</button>
          </div>

          <div className="questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {editingTest.questions?.map((q, qIdx) => (
              <div key={qIdx} className="widget" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: '800', color: 'var(--primary)' }}>QUESTION #{qIdx + 1}</span>
                  <button onClick={() => removeQuestion(qIdx)} style={{ color: '#ef4444', fontSize: '0.8rem' }}>Remove</button>
                </div>
                
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
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                Processing AI Voice...
                              </>
                            ) : (
                              <>✨ Generate High-Fidelity Audio</>
                            )}
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
                        
                        {q.audio_url ? (
                          <div style={{ width: '100%' }}>
                            <audio 
                              controls 
                              src={getFullAudioUrl(q.audio_url)} 
                              style={{ width: '100%', height: '36px', borderRadius: '8px' }} 
                            />
                            <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                              Tip: AI has processed your script into high-quality Japanese speech.
                            </p>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '0.5rem', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              No audio found. Type your script below and click generate to create AI voice.
                            </p>
                          </div>
                        )}
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

const ExamView = ({ questions, currentIndex, setCurrentIndex, answers, handleAnswer, timeLeft, formatTime, submitTest, user, setView }) => {
  const getFullAudioUrl = (url) => {
    if (!url) return '';
    return url;
  };

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
          {questions[currentIndex]?.audio_url && (
            <div className="listening-section" style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: '700', fontSize: '0.8rem' }}>
                <span>🔊 LISTENING SECTION (LISTEN CAREFULLY)</span>
              </div>
              <audio controls autoPlay src={getFullAudioUrl(questions[currentIndex].audio_url)} style={{ width: '100%' }} />
            </div>
          )}
          
          {questions[currentIndex]?.type !== 'Listening' ? (
            <div className="question-text">{questions[currentIndex]?.question_text}</div>
          ) : (
            <div className="question-text" style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
              "Listen to the audio clip above and select the correct answer from the 4 options below."
            </div>
          )}
        <div className="options-list">
          {questions[currentIndex]?.options.map((opt, idx) => (
            <button
              key={idx}
              className={`option-btn ${answers.find(a => a.question_id === questions[currentIndex]?.id)?.selected_index === idx ? 'selected' : ''}`}
              onClick={() => handleAnswer(questions[currentIndex]?.id, idx)}
            >
              <div className="option-index">{idx + 1}</div>
              <div className="option-val">{opt}</div>
            </button>
          ))}
        </div>
      </main>

      <footer className="exam-footer">
        <button className="btn-nav" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>Previous</button>
        {currentIndex === questions.length - 1 ? (
          <button className="btn-next btn-nav" onClick={() => submitTest()}>Finish Exam</button>
        ) : (
          <button className="btn-next btn-nav" onClick={() => setCurrentIndex(prev => prev + 1)}>Next Question</button>
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
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      
      const contentType = res.headers.get("content-type");
      let data = {};
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server Error: ${res.status} ${res.statusText}`);
      }

      if (!res.ok) throw new Error(data.detail || "Signup failed");
      alert("Account created! Please login.");
      setView('login');
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', authForm.email);
      formData.append('password', authForm.password);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      
      const contentType = res.headers.get("content-type");
      let data = {};
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        throw new Error(`Server Error: ${res.status} ${res.statusText}`);
      }

      if (!res.ok) throw new Error(data.detail || "Invalid credentials");
      
      setToken(data.access_token);
      setUser(data.user);
      setView(data.user.role === 'teacher' ? 'admin-dashboard' : 'dashboard');
    } catch (err) { alert(err.message); }
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
      setLoading(true);
      
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
      setLoading(false); 
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

      {['dashboard', 'admin-dashboard', 'test-editor', 'leaderboard'].includes(view) && (
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
      {view === 'test-editor' && (
        <TestEditor 
          editingTest={editingTest} 
          setEditingTest={setEditingTest} 
          saveTest={saveTest} 
          setView={setView} 
          generateAudio={generateAudio}
          loading={loading}
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
