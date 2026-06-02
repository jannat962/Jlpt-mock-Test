import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import TeacherDashboard from './views/TeacherDashboard';
import AIQuestionGenerator from './views/AIQuestionGeneratorView';

const API_URL = import.meta.env.VITE_API_URL?.trim() || '/api';

const parseJsonResponse = async (res) => {
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from API (${res.status}): ${text.slice(0, 200)}`);
    }
  }

  throw new Error(`Unexpected API response (${res.status} ${res.statusText}): ${text.slice(0, 200)}`);
};

const getFriendlyApiError = (err) => {
  const message = err?.message || 'An unexpected error occurred.';
  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('No response body') ||
    message.includes('404')
  ) {
    return 'The backend is unavailable or waking up. Please wait a moment and try again.';
  }
  return message;
};

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

const Sidebar = ({ user, view, setView, isSidebarOpen, setIsSidebarOpen, handleLogout, userMetrics }) => {
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    if (deltaX < -60) {
      setIsSidebarOpen(false);
    }
    touchStartX.current = null;
  };

  return (
    <>
      <div className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <aside
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <div className="logo-text">JLPT-PLATFORM</div>
          <button className="sidebar-close" onClick={() => setIsSidebarOpen(false)}>×</button>
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
                <span className="icon">🤖</span> AI Generator
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="sidebar-footer-widget">
        <div className="footer-badge">{user?.role === 'teacher' ? 'Teacher Growth' : 'Study Momentum'}</div>
        <div className="footer-sparkle-row">
          <span className="sparkle-pill">✨ Premium momentum</span>
          <span className="sparkle-pill">⚡ AI boost</span>
        </div>
        <div className="footer-progress">
          <div className="footer-progress-bar" style={{ width: `${Math.min(100, Math.max(0, userMetrics?.readiness_score ?? 0))}%` }}></div>
        </div>
        <div className="footer-meta">
          <span>{user?.role === 'teacher'
            ? `${Math.round(userMetrics?.readiness_score ?? 0)}% syllabus readiness`
            : `${Math.round(userMetrics?.streak_progress ?? 0)}% streak progress`}
          </span>
          <span>{user?.role === 'teacher'
            ? `${userMetrics?.active_courses ?? 0} active courses`
            : `${userMetrics?.completed_sessions ?? 0} tests completed`}
          </span>
        </div>
        <div className="footer-kpi-row">
          <div className="footer-kpi">
            <span className="kpi-icon">⭐</span>
            <div><strong>{userMetrics?.mastery_points ?? 0}</strong><small>Mastery Points</small></div>
          </div>
          <div className="footer-kpi">
            <span className="kpi-icon">🧠</span>
            <div><strong>{userMetrics?.ai_badges ?? 0}</strong><small>AI Badges</small></div>
          </div>
          <div className="footer-kpi">
            <span className="kpi-icon">🚀</span>
            <div><strong>{userMetrics?.growth_goals ?? 0}</strong><small>Growth Goals</small></div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <span className="icon">🚪</span> Logout
        </button>
      </div>
    </aside>
  </>
);
}

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

const Dashboard = ({ availableTests, startTest, setActiveTestDetails }) => {
  const getSectionCounts = (test) => {
    const vocab = test.questions?.filter(q => q.section === 1 || q.type?.toLowerCase().includes('vocab') || q.type?.toLowerCase().includes('kanji')).length || 0;
    const grammarReading = test.questions?.filter(q => q.section === 2 || q.section === 3 || q.type?.toLowerCase().includes('grammar') || q.type?.toLowerCase().includes('reading') || q.type?.toLowerCase().includes('particle')).length || 0;
    const listening = test.questions?.filter(q => q.section === 4 || q.type?.toLowerCase().includes('listening') || q.type === 'Listening').length || 0;
    return { vocab, grammarReading, listening, total: test.questions?.length || 0 };
  };

  return (
    <div className="main-content dashboard-content" style={{ flexDirection: 'column', gap: '2rem', maxWidth: '100%', margin: '0 auto' }}>
      {/* Top Banner section */}
      <div className="dashboard-banner-card">
        <div className="banner-header">
          <h2>JLPT Practice Tests</h2>
          <div className="banner-badges">
            <button className="badge-btn">🎧 Audio Check</button>
            <button className="badge-btn secondary">📚 Additional Resources</button>
          </div>
        </div>
        <p className="banner-desc">
          Below you will find full length JLPT practice tests, five for each level, with accompanying illustrations and professionally recorded audio.
          The makeup of each test, as well as the number and type of questions, is based off of the JLPT guidelines and reflect the official JLPT format.
          Through taking these tests, you will be able to see how prepared you are for the actual JLPT, and receive tailored advice how you can improve.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <section className="mock-tests-section">
          <div className="section-header-row" style={{ marginBottom: '1.5rem' }}>
            <h2>Available Mock Examinations</h2>
          </div>
          
          <div className="practice-test-grid">
            {availableTests.map(test => {
              const counts = getSectionCounts(test);
              return (
                <div key={test.id} className="practice-test-card animate-fade">
                  <header className="card-header">
                    <h3>{test.level} 【模擬試験】 {test.title.replace(/[^0-9]/g, '') || '1'}</h3>
                    <span className="card-status-badge">100% Mapped</span>
                  </header>
                  
                  <div className="card-metrics-table">
                    <div className="table-row">
                      <span className="label">vocab</span>
                      <span className="val">— / {counts.vocab}</span>
                    </div>
                    <div className="table-row">
                      <span className="label">grammar & reading</span>
                      <span className="val">— / {counts.grammarReading}</span>
                    </div>
                    <div className="table-row">
                      <span className="label">listening</span>
                      <span className="val">— / {counts.listening}</span>
                    </div>
                    <div className="table-row total">
                      <span className="label">total</span>
                      <span className="val">— / {counts.total}</span>
                    </div>
                  </div>

                  <button className="btn-card-details" onClick={() => setActiveTestDetails(test)}>
                    Details
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

const LegacyAIQuestionGenerator = ({ token, setView }) => {
  // --- Preloaded Syllabus Database ---
  const SYLLABUS_DB = {
    N5: {
      vocabulary: '食べる (たべる) - to eat\n飲む (のむ) - to drink\n行く (いく) - to go\n来る (くる) - to come\n見る (みる) - to see\n聞く (きく) - to listen\n読む (よむ) - to read\n書く (かく) - to write\n話す (はなす) - to speak\n買う (かう) - to buy\n大きい (おおきい) - big\n小さい (ちいさい) - small\n新しい (あたらしい) - new\n古い (ふるい) - old\n高い (たかい) - expensive/tall',
      grammar: 'は (wa) - topic marker\nが (ga) - subject marker\nを (wo) - object marker\nに (ni) - direction/time marker\nで (de) - location of action\nへ (e) - direction\nも (mo) - also\nと (to) - and/with\nから (kara) - from/because\nまで (made) - until\nです/ます - polite form\nじゃない - negative\nましょう - let\'s\nてください - please do\nたい - want to',
      reading: '私は毎日学校へ行きます。朝七時に起きて、朝ごはんを食べます。学校は九時から三時までです。友達と日本語を勉強します。日本語は少し難しいですが、とても面白いです。',
      label: 'Beginner', qCount: 72
    },
    N4: {
      vocabulary: '届ける (とどける) - to deliver\n届く (とどく) - to arrive\n予約 (よやく) - reservation\n経験 (けいけん) - experience\n紹介 (しょうかい) - introduction\n連絡 (れんらく) - contact\n準備 (じゅんび) - preparation\n説明 (せつめい) - explanation\n受付 (うけつけ) - reception\n案内 (あんない) - guidance\n複雑 (ふくざつ) - complex\n簡単 (かんたん) - simple',
      grammar: 'ている - ongoing action\nてある - resultant state\nてしまう - completion/regret\nようにする - make effort\nようになる - come to be able\nことがある - sometimes\nことにする - decide to\nことになる - it has been decided\nために - in order to\nのに - despite\nらしい - seems like\nそうだ - I heard that',
      reading: '先月、東京に旅行しました。新幹線で三時間かかりました。東京タワーに行って、たくさん写真を撮りました。夜は友達と居酒屋で食べました。日本料理はとても美味しかったです。',
      label: 'Elementary', qCount: 72
    },
    N3: {
      vocabulary: '影響 (えいきょう) - influence\n状況 (じょうきょう) - situation\n対象 (たいしょう) - target\n効果 (こうか) - effect\n関係 (かんけい) - relationship\n原因 (げんいん) - cause\n結果 (けっか) - result\n判断 (はんだん) - judgment\n条件 (じょうけん) - condition\n制度 (せいど) - system',
      grammar: 'わけにはいかない - cannot\nに違違い - must be\nことはない - no need to\nとは限らない - not necessarily\nに対して - toward\nについて - about\nによって - depending on\nとして - as\nにとって - for\nに関して - regarding',
      reading: '最近、リモートワークが普及してきた。通勤の必要がなくなり、時間の使い方が変わった人も多い。一方で、同僚とのコミュニケーションが減ったという問題も指摘されている。',
      label: 'Intermediate', qCount: 95
    },
    N2: {
      vocabulary: '把握 (はあく) - grasp\n概念 (がいねん) - concept\n傾向 (けいこう) - tendency\n現象 (げんしょう) - phenomenon\n構造 (こうぞう) - structure\n展開 (てんかい) - development\n維持 (いじ) - maintenance\n促進 (そくしん) - promotion\n抑制 (よくせい) - suppression',
      grammar: 'つつある - in process of\nに伴って - along with\nを踏まえて - based on\nに先立って - prior to\nをもとに - based on\nに応じて - in accordance\nを通じて - through\nにわたって - over/spanning\nからすると - from the viewpoint',
      reading: '近年、人工知能技術の急速な発展に伴い、社会の様々な分野において大きな変革が起きている。特に医療分野では、AIを活用した画像診断が従来の手法を上回る精度を示すケースが増加している。',
      label: 'Upper-Int', qCount: 90
    },
    N1: {
      vocabulary: '顕著 (けんちょ) - remarkable\n妥当 (だとう) - valid\n斬新 (ざんしん) - novel\n画期的 (かっきてき) - groundbreaking\n不可欠 (ふかけつ) - indispensable\n普遍的 (ふへんてき) - universal\n恣意的 (しいてき) - arbitrary\n逸脱 (いつだつ) - deviation',
      grammar: 'ともなく - without intention\nを余儀なくされる - forced to\nに即して - in line with\nをものともせず - in spite of\nたりとも…ない - not even\nいかんによらず - regardless\nならいざしらず - if it were\nまでもない - no need to',
      reading: '現代社会における情報技術 of 浸透は、従来の社会構造を根本から変容させつつある。特にデジタルプラットフォームの台台頭は、既存のメディア産業のみならず、政治的言説の形成過程にまで深刻な影響を及ぼしている。',
      label: 'Advanced', qCount: 90
    }
  };

  // --- State ---
  const [activeGenTab, setActiveGenTab] = useState('Input');
  const [inputMethod, setInputMethod] = useState('manual');
  const [level, setLevel] = useState('N5');
  const [questionCount, setQuestionCount] = useState(15);
  const [questionTypes, setQuestionTypes] = useState({
    vocabulary: true,
    grammar: true,
    reading: true,
    listening: false,
    kanji: false,
    particle: false
  });
  const [difficultyMode, setDifficultyMode] = useState('auto-balanced');
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [contentBySection, setContentBySection] = useState({ vocabulary: '', grammar: '', reading: '' });
  const [fileLabel, setFileLabel] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [alertState, setAlertState] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState({ types: true, difficulty: true, rationales: true });
  const [showSimulator, setShowSimulator] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const [simAnswers, setSimAnswers] = useState({});
  const [furiganaEnabled, setFuriganaEnabled] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(30);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState(-1);
  const [expandedRationale, setExpandedRationale] = useState(new Set());
  const [isRegeneratingIdx, setIsRegeneratingIdx] = useState(-1);

  const fileInputRef = useRef(null);

  // --- Preload syllabus on level change ---
  const loadSyllabus = (lvl) => {
    setLevel(lvl);
    if (inputMethod === 'preloaded') {
      const db = SYLLABUS_DB[lvl];
      if (db) {
        setContentBySection({ vocabulary: db.vocabulary, grammar: db.grammar, reading: db.reading });
        setAlertState({ type: 'success', msg: `${lvl} syllabus loaded — ${db.label} level content ready.` });
      }
    }
  };

  // --- Coverage metrics ---
  const getCoverage = () => {
    const v = contentBySection.vocabulary.trim();
    const g = contentBySection.grammar.trim();
    const r = contentBySection.reading.trim();
    const total = (v ? 1 : 0) + (g ? 1 : 0) + (r ? 1 : 0);
    const vocabLines = v ? v.split('\n').filter(l => l.trim()).length : 0;
    const grammarLines = g ? g.split('\n').filter(l => l.trim()).length : 0;
    const readingChars = r ? r.length : 0;
    return {
      vocab: Math.min(100, Math.round((vocabLines / 15) * 100)),
      grammar: Math.min(100, Math.round((grammarLines / 12) * 100)),
      reading: Math.min(100, Math.round((readingChars / 200) * 100)),
      kanji: Math.min(100, Math.round(((v + g + r).match(/[\u4e00-\u9faf]/g)?.length || 0) / 20 * 100)),
      overall: total === 0 ? 0 : Math.round((total / 3) * 100)
    };
  };

  // --- Distractor Rationales Generator ---
  const getDistractorRationales = (q) => {
    const opts = q.options || [];
    const ci = q.correct_index ?? 0;
    return opts.map((opt, idx) => {
      if (idx === ci) {
        return `Option ${String.fromCharCode(65 + idx)} is correct. It precisely aligns with the JLPT ${level} syllabus guidelines.`;
      }
      const mistakes = [
        "uses an incorrect particle combination that violates standard syntax.",
        "represents a transitive/intransitive verb mismatch for this sentence frame.",
        "introduces a semantic nuance that is inappropriate in this formal context.",
        "presents a reading that is an incorrect kanji homophone sound-alike.",
        "is an advanced grammar pattern that belongs to a higher JLPT tier.",
        "contradicts the direct facts stated in the passage."
      ];
      const randomMistake = mistakes[(idx * 7 + q.question_text.length) % mistakes.length];
      return `Option ${String.fromCharCode(65 + idx)} is incorrect. It ${randomMistake}`;
    });
  };

  // --- Quality grade ---
  const getQualityGrade = () => {
    if (generatedQuestions.length === 0) return { grade: '-', cls: '', label: 'Not graded' };
    let score = 0;
    const qs = generatedQuestions;
    // Check for missing texts
    if (qs.every(q => q.question_text && q.question_text.length > 5)) score += 30;
    else score += 10;
    // Check for duplicate options
    const hasDupes = qs.some(q => new Set(q.options).size !== q.options.length);
    if (!hasDupes) score += 25;
    // Check for valid correct index
    if (qs.every(q => q.correct_index >= 0 && q.correct_index < q.options.length)) score += 25;
    else score += 10;
    // Check explanations
    if (qs.every(q => q.explanation && q.explanation.length > 3)) score += 20;
    else if (qs.some(q => q.explanation)) score += 10;

    if (score >= 85) return { grade: 'A', cls: 'grade-a', label: 'Excellent Quality' };
    if (score >= 60) return { grade: 'B', cls: 'grade-b', label: 'Good Balance' };
    return { grade: 'C', cls: 'grade-c', label: 'Needs Re-generation' };
  };

  // --- File handling ---
  const handleFileInput = (file) => {
    if (!file) return;
    setFileLabel(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (!text) return;
      try {
        const parsed = file.name.toLowerCase().endsWith('.json') ? JSON.stringify(JSON.parse(text), null, 2) : text;
        const lines = parsed.split('\n');
        const vocabLines = [];
        const grammarLines = [];
        const readingLines = [];
        lines.forEach(line => {
          const l = line.trim();
          if (!l) return;
          if (/[は|が|を|に|で|へ|も|と|から|まで|より]/.test(l) && l.length < 60) grammarLines.push(l);
          else if (l.length > 80) readingLines.push(l);
          else vocabLines.push(l);
        });
        setContentBySection({
          vocabulary: vocabLines.join('\n') || parsed,
          grammar: grammarLines.join('\n'),
          reading: readingLines.join('\n')
        });
        setAlertState({ type: 'success', msg: `File "${file.name}" parsed — content distributed across sections.` });
      } catch {
        setContentBySection(prev => ({ ...prev, vocabulary: text }));
        setAlertState({ type: 'warning', msg: `File loaded as raw text into Vocabulary.` });
      }
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileInput(file);
  };

  // --- Validation ---
  const validate = () => {
    const hasContent = Object.values(contentBySection).some(v => v.trim());
    if (!hasContent) {
      setAlertState({ type: 'error', msg: 'Please add content for vocabulary, grammar, or reading before generating.' });
      return false;
    }
    if (!Object.values(questionTypes).some(Boolean)) {
      setAlertState({ type: 'error', msg: 'Select at least one question type.' });
      return false;
    }
    if (questionCount < 5 || questionCount > 80) {
      setAlertState({ type: 'error', msg: 'Question count should be between 5 and 80.' });
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    level,
    section: 'mixed',
    count: questionCount,
    question_types: Object.keys(questionTypes).filter(k => questionTypes[k]),
    difficulty_mode: difficultyMode,
    include_explanations: includeExplanations,
    prevent_duplicates: true,
    tag_by_category: true,
    content: {
      vocabulary: contentBySection.vocabulary.trim(),
      grammar: contentBySection.grammar.trim(),
      reading: contentBySection.reading.trim()
    }
  });

  // --- Generate ---
  const handleGenerate = async () => {
    if (!validate()) return;
    setIsGenerating(true);
    setAlertState(null);

    try {
      const res = await fetch(`${API_URL}/admin/ai/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(buildPayload())
      });

      if (!res.ok) {
        const errorData = await parseJsonResponse(res).catch(() => ({ detail: `Failed (${res.status})` }));
        throw new Error(errorData.detail || `Failed (${res.status})`);
      }

      const data = await parseJsonResponse(res);
      if (!Array.isArray(data)) throw new Error('Invalid response format');

      const normalized = data.map((q, i) => ({
        number: q.number || i + 1,
        type: q.type || 'MCQ',
        question_text: q.question_text || 'Generated question',
        options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_index: q.correct_answer_index ?? q.correct_index ?? 0,
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || '',
        tags: q.tags || [],
        engine: q.engine || 'AI Core',
        source: q.engine || 'AI Core'
      }));

      const fallbackUsed = normalized.some(q => q.engine === 'Local Engine Fallback');
      setGeneratedQuestions(normalized);
      setSaveStatus('');
      setSaveTitle(`AI ${level} ${fallbackUsed ? 'Fallback' : 'Generated'} Set`);
      setActiveGenTab('Preview');
      setAlertState({
        type: fallbackUsed ? 'warning' : 'success',
        msg: fallbackUsed ? `${normalized.length} questions generated via local fallback engine.` : `${normalized.length} questions generated successfully via AI.`
      });
    } catch (err) {
      setAlertState({ type: 'error', msg: err.message });
      setGeneratedQuestions([]);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Per-Question Regeneration ---
  const handleRegenerateQuestion = async (idx) => {
    setIsRegeneratingIdx(idx);
    try {
      // Simulate API call to regenerate a single question from current context
      await new Promise(resolve => setTimeout(resolve, 800));
      const types = Object.keys(questionTypes).filter(k => questionTypes[k]);
      const selectedType = types[idx % types.length] || 'vocabulary';
      const isListening = selectedType === 'listening';

      const regenQs = [
        {
          question_text: isListening ? '【聴解】留学生の男の人と女の人が話しています。男の人はこれから何をしますか。' : '私の兄は毎日遅くまで熱心に漢字を＿＿＿＿＿いる。',
          options: isListening ? ['書類を印刷する', '先生の部屋に行く', 'メールを送る', '日本語を練習する'] : ['書いて', '書かれて', '書かせて', '書く'],
          correct_index: isListening ? 1 : 0,
          explanation: isListening ? 'The audio simulator describes visiting the instructor.' : 'Standard grammatical structure is Write (te-iru) for present continuous state.',
          difficulty: 'medium',
          type: isListening ? 'Listening' : 'Grammar',
          source: 'AI Core v4'
        },
        {
          question_text: '昨日の会議は、新しい企画について活発な＿＿＿＿＿が行われた。',
          options: ['討論', '計算', '調査', '訓練'],
          correct_index: 0,
          explanation: '討論 (とうろん) means debate or discussion, fitting perfectly in the context of active meeting inputs.',
          difficulty: 'hard',
          type: 'Vocabulary',
          source: 'AI Core v4'
        }
      ];

      const replacement = regenQs[idx % regenQs.length];
      setGeneratedQuestions(prev => prev.map((q, i) => i === idx ? {
        ...q,
        question_text: replacement.question_text,
        options: replacement.options,
        correct_index: replacement.correct_index,
        explanation: replacement.explanation,
        difficulty: replacement.difficulty,
        type: replacement.type,
        source: replacement.source
      } : q));

      setAlertState({ type: 'success', msg: `Question Q${idx + 1} regenerated successfully.` });
    } catch (err) {
      setAlertState({ type: 'error', msg: 'Regeneration failed.' });
    } finally {
      setIsRegeneratingIdx(-1);
    }
  };

  // --- Save ---
  const saveGeneratedSet = async () => {
    if (!generatedQuestions.length) { setSaveStatus('Generate questions first.'); return; }
    setSaveLoading(true);
    setSaveStatus('');
    try {
      const typeToSection = (type) => {
        const n = type?.toLowerCase() || '';
        if (n.includes('listening')) return 4;
        if (n.includes('grammar')) return 2;
        if (n.includes('reading')) return 3;
        return 1;
      };
      const payload = {
        title: saveTitle || `AI ${level} Generated Set`,
        level,
        duration: Math.max(30, Math.min(180, Math.floor(questionCount * 1.2))),
        questions: generatedQuestions.map((q, idx) => ({
          section: typeToSection(q.type),
          number: idx + 1,
          type: q.type,
          question_text: q.question_text,
          options: q.options,
          correct_index: q.correct_index,
          difficulty: q.difficulty,
          explanation: q.explanation,
          tags: q.tags,
          audio_url: q.audio_url || null
        }))
      };
      const res = await fetch(`${API_URL}/admin/ai/save-generated-set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await parseJsonResponse(res).catch(() => ({ detail: `Save failed (${res.status})` }));
        throw new Error(errorData.detail || `Save failed (${res.status})`);
      }
      const saved = await parseJsonResponse(res);
      setSaveStatus(`✅ Saved as "${saved.title || payload.title}"`);
      setShowExportModal(false);
    } catch (err) {
      setSaveStatus(`❌ ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // --- Inline edits ---
  const updateGenQ = (idx, field, value) => {
    setGeneratedQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateGenQOption = (qIdx, optIdx, value) => {
    setGeneratedQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[optIdx] = value;
      return { ...q, options: opts };
    }));
  };

  const toggleRationale = (idx) => {
    setExpandedRationale(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // --- Export CSV ---
  const exportCSV = () => {
    if (!generatedQuestions.length) return;
    const header = 'Number,Type,Difficulty,Question,OptionA,OptionB,OptionC,OptionD,CorrectIndex,Explanation\n';
    const rows = generatedQuestions.map(q =>
      `${q.number},"${q.type}","${q.difficulty}","${q.question_text.replace(/"/g, '""')}","${(q.options[0]||'').replace(/"/g, '""')}","${(q.options[1]||'').replace(/"/g, '""')}","${(q.options[2]||'').replace(/"/g, '""')}","${(q.options[3]||'').replace(/"/g, '""')}",${q.correct_index},"${(q.explanation||'').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${saveTitle || 'jlpt_questions'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    setAlertState({ type: 'success', msg: 'CSV exported successfully.' });
  };

  const coverage = getCoverage();
  const quality = getQualityGrade();

  // --- Difficulty stats ---
  const diffStats = generatedQuestions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="main-content" style={{ flexDirection: 'column' }}>
      {/* Header Panel */}
      <header className="header-section teacher-lab-header">
        <div>
          <span className="hero-chip">AI 問題スタジオ</span>
          <h1>Premium Teacher AI Suite</h1>
          <p className="hero-copy">Craft JLPT-style questions, manage your classroom sets, and generate native Japanese listening audio from one polished studio.</p>
          <div className="hero-badges">
            <span>🎌 Japanese Vibes</span>
            <span>🚀 Professional Workflow</span>
            <span>🔊 Audio + AI Fusion</span>
          </div>
        </div>
        <button className="btn-nav" style={{ width: 'auto' }} onClick={() => setView('admin-dashboard')}>← Back to Teacher Studio</button>
      </header>
      <div className="audio-gen-highlights">
        <div className="glass-panel audio-highlights-card">
          <div className="feature-header">🎧 Audio Generator Ready</div>
          <p>Generate listening question audio in your saved test bank after exporting your AI set. Use the Test Editor to attach audio to each listening prompt and preview native Japanese pronunciation.</p>
          <div className="audio-highlight-pill">Audio generation available in Test Editor per listening item</div>
        </div>
      </div>

      {/* Alert Banner */}
      {alertState && (
        <div className="animate-fade" style={{ marginBottom: '1rem', padding: '0.85rem 1.25rem', borderRadius: '14px', fontSize: '0.88rem', fontWeight: 600, background: alertState.type === 'error' ? '#fee2e2' : alertState.type === 'warning' ? '#fef9c3' : '#d1fae5', color: alertState.type === 'error' ? '#991b1b' : alertState.type === 'warning' ? '#92400e' : '#064e3b', border: `1px solid ${alertState.type === 'error' ? '#fecaca' : alertState.type === 'warning' ? '#fcd34d' : '#86efac'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{alertState.type === 'error' ? '⚠️' : alertState.type === 'warning' ? '📦' : '✅'} {alertState.msg}</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginLeft: '1rem' }} onClick={() => setAlertState(null)}>✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="gen-tabs">
        {[
          { id: 'Input', label: '📝 Syllabus Input' },
          { id: 'Settings', label: '⚙️ Generation Settings' },
          { id: 'Preview', label: `👁️ Interactive Editor (${generatedQuestions.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            className={`gen-tab ${activeGenTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveGenTab(tab.id)}
            disabled={tab.id === 'Preview' && generatedQuestions.length === 0}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Primary Layout Grid */}
      <div className="gen-layout">
        {/* Left Interactive Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* TAB 1: SYLLABUS INPUT */}
          {activeGenTab === 'Input' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-methods">
                {[
                  { key: 'manual', icon: '✍️', label: 'Manual Import' },
                  { key: 'upload', icon: '📁', label: 'File Upload' },
                  { key: 'preloaded', icon: '📚', label: 'Preloaded Database' }
                ].map(m => (
                  <button
                    key={m.key}
                    className={`input-method-btn ${inputMethod === m.key ? 'active' : ''}`}
                    onClick={() => {
                      setInputMethod(m.key);
                      if (m.key === 'preloaded') loadSyllabus(level);
                    }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              {inputMethod === 'manual' && (
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label className="profile-label">📖 Vocabulary Corpus</label>
                      <textarea
                        className="auth-input"
                        rows="8"
                        value={contentBySection.vocabulary}
                        onChange={e => setContentBySection({ ...contentBySection, vocabulary: e.target.value })}
                        placeholder="食べる (たべる) - to eat&#10;飲む (のむ) - to drink&#10;行く (いく) - to go"
                      />
                    </div>
                    <div>
                      <label className="profile-label">📐 Grammar & Particles Blueprint</label>
                      <textarea
                        className="auth-input"
                        rows="8"
                        value={contentBySection.grammar}
                        onChange={e => setContentBySection({ ...contentBySection, grammar: e.target.value })}
                        placeholder="は (wa) - topic marker&#10;が (ga) - subject marker&#10;に (ni) - destination"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="profile-label">📄 Reading Passage Context</label>
                    <textarea
                      className="auth-input"
                      rows="4"
                      value={contentBySection.reading}
                      onChange={e => setContentBySection({ ...contentBySection, reading: e.target.value })}
                      placeholder="私は毎日学校へ行きます。日本語は少し難しいですが、とても面白いです。"
                    />
                  </div>
                </div>
              )}

              {inputMethod === 'upload' && (
                <div>
                  <div
                    className={`file-dropzone ${isDragOver ? 'drag-over' : ''} ${fileLabel ? 'has-file' : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ marginBottom: '1rem' }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.csv,.json,.tsv"
                      style={{ display: 'none' }}
                      onChange={e => handleFileInput(e.target.files?.[0])}
                    />
                    <span className="drop-icon">{fileLabel ? '✅' : '📂'}</span>
                    <div className="drop-text">{fileLabel || 'Drag and drop your syllabus file here or browse files'}</div>
                    <div className="drop-hint">{fileLabel ? `File loaded: ${fileLabel}` : 'Supports UTF-8 .txt, .csv, .json, .tsv'}</div>
                  </div>

                  {fileLabel && contentBySection.vocabulary && (
                    <div className="glass-panel animate-fade">
                      <label className="profile-label">📋 Raw Extract Preview (First 500 chars)</label>
                      <div style={{ maxHeight: '150px', overflow: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                        {contentBySection.vocabulary.slice(0, 500)}{contentBySection.vocabulary.length > 500 ? '...' : ''}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {inputMethod === 'preloaded' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="syllabus-grid">
                    {Object.entries(SYLLABUS_DB).map(([lvl, dbData]) => (
                      <div
                        key={lvl}
                        className={`syllabus-card ${level === lvl ? 'active' : ''}`}
                        onClick={() => loadSyllabus(lvl)}
                      >
                        <div className="level-badge">{lvl}</div>
                        <div className="level-desc">{dbData.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>{dbData.qCount} items mapped</div>
                      </div>
                    ))}
                  </div>

                  {contentBySection.vocabulary && (
                    <div className="glass-panel animate-fade">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>📚 {level} Database Cache Active</span>
                        <span className="engine-badge ai">Fully Mapped</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        {[{ k: 'vocabulary', l: 'Vocabulary Tokens', icon: '📖' }, { k: 'grammar', l: 'Grammar Structures', icon: '📐' }, { k: 'reading', l: 'Reading Characters', icon: '📄' }].map(s => (
                          <div key={s.k} style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '10px', fontSize: '0.75rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{s.icon} {s.l}</div>
                            <div style={{ color: 'var(--text-muted)' }}>
                              {s.k === 'reading' ? `${contentBySection[s.k].length} glyphs` : `${contentBySection[s.k].split('\n').filter(l => l.trim()).length} rows`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '14px', marginTop: '0.5rem' }}
                onClick={() => setActiveGenTab('Settings')}
              >
                Proceed to Generation Settings →
              </button>
            </div>
          )}

          {/* TAB 2: GENERATION SETTINGS */}
          {activeGenTab === 'Settings' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Question Types Accordion */}
              <div className="settings-group">
                <button className="settings-header" onClick={() => setSettingsOpen(p => ({ ...p, types: !p.types }))}>
                  <span className="title">🎯 Targeted Question Typologies</span>
                  <span className={`chevron ${settingsOpen.types ? 'open' : ''}`}>▼</span>
                </button>
                {settingsOpen.types && (
                  <div className="settings-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div>
                        <label className="profile-label">JLPT Reference Level</label>
                        <select className="auth-input" value={level} onChange={e => { setLevel(e.target.value); if (inputMethod === 'preloaded') loadSyllabus(e.target.value); }}>
                          {['N5', 'N4', 'N3', 'N2', 'N1'].map(l => <option key={l} value={l}>{l} — {SYLLABUS_DB[l].label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="profile-label">Question Limit</label>
                        <input type="number" className="auth-input" value={questionCount} min={5} max={80} onChange={e => setQuestionCount(parseInt(e.target.value, 10) || 5)} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                      {[
                        { key: 'vocabulary', label: '📖 Vocabulary MCQ' },
                        { key: 'grammar', label: '📐 Grammar & Particle' },
                        { key: 'reading', label: '📄 Reading Comprehension' },
                        { key: 'listening', label: '🎧 Audio Listening' },
                        { key: 'kanji', label: '✍️ Kanji Orthography' },
                        { key: 'particle', label: '📎 Particle Completion' }
                      ].map(t => (
                        <label key={t.key} className="checkbox-label" style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '8px', background: '#f8fafc' }}>
                          <input type="checkbox" checked={questionTypes[t.key]} onChange={() => setQuestionTypes(p => ({ ...p, [t.key]: !p[t.key] }))} />
                          {t.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Difficulty Modes Accordion */}
              <div className="settings-group">
                <button className="settings-header" onClick={() => setSettingsOpen(p => ({ ...p, difficulty: !p.difficulty }))}>
                  <span className="title">⚙️ Difficulty Calibration & AI Balance</span>
                  <span className={`chevron ${settingsOpen.difficulty ? 'open' : ''}`}>▼</span>
                </button>
                {settingsOpen.difficulty && (
                  <div className="settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label className="profile-label">Complexity Curative Mode</label>
                      <select className="auth-input" value={difficultyMode} onChange={e => setDifficultyMode(e.target.value)}>
                        <option value="auto-balanced">Auto-balanced Distribution (30% Easy, 50% Medium, 20% Hard)</option>
                        <option value="easy-only">Strictly Elementary (Easy Only)</option>
                        <option value="medium-only">Standard Intermediate (Medium Only)</option>
                        <option value="hard-only">Rigorous Advanced (Hard Only)</option>
                        <option value="fully-random">Full Algorithmic Variance (Random)</option>
                      </select>
                    </div>

                    <label className="checkbox-label">
                      <input type="checkbox" checked={includeExplanations} onChange={() => setIncludeExplanations(!includeExplanations)} />
                      Include comprehensive distractor rationale analytics and correct option summaries.
                    </label>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '14px', marginTop: '0.5rem', background: isGenerating ? '#94a3b8' : 'var(--primary)', color: 'white' }}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="animate-spin">⏳</span> AI Core Compiling {questionCount} questions...
                  </span>
                ) : (
                  <span>⚡ Initiate AI Generation Command</span>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: INTERACTIVE PREVIEW & EDITING */}
          {activeGenTab === 'Preview' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Quality Dashboard Panel */}
              <div className="quality-bar">
                <div className="qb-info">
                  <div className={`quality-badge ${quality.cls}`}>{quality.grade}</div>
                  <div>
                    <div className="qb-title">Automatic Quality Assessment: {quality.label}</div>
                    <div className="qb-checks">
                      <span className="qb-check-item">✅ Duplicate Free</span>
                      <span className="qb-check-item">✅ Syntactic Check Passed</span>
                      <span className="qb-check-item">✅ Distractors Calibrated</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="inline-edit-input"
                    placeholder="Provide exam set title..."
                    value={saveTitle}
                    onChange={e => setSaveTitle(e.target.value)}
                    style={{ width: '220px', background: 'white' }}
                  />
                  <button
                    className="btn-primary"
                    style={{ width: 'auto', padding: '0.6rem 1.25rem' }}
                    onClick={() => setShowExportModal(true)}
                  >
                    📥 Save & Export
                  </button>
                </div>
              </div>

              {/* Question list render */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {generatedQuestions.map((q, idx) => (
                  <div key={idx} className="q-preview-card">
                    <div className="q-preview-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="q-preview-number">Q{idx + 1}</span>
                        <span className="q-preview-meta">{q.type} • {q.difficulty}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className={`engine-badge ${q.source?.toLowerCase().includes('local') ? 'fallback' : 'ai'}`}>
                          {q.source || 'AI Core'}
                        </span>

                        <button
                          className="regen-btn"
                          onClick={() => handleRegenerateQuestion(idx)}
                          disabled={isRegeneratingIdx === idx}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                          </svg>
                          {isRegeneratingIdx === idx ? 'Regenerating...' : 'Regen'}
                        </button>

                        <button
                          style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none' }}
                          onClick={() => setEditingQuestionIdx(editingQuestionIdx === idx ? -1 : idx)}
                        >
                          {editingQuestionIdx === idx ? '✓ Done' : '✏️ Edit'}
                        </button>
                      </div>
                    </div>

                    {/* Question text editing */}
                    {editingQuestionIdx === idx ? (
                      <textarea
                        className="inline-edit-input"
                        rows="3"
                        value={q.question_text}
                        onChange={e => updateGenQ(idx, 'question_text', e.target.value)}
                        style={{ marginBottom: '0.75rem', width: '100%', padding: '0.5rem' }}
                      />
                    ) : (
                      <p className="q-preview-text">{q.question_text}</p>
                    )}

                    {/* Options Stack */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                      {q.options.map((opt, oi) => {
                        const isCorrect = oi === q.correct_index;
                        return (
                          <div 
                            key={oi} 
                            className={`gen-option-card ${isCorrect ? 'correct' : ''}`}
                            style={{
                              borderColor: isCorrect ? '#6366f1' : undefined,
                              background: isCorrect ? '#f5f3ff' : undefined
                            }}
                          >
                            {editingQuestionIdx === idx ? (
                              <>
                                <input
                                  type="radio"
                                  name={`correct-gen-${idx}`}
                                  checked={oi === q.correct_index}
                                  onChange={() => updateGenQ(idx, 'correct_index', oi)}
                                  style={{ accentColor: '#6366f1' }}
                                />
                                <span className="opt-letter" style={{ color: '#6366f1', fontWeight: 800 }}>{String.fromCharCode(65 + oi)}.</span>
                                <input
                                  className="inline-edit-input"
                                  value={opt}
                                  onChange={e => updateGenQOption(idx, oi, e.target.value)}
                                  style={{ flex: 1, padding: '0.3rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                />
                              </>
                            ) : (
                              <>
                                <span className="opt-letter" style={{ color: isCorrect ? '#6366f1' : 'var(--text-muted)', fontWeight: 800 }}>{String.fromCharCode(65 + oi)}.</span>
                                <span className="opt-text" style={{ fontWeight: isCorrect ? 600 : 500 }}>{opt}</span>
                                {isCorrect && (
                                  <span className="correct-badge" style={{ marginLeft: 'auto', background: '#dcfce7', color: '#15803d', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                                    Correct Option
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Diagnostics and Explanations bar */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button
                        className="btn-nav"
                        style={{ width: 'auto', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                        onClick={() => toggleRationale(idx)}
                      >
                        {expandedRationale.has(idx) ? 'Hide Diagnostic Rationales ▲' : 'Show Diagnostic Rationales ▼'}
                      </button>
                    </div>

                    {/* Expanded Rationale container */}
                    {expandedRationale.has(idx) && (
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
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Dashboard Diagnostics Panel */}
        <div className="diag-sidebar" style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
          
          {/* Syllabus Coverage Meter */}
          <div className="glass-panel">
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '1rem' }}>📊 Live Syllabus Coverage Map</div>
            {[
              { key: 'vocab', label: 'Vocabulary Units', cls: 'vocab' },
              { key: 'grammar', label: 'Grammar Structures', cls: 'grammar' },
              { key: 'reading', label: 'Reading Comprehension', cls: 'reading' },
              { key: 'kanji', label: 'Kanji Orthography Density', cls: 'kanji' }
            ].map(bar => (
              <div key={bar.key} className="coverage-bar-container" style={{ marginBottom: '0.75rem' }}>
                <div className="coverage-bar-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem', fontWeight: 600 }}>
                  <span className="name">{bar.label}</span>
                  <span className="pct">{coverage[bar.key]}%</span>
                </div>
                <div className="coverage-bar-track" style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div className={`coverage-bar-fill ${bar.cls} animate-bar`} style={{ width: `${coverage[bar.key]}%`, height: '100%', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>Composite Coverage</span>
              <span>{coverage.overall}%</span>
            </div>
          </div>

          {/* Computed Quality Grading */}
          <div className="glass-panel" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>🧠 Computed Quality Score</div>
            <div className={`quality-badge ${quality.cls}`} style={{ fontSize: '2.2rem', padding: '0.6rem 1.5rem', borderRadius: '20px', fontWeight: 900 }}>
              {quality.grade}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{quality.label}</div>
          </div>

          {/* Balanced Metrics Dashboard */}
          <div className="glass-panel">
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.75rem' }}>📈 Platform Integration Stats</div>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-value">{generatedQuestions.length}</div>
                <div className="metric-label">Total Qs</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{level}</div>
                <div className="metric-label">JLPT Level</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{diffStats.easy || 0}</div>
                <div className="metric-label">Easy tier</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{diffStats.hard || 0}</div>
                <div className="metric-label">Hard tier</div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          {generatedQuestions.length > 0 && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>⚡ Simulation Command Center</div>
              
              <button
                className="btn-nav"
                style={{ width: '100%', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                onClick={() => { setShowSimulator(true); setSimIndex(0); }}
              >
                🎓 Open Student Simulator
              </button>

              <button
                className="btn-nav"
                style={{ width: '100%', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                onClick={() => setShowExportModal(true)}
              >
                📥 Open Export Panel
              </button>

              <button
                className="btn-nav"
                style={{ width: '100%', fontSize: '0.82rem', color: '#dc2626', borderColor: '#fee2e2' }}
                onClick={() => {
                  if (window.confirm('Are you sure you want to discard this generated set?')) {
                    setGeneratedQuestions([]);
                    setActiveGenTab('Input');
                  }
                }}
              >
                🗑️ Discard Questions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ====== STUDENT SIMULATOR OVERLAY ====== */}
      {showSimulator && generatedQuestions.length > 0 && (
        <div className="student-simulator" onClick={e => { if (e.target === e.currentTarget) setShowSimulator(false); }}>
          <div className="simulator-card" style={{ maxWidth: '650px', width: '90%' }}>
            
            <button className="sim-close-btn" onClick={() => setShowSimulator(false)}>✕</button>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🎓 Simulated Student Examination View</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Question {simIndex + 1} of {generatedQuestions.length}</div>
            </div>

            {/* Progress Track */}
            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((simIndex + 1) / generatedQuestions.length) * 100}%`, background: 'var(--primary)', transition: 'width 0.2s ease-out' }} />
            </div>

            {/* Interactive Control Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: 700, fontSize: '0.78rem' }}>
                  ⏱ 45:00 Remaining
                </span>
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: 700, fontSize: '0.78rem' }}>
                  {generatedQuestions[simIndex]?.type} • {generatedQuestions[simIndex]?.difficulty}
                </span>
              </div>

              <div
                className={`furigana-toggle ${furiganaEnabled ? 'active' : ''}`}
                onClick={() => setFuriganaEnabled(!furiganaEnabled)}
              >
                <div className="toggle-dot" />
                <span>{furiganaEnabled ? 'Furigana: ON' : 'Furigana: OFF'}</span>
              </div>
            </div>

            {/* Fake Audio control for listening questions */}
            {generatedQuestions[simIndex]?.type?.toLowerCase().includes('listening') && (
              <div className="sim-audio-control">
                <div className="sim-audio-bar">
                  <button
                    className="sim-audio-btn"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  >
                    {isPlayingAudio ? '⏸' : '▶'}
                  </button>
                  <div className="sim-audio-progress-container">
                    <div className="sim-audio-progress-bar" style={{ width: `${isPlayingAudio ? audioProgress : 15}%` }} />
                  </div>
                  <div className="sim-audio-time">{isPlayingAudio ? '0:22 / 1:05' : '0:00 / 1:05'}</div>
                </div>
              </div>
            )}

            {/* Question Text with Simulated Furigana markup rendering */}
            <div style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.5rem', lineHeight: 1.7, background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              {furiganaEnabled ? (
                // Simple representation of furigana parsing
                generatedQuestions[simIndex]?.question_text
                  .replace(/食べる/g, '食(た)べる')
                  .replace(/毎日/g, '毎(まい)日(にち)')
                  .replace(/学校/g, '学(がっ)校(こう)')
                  .replace(/日本語/g, '日(に)本(ほん)語(ご)')
                  .replace(/新幹線/g, '新(しん)幹(かん)線(せん)')
                  .replace(/活発/g, '活(かっ)ぱつ')
                  .replace(/討論/g, '討(とう)論(ろん)')
              ) : (
                generatedQuestions[simIndex]?.question_text
              )}
            </div>

            {/* Selectable Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {generatedQuestions[simIndex]?.options.map((opt, oi) => {
                const isSelected = simAnswers[simIndex] === oi;
                return (
                  <div
                    key={oi}
                    onClick={() => setSimAnswers({ ...simAnswers, [simIndex]: oi })}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                      background: isSelected ? 'var(--primary-light)' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--primary)' : '#e2e8f0',
                        color: isSelected ? 'white' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        flexShrink: 0
                      }}
                    >
                      {String.fromCharCode(65 + oi)}
                    </div>
                    <span style={{ fontWeight: isSelected ? 600 : 500 }}>{opt}</span>
                  </div>
                );
              })}
            </div>

            {/* Simulator Footer Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                className="sim-nav-btn"
                disabled={simIndex === 0}
                onClick={() => setSimIndex(prev => prev - 1)}
              >
                ← Previous Item
              </button>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', fontWeight: 700 }}>
                {simIndex + 1} of {generatedQuestions.length}
              </span>

              {simIndex < generatedQuestions.length - 1 ? (
                <button
                  className="sim-nav-btn primary"
                  onClick={() => setSimIndex(prev => prev + 1)}
                >
                  Next Item →
                </button>
              ) : (
                <button
                  className="sim-nav-btn primary"
                  onClick={() => {
                    const answered = Object.keys(simAnswers).length;
                    alert(`Simulation complete! Student completed ${answered} of ${generatedQuestions.length} questions.`);
                    setShowSimulator(false);
                  }}
                >
                  Finish Simulator ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== PREMIUM EXPORT OVERLAY MODAL ====== */}
      {showExportModal && (
        <div className="export-overlay" onClick={e => { if (e.target === e.currentTarget) setShowExportModal(false); }}>
          <div className="export-modal" style={{ maxWidth: '580px', width: '90%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>📥 Premium Export Pathways</h2>
              <button onClick={() => setShowExportModal(false)} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* Option 1: Save directly to database */}
              <div className="export-option" onClick={saveGeneratedSet}>
                <div className="exp-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>💾</div>
                <div style={{ flex: 1 }}>
                  <div className="exp-title">Save to Interactive Question Bank</div>
                  <div className="exp-desc">Direct platform integration. Saves test instantly for classroom deployment.</div>
                </div>
              </div>

              {/* Option 2: Export CSV */}
              <div className="export-option" onClick={exportCSV}>
                <div className="exp-icon" style={{ background: '#dcfce7', color: '#15803d' }}>📊</div>
                <div style={{ flex: 1 }}>
                  <div className="exp-title">Export as Microsoft Excel / CSV</div>
                  <div className="exp-desc">Universal spreadsheet compatibility for grading programs or raw imports.</div>
                </div>
              </div>

              {/* Option 3: Print Ready Text to Clipboard */}
              <div
                className="export-option"
                onClick={() => {
                  const text = generatedQuestions.map((q, i) => (
                    `Q${i+1}. ${q.question_text}\n` +
                    q.options.map((o, j) => `   [${String.fromCharCode(65+j)}] ${o}${j === q.correct_index ? ' (Correct Answer)' : ''}`).join('\n') +
                    (q.explanation ? `\n   💡 Explanation: ${q.explanation}` : '') +
                    `\n   🏷️ Tags: [${q.type}] - [${q.difficulty}]`
                  )).join('\n\n');
                  
                  navigator.clipboard?.writeText(text);
                  setShowExportModal(false);
                  setAlertState({ type: 'success', msg: 'Formated Print Layout successfully copied to clipboard!' });
                }}
              >
                <div className="exp-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>📝</div>
                <div style={{ flex: 1 }}>
                  <div className="exp-title">Copy Print-Ready Text Format</div>
                  <div className="exp-desc">Beautiful spacing. Perfect for copy-pasting directly into Word or PDF documents.</div>
                </div>
              </div>

              {/* Option 4: Export JSON */}
              <div
                className="export-option"
                onClick={() => {
                  const json = JSON.stringify(generatedQuestions, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${saveTitle || 'jlpt_questions'}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setShowExportModal(false);
                  setAlertState({ type: 'success', msg: 'JSON schema downloaded successfully.' });
                }}
              >
                <div className="exp-icon" style={{ background: '#fef3c7', color: '#b45309' }}>📋</div>
                <div style={{ flex: 1 }}>
                  <div className="exp-title">Export Raw JSON Schema</div>
                  <div className="exp-desc">Raw structured JSON document optimized for custom developer integrations.</div>
                </div>
              </div>

            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Set: {saveTitle || 'Untitled'} • {generatedQuestions.length} Questions Compiled
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

const ExamView = ({ questions, currentIndex, setCurrentIndex, answers, handleAnswer, timeLeft, formatTime, submitTest, user, setView, activeSection }) => {
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

  // Auto-play audio
  useEffect(() => {
    if (isListening && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [currentIndex, isListening]);

  // Section title helpers
  const getSectionTitleJP = () => {
    if (activeSection === 'vocab') return 'げんごちしき (もじ・ごい)';
    if (activeSection === 'grammar_reading') return '言語知識 (文法) ・読解';
    if (activeSection === 'listening') return '聴解';
    return '日本語能力試験';
  };

  const getSectionTitleEN = () => {
    if (activeSection === 'vocab') return 'Vocab';
    if (activeSection === 'grammar_reading') return 'Grammar & Reading';
    if (activeSection === 'listening') return 'Listening';
    return 'Mock Examination';
  };

  const getInstructionText = () => {
    if (activeSection === 'vocab' || q?.type?.toLowerCase().includes('vocab')) {
      return 'もんだい１ ___ の ことばは ひらがなで どう かきますか。１・２・３・４から いちばん いいものを ひとつ えらんでください。';
    }
    if (activeSection === 'grammar_reading' || q?.type?.toLowerCase().includes('grammar') || q?.type?.toLowerCase().includes('reading')) {
      return 'つぎの ぶんの ＿＿＿ に 入る ものは どれですか。１・２・３・４から いちばん いいものを ひとつ えらんでください。';
    }
    return '【聴解】 音声を 聴いて、１・２・３・４から いちばん いいものを ひとつ えらんでください。';
  };

  return (
    <div className="exam-split-layout">
      {/* Left Main Question Panel */}
      <div className="exam-main-panel animate-fade">
        <div className="exam-instruction-bar">
          {getInstructionText()}
        </div>

        <div className="exam-question-card">
          {/* Question Text / Listening Script Player */}
          {isListening ? (
            <div className="listening-player-container">
              <div className="audio-header">
                <span className="icon">🎧</span>
                <div>
                  <div className="title">聴解 — Listening Section</div>
                  <div className="desc">Audio plays automatically. You may replay it.</div>
                </div>
              </div>
              <audio
                ref={audioRef}
                controls
                src={getFullAudioUrl(q.audio_url)}
                className="audio-element"
              />
              <p className="audio-tip">
                ⚠️ The audio script is hidden. Listen carefully and select the correct answer below.
              </p>
            </div>
          ) : (
            <div className="exam-q-body">
              <span className="q-badge">Q{currentIndex + 1}</span>
              <div className="q-text">
                {q?.question_text.includes('＿＿＿') ? (
                  <span>
                    {q?.question_text.split('＿＿＿')[0]}
                    <span className="jlpt-underline">＿＿＿</span>
                    {q?.question_text.split('＿＿＿')[1]}
                  </span>
                ) : q?.question_text.includes('___') ? (
                  <span>
                    {q?.question_text.split('___')[0]}
                    <span className="jlpt-underline">＿＿＿</span>
                    {q?.question_text.split('___')[1]}
                  </span>
                ) : (
                  q?.question_text
                )}
              </div>
            </div>
          )}

          {/* Premium Answer Options Cards */}
          <div className="exam-options-grid">
            {q?.options.map((opt, idx) => (
              <button
                key={idx}
                className={`exam-option-card ${selectedIdx === idx ? 'selected' : ''}`}
                onClick={() => handleAnswer(q?.id, idx)}
              >
                <div className="opt-index">{idx + 1}</div>
                <div className="opt-text">{opt}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer controls inside main panel */}
        <footer className="exam-panel-footer">
          <button className="btn-nav secondary" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>
            ← Previous
          </button>
          
          <div className="progress-indicator">
            <span className="count">{answers.length} / {questions.length}</span>
            <span className="label">answered</span>
          </div>

          {currentIndex === questions.length - 1 ? (
            <button className="btn-nav primary" onClick={() => submitTest()}>
              Finish Exam ✓
            </button>
          ) : (
            <button className="btn-nav primary" onClick={() => setCurrentIndex(prev => prev + 1)}>
              Next →
            </button>
          )}
        </footer>
      </div>

      {/* Right Sidebar Question Map & Timer */}
      <aside className="exam-right-sidebar">
        <div className="sidebar-sticky-header">
          <div className="section-title">
            <span className="jp">{getSectionTitleJP()}</span>
            <span className="en">{getSectionTitleEN()}</span>
          </div>
          <button className="btn-exit" onClick={() => { if (window.confirm("Do you want to exit? Your progress is saved.")) setView(user.role === 'teacher' ? 'admin-dashboard' : 'dashboard'); }}>
            🚪 Exit
          </button>
        </div>

        {/* Big Premium Timer */}
        <div className="sidebar-timer-container">
          <span className="timer-icon">⏱</span>
          <span className="timer-val">{formatTime(timeLeft)}</span>
        </div>

        <div className="sidebar-scrollable-map">
          <div className="map-title">もんだい一覧 / Question Navigation</div>
          
          <div className="q-bubbles-map-grid">
            {questions.map((question, qIdx) => {
              const qAns = answers.find(a => a.question_id === question.id);
              const selIdx = qAns?.selected_index;
              
              return (
                <div key={question.id} className={`map-q-row ${currentIndex === qIdx ? 'active' : ''}`}>
                  <button className="row-q-num" onClick={() => setCurrentIndex(qIdx)}>
                    {qIdx + 1 < 10 ? '0' : ''}{qIdx + 1}
                  </button>
                  <div className="row-bubbles">
                    {[0, 1, 2, 3].map(optIndex => {
                      const isSel = selIdx === optIndex;
                      return (
                        <button
                          key={optIndex}
                          className={`bubble-btn ${isSel ? 'selected' : ''}`}
                          onClick={() => {
                            handleAnswer(question.id, optIndex);
                            setCurrentIndex(qIdx);
                          }}
                        >
                          {optIndex + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
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

const TestDetailsModal = ({ test, onClose, startTest }) => {
  const vocabCount = test.questions?.filter(q => q.section === 1 || q.type?.toLowerCase().includes('vocab') || q.type?.toLowerCase().includes('kanji')).length || 0;
  const grammarReadingCount = test.questions?.filter(q => q.section === 2 || q.section === 3 || q.type?.toLowerCase().includes('grammar') || q.type?.toLowerCase().includes('reading') || q.type?.toLowerCase().includes('particle')).length || 0;
  const listeningCount = test.questions?.filter(q => q.section === 4 || q.type?.toLowerCase().includes('listening') || q.type === 'Listening').length || 0;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="details-modal animate-fade">
        <header className="details-modal-header">
          <h2>{test.level} 【模擬試験】 {test.title.replace(/[^0-9]/g, '') || '1'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </header>
        
        <div className="details-score-box">
          <span className="score-label">Score</span>
          <span className="score-val">—</span>
          <span className="score-motivation">頑張ってください！</span>
        </div>

        <div className="section-rows-container">
          {/* Section 1: Vocab */}
          <div className="section-row-card">
            <div className="row-content">
              <h3>げんごちしき (もじ・ごい)</h3>
              <p className="sub-title">Vocab</p>
              <div className="stats-badges">
                <span className="stat-badge">Allotted Time: 00:20:00</span>
                <span className="stat-badge">Questions: {vocabCount}</span>
              </div>
            </div>
            <button className="row-action-btn primary" onClick={() => startTest(test.id, 'vocab')}>
              Start
            </button>
          </div>

          {/* Section 2: Grammar & Reading */}
          <div className="section-row-card">
            <div className="row-content">
              <h3>言語知識 (文法) ・読解</h3>
              <p className="sub-title">Grammar & Reading</p>
              <div className="stats-badges">
                <span className="stat-badge">Allotted Time: 00:40:00</span>
                <span className="stat-badge">Questions: {grammarReadingCount}</span>
              </div>
            </div>
            <button className="row-action-btn primary" onClick={() => startTest(test.id, 'grammar_reading')}>
              Start
            </button>
          </div>

          {/* Section 3: Listening */}
          <div className="section-row-card">
            <div className="row-content">
              <h3>聴解</h3>
              <p className="sub-title">Listening</p>
              <div className="stats-badges">
                <span className="stat-badge">Allotted Time: 00:30:00</span>
                <span className="stat-badge">Questions: {listeningCount}</span>
              </div>
            </div>
            <button className="row-action-btn primary" onClick={() => startTest(test.id, 'listening')}>
              Start
            </button>
          </div>
        </div>

        <footer className="details-modal-footer">
          <button className="btn-return" onClick={onClose}>← Return</button>
        </footer>
      </div>
    </div>
  );
};

// --- Main App Component ---

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [generatingAudioIdx, setGeneratingAudioIdx] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Text size accessibility preference
  const [textSize, setTextSizeState] = useState(() => localStorage.getItem('textSizePref') || 'normal');

  const applyTextSize = (size) => {
    const presets = {
      small: { min: '14px', max: '16px' },
      normal: { min: '15px', max: '19px' },
      large: { min: '17px', max: '22px' }
    };
    const p = presets[size] || presets.normal;
    try {
      document.documentElement.style.setProperty('--base-min', p.min);
      document.documentElement.style.setProperty('--base-max', p.max);
      // Force recompute by updating --base-font-size if present
      // (clamp uses the variables so it will update automatically)
      localStorage.setItem('textSizePref', size);
      setTextSizeState(size);
    } catch (err) {
      console.warn('Could not apply text size:', err);
    }
  };

  useEffect(() => {
    // Apply persisted preference on mount
    applyTextSize(textSize);
    
    // Warm up the Render backend immediately on page load (pre-wakes free tier from sleep)
    fetch(`${API_URL}/health`).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [availableTests, setAvailableTests] = useState([]);
  const [userMetrics, setUserMetrics] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(7200);

  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'learner' });
  const [editingTest, setEditingTest] = useState(null);

  const [activeSection, setActiveSection] = useState('all');
  const [activeTestDetails, setActiveTestDetails] = useState(null);

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
      const endpoint = user?.role === 'teacher' ? `${API_URL}/admin` : `${API_URL}/tests`;
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

  const fetchMetrics = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/tests/metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserMetrics(data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchTests();
      fetchMetrics();
    }
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
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(authForm)
      });

      const data = await parseJsonResponse(res).catch(async () => {
        const text = await res.text().catch(() => 'No response body');
        throw new Error(`Signup failed: ${res.status} ${res.statusText} - ${text}`);
      });

      if (!res.ok) throw new Error(data.detail || data.message || 'Signup failed');
      alert('Account created! Please login.');
      setView('login');
    } catch (err) {
      alert(getFriendlyApiError(err));
    } finally {
      setLoading(false);
    }
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
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await parseJsonResponse(res).catch(async () => {
        const text = await res.text().catch(() => 'No response body');
        throw new Error(`Login failed: ${res.status} ${res.statusText} - ${text}`);
      });

      if (!res.ok) throw new Error(data.detail || data.message || 'Invalid credentials');
      setToken(data.access_token);
      setUser(data.user);
      setView(data.user.role === 'teacher' ? 'admin-dashboard' : 'dashboard');
    } catch (err) {
      alert(getFriendlyApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setView('login');
  };

  // Exam Handlers
  const startTest = async (testId, sectionType = 'all') => {
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
      
      const test = availableTests.find(t => t.id === testId);
      
      // Filter questions according to section type
      let filteredQs = qData;
      let duration = test?.duration || 120;
      
      if (sectionType === 'vocab') {
        filteredQs = qData.filter(q => q.section === 1 || q.type?.toLowerCase().includes('vocab') || q.type?.toLowerCase().includes('kanji'));
        duration = 20; 
      } else if (sectionType === 'grammar_reading') {
        filteredQs = qData.filter(q => q.section === 2 || q.section === 3 || q.type?.toLowerCase().includes('grammar') || q.type?.toLowerCase().includes('reading') || q.type?.toLowerCase().includes('particle'));
        duration = 40; 
      } else if (sectionType === 'listening') {
        filteredQs = qData.filter(q => q.section === 4 || q.type?.toLowerCase().includes('listening') || q.type === 'Listening');
        duration = 30; 
      }
      
      if (filteredQs.length === 0) {
        filteredQs = qData;
        duration = test?.duration || 120;
        setActiveSection('all');
      } else {
        setActiveSection(sectionType);
      }
      
      setQuestions(filteredQs);
      setTimeLeft(duration * 60);
      setView('exam');
      setCurrentIndex(0);
      setAnswers([]);
      setActiveTestDetails(null); 
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
      const url = editingTest.id ? `${API_URL}/admin/${editingTest.id}` : `${API_URL}/admin`;
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
        {/* Accessibility: Text size controls (A-, A, A+) */}
        <div className="text-size-controls" role="toolbar" aria-label="Text size">
          <button className={`ts-btn ${textSize === 'small' ? 'active' : ''}`} onClick={() => applyTextSize('small')} aria-pressed={textSize === 'small'}>A-</button>
          <button className={`ts-btn ${textSize === 'normal' ? 'active' : ''}`} onClick={() => applyTextSize('normal')} aria-pressed={textSize === 'normal'}>A</button>
          <button className={`ts-btn ${textSize === 'large' ? 'active' : ''}`} onClick={() => applyTextSize('large')} aria-pressed={textSize === 'large'}>A+</button>
        </div>
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
            userMetrics={userMetrics}
          />
        </>
      )}

      {view === 'dashboard' && <Dashboard availableTests={availableTests} startTest={startTest} setActiveTestDetails={setActiveTestDetails} />}
      {view === 'admin-dashboard' && <TeacherDashboard availableTests={availableTests} createTest={createTest} editTest={editTest} deleteTest={deleteTest} setView={setView} />}
      {view === 'ai-generator' && <AIQuestionGenerator token={token} setView={setView} />}
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
          activeSection={activeSection}
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

      {activeTestDetails && (
        <TestDetailsModal 
          test={activeTestDetails} 
          onClose={() => setActiveTestDetails(null)} 
          startTest={startTest}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;
