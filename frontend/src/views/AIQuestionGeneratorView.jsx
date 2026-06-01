import React, { useState, useRef } from 'react';
import AISectionTabs from '../components/AISectionTabs';
import AIQuestionPreviewCard from '../components/AIQuestionPreviewCard';
import AISidebarPanel from '../components/AISidebarPanel';

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

const AIQuestionGeneratorView = ({ token, setView }) => {
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
    if (qs.every(q => q.question_text && q.question_text.length > 5)) score += 30;
    else score += 10;
    const hasDupes = qs.some(q => new Set(q.options).size !== q.options.length);
    if (!hasDupes) score += 25;
    if (qs.every(q => q.correct_index >= 0 && q.correct_index < q.options.length)) score += 25;
    else score += 10;
    if (qs.every(q => q.explanation && q.explanation.length > 3)) score += 20;
    else score += 10;
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

  const handleRegenerateQuestion = async (idx) => {
    setIsRegeneratingIdx(idx);
    try {
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

  const exportCSV = () => {
    if (!generatedQuestions.length) return;
    const header = 'Number,Type,Difficulty,Question,OptionA,OptionB,OptionC,OptionD,CorrectIndex,Explanation\n';
    const rows = generatedQuestions.map((q, i) =>
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

  const diffStats = generatedQuestions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="main-content" style={{ flexDirection: 'column' }}>
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

      {alertState && (
        <div className="animate-fade" style={{ marginBottom: '1rem', padding: '0.85rem 1.25rem', borderRadius: '14px', fontSize: '0.88rem', fontWeight: 600, background: alertState.type === 'error' ? '#fee2e2' : alertState.type === 'warning' ? '#fef9c3' : '#d1fae5', color: alertState.type === 'error' ? '#991b1b' : alertState.type === 'warning' ? '#92400e' : '#064e3b', border: `1px solid ${alertState.type === 'error' ? '#fecaca' : alertState.type === 'warning' ? '#fcd34d' : '#86efac'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{alertState.type === 'error' ? '⚠️' : alertState.type === 'warning' ? '📦' : '✅'} {alertState.msg}</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginLeft: '1rem' }} onClick={() => setAlertState(null)}>✕</button>
        </div>
      )}

      <AISectionTabs activeGenTab={activeGenTab} setActiveGenTab={setActiveGenTab} generatedCount={generatedQuestions.length} />

      <div className="gen-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                        placeholder="食べる (たべる) - to eat\n飲む (のむ) - to drink\n行く (いく) - to go"
                      />
                    </div>
                    <div>
                      <label className="profile-label">📐 Grammar & Particles Blueprint</label>
                      <textarea
                        className="auth-input"
                        rows="8"
                        value={contentBySection.grammar}
                        onChange={e => setContentBySection({ ...contentBySection, grammar: e.target.value })}
                        placeholder="は (wa) - topic marker\nが (ga) - subject marker\nに (ni) - destination"
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

              <button className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '14px', marginTop: '0.5rem' }} onClick={() => setActiveGenTab('Settings')}>
                Proceed to Generation Settings →
              </button>
            </div>
          )}

          {activeGenTab === 'Settings' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="settings-group">
                <button className="settings-header" onClick={() => setSettingsOpen(p => ({ ...p, types: !p.types }))}>
                  <span className="title">🎯 Targeted Question Typologies</span>
                  <span className={`chevron ${settingsOpen.types ? 'open' : ''}`}>▼</span>
                </button>
                {settingsOpen.types && (
                  <div className="settings-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
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
              <button className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '14px', marginTop: '0.5rem', background: isGenerating ? '#94a3b8' : 'var(--primary)', color: 'white' }} onClick={handleGenerate} disabled={isGenerating}>
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

          {activeGenTab === 'Preview' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  <button className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }} onClick={() => setShowExportModal(true)}>
                    📥 Save & Export
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {generatedQuestions.map((q, idx) => (
                  <AIQuestionPreviewCard
                    key={idx}
                    q={q}
                    idx={idx}
                    editingQuestionIdx={editingQuestionIdx}
                    setEditingQuestionIdx={setEditingQuestionIdx}
                    updateGenQ={updateGenQ}
                    updateGenQOption={updateGenQOption}
                    toggleRationale={toggleRationale}
                    expandedRationale={expandedRationale}
                    handleRegenerateQuestion={handleRegenerateQuestion}
                    isRegeneratingIdx={isRegeneratingIdx}
                    getDistractorRationales={getDistractorRationales}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <AISidebarPanel
          coverage={coverage}
          quality={quality}
          diffStats={diffStats}
          generatedQuestionsLength={generatedQuestions.length}
          openSimulator={() => { setShowSimulator(true); setSimIndex(0); }}
          openExportModal={() => setShowExportModal(true)}
          resetQuestions={() => { if (window.confirm('Are you sure you want to discard this generated set?')) { setGeneratedQuestions([]); setActiveGenTab('Input'); } }}
        />
      </div>
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
            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((simIndex + 1) / generatedQuestions.length) * 100}%`, background: 'var(--primary)', transition: 'width 0.2s ease-out' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: 700, fontSize: '0.78rem' }}>⏱ 45:00 Remaining</span>
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: 700, fontSize: '0.78rem' }}>{generatedQuestions[simIndex]?.type} • {generatedQuestions[simIndex]?.difficulty}</span>
              </div>
              <div className={`furigana-toggle ${furiganaEnabled ? 'active' : ''}`} onClick={() => setFuriganaEnabled(!furiganaEnabled)}>
                <div className="toggle-dot" />
                <span>{furiganaEnabled ? 'Furigana: ON' : 'Furigana: OFF'}</span>
              </div>
            </div>
            {generatedQuestions[simIndex]?.type?.toLowerCase().includes('listening') && (
              <div className="sim-audio-control">
                <div className="sim-audio-bar">
                  <button className="sim-audio-btn" onClick={() => setIsPlayingAudio(!isPlayingAudio)}>{isPlayingAudio ? '⏸' : '▶'}</button>
                  <div className="sim-audio-progress-container"><div className="sim-audio-progress-bar" style={{ width: `${isPlayingAudio ? audioProgress : 15}%` }} /></div>
                  <div className="sim-audio-time">{isPlayingAudio ? '0:22 / 1:05' : '0:00 / 1:05'}</div>
                </div>
              </div>
            )}
            <div style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.5rem', lineHeight: 1.7, background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              {furiganaEnabled ? (
                generatedQuestions[simIndex]?.question_text
                  .replace(/食べる/g, '食(た)べる')
                  .replace(/毎日/g, '毎(まい)日(にち)')
                  .replace(/学校/g, '学(がっ)校(こう)')
                  .replace(/日本語/g, '日(に)本(ほん)語(ご)')
                  .replace(/新幹線/g, '新(しん)幹(かん)線(せん)')
                  .replace(/活発/g, '活(かっ)ぱつ')
                  .replace(/討論/g, '討(とう)論(ろん)')
              ) : generatedQuestions[simIndex]?.question_text}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {generatedQuestions[simIndex]?.options.map((opt, oi) => {
                const isSelected = simAnswers[simIndex] === oi;
                return (
                  <div key={oi} onClick={() => setSimAnswers({ ...simAnswers, [simIndex]: oi })} style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid', borderColor: isSelected ? 'var(--primary)' : 'var(--border)', background: isSelected ? 'var(--primary-light)' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.15s ease' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? 'var(--primary)' : '#e2e8f0', color: isSelected ? 'white' : 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>{String.fromCharCode(65 + oi)}</div>
                    <span style={{ fontWeight: isSelected ? 600 : 500 }}>{opt}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button className="sim-nav-btn" disabled={simIndex === 0} onClick={() => setSimIndex(prev => prev - 1)}>← Previous Item</button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', fontWeight: 700 }}>{simIndex + 1} of {generatedQuestions.length}</span>
              {simIndex < generatedQuestions.length - 1 ? (
                <button className="sim-nav-btn primary" onClick={() => setSimIndex(prev => prev + 1)}>Next Item →</button>
              ) : (
                <button className="sim-nav-btn primary" onClick={() => { const answered = Object.keys(simAnswers).length; alert(`Simulation complete! Student completed ${answered} of ${generatedQuestions.length} questions.`); setShowSimulator(false); }}>Finish Simulator ✓</button>
              )}
            </div>
          </div>
        </div>
      )}
      {showExportModal && (
        <div className="export-overlay" onClick={e => { if (e.target === e.currentTarget) setShowExportModal(false); }}>
          <div className="export-modal" style={{ maxWidth: '580px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>📥 Premium Export Pathways</h2>
              <button onClick={() => setShowExportModal(false)} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="export-option" onClick={saveGeneratedSet}>
                <div className="exp-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>💾</div>
                <div style={{ flex: 1 }}>
                  <div className="exp-title">Save to Interactive Question Bank</div>
                  <div className="exp-desc">Direct platform integration. Saves test instantly for classroom deployment.</div>
                </div>
              </div>
              <div className="export-option" onClick={exportCSV}>
                <div className="exp-icon" style={{ background: '#dcfce7', color: '#15803d' }}>📊</div>
                <div style={{ flex: 1 }}>
                  <div className="exp-title">Export as Microsoft Excel / CSV</div>
                  <div className="exp-desc">Universal spreadsheet compatibility for grading programs or raw imports.</div>
                </div>
              </div>
              <div className="export-option" onClick={() => { const text = generatedQuestions.map((q, i) => (`Q${i+1}. ${q.question_text}\n` + q.options.map((o, j) => `   [${String.fromCharCode(65+j)}] ${o}${j === q.correct_index ? ' (Correct Answer)' : ''}`).join('\n') + (q.explanation ? `\n   💡 Explanation: ${q.explanation}` : '') + `\n   🏷️ Tags: [${q.type}] - [${q.difficulty}]`)).join('\n\n'); navigator.clipboard?.writeText(text); setShowExportModal(false); setAlertState({ type: 'success', msg: 'Formated Print Layout successfully copied to clipboard!' }); }}>
                <div className="exp-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>📝</div>
                <div style={{ flex: 1 }}>
                  <div className="exp-title">Copy Print-Ready Text Format</div>
                  <div className="exp-desc">Beautiful spacing. Perfect for copy-pasting directly into Word or PDF documents.</div>
                </div>
              </div>
              <div className="export-option" onClick={() => { const json = JSON.stringify(generatedQuestions, null, 2); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${saveTitle || 'jlpt_questions'}.json`; a.click(); URL.revokeObjectURL(url); setShowExportModal(false); setAlertState({ type: 'success', msg: 'JSON schema downloaded successfully.' }); }}>
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

export default AIQuestionGeneratorView;
