import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';
// In development, Vite proxy or explicit URL handles this. 
// In production on Vercel, the /api prefix is rewritten to Render.

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'exam', 'result'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7200); // Default to 120 minutes in seconds

  // Wake up the backend on load
  useEffect(() => {
    const pingBackend = async () => {
      try {
        await fetch(`${API_URL.replace('/api', '')}/health`);
        console.log("Backend is awake!");
      } catch (e) {
        console.warn("Backend is still waking up...");
      }
    };
    pingBackend();
  }, []);

  // Timer logic
  useEffect(() => {
    let timer;
    if (view === 'exam' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
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


  // Start the test
  const startTest = async (testId) => {
    setLoading(true);
    try {
      // 1. Create a session (User ID 1 is placeholder)
      const sessionRes = await fetch(`${API_URL}/tests/start/${testId}?user_id=1`, { method: 'POST' });
      if (!sessionRes.ok) {
        const errorData = await sessionRes.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to start session. Is the backend running and user seeded?");
      }
      const sessionData = await sessionRes.json();
      setSession(sessionData);

      // 2. Get questions for Test
      const questionsRes = await fetch(`${API_URL}/tests/${testId}/questions`);
      if (!questionsRes.ok) {
        const errorData = await questionsRes.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to load questions.");
      }
      const questionsData = await questionsRes.json();
      setQuestions(questionsData);
      setTimeLeft(7200); // 120 minutes for the full test
      setView('exam');

    } catch (error) {
      console.error("Failed to start test:", error);
      alert(`Connection Error: ${error.message}\n\nPlease ensure the backend at ${API_URL} is reachable.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, selectedIndex) => {
    const newAnswers = [...answers];
    const existingIndex = newAnswers.findIndex(a => a.question_id === questionId);

    if (existingIndex > -1) {
      newAnswers[existingIndex] = { ...newAnswers[existingIndex], selected_index: selectedIndex };
    } else {
      newAnswers.push({ question_id: questionId, selected_index: selectedIndex });
    }
    setAnswers(newAnswers);
  };

  const submitTest = async (isAutoSubmitting = false) => {
    if (loading) return;

    // Only ask for confirmation if manually submitting
    if (!isAutoSubmitting) {
      const confirmSubmit = window.confirm("Are you sure you want to submit your exam now?");
      if (!confirmSubmit) return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tests/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          answers: answers
        })
      });
      const data = await res.json();
      setResult(data);
      setView('result');
    } catch (error) {
      console.error("Failed to submit test:", error);
      alert("Submission failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const [examineeNumber, setExamineeNumber] = useState('');
  const [examineeName, setExamineeName] = useState('');

  if (view === 'landing') {
    const mockTests = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="japanese-vibe">日本語能力試験</div> <br />
          <h1 className="dashboard-title">JLPT-Platform</h1>
          <p className="dashboard-subtitle"></p>
        </header>

        <main className="dashboard-grid">
          {mockTests.map((testId) => (
            <div key={testId} className="mock-test-card glass-panel" onClick={() => startTest(testId)}>
              <div className="card-icon">📄</div>
              <h2>Mock-Test{testId}</h2>
              <div className="card-details">
                <span className="badge">N4 Level</span>
                <span className="badge">120 Mins</span>
              </div>
              <div className="card-sections">
                <div className="section-item"><span>1.</span> Kanji & Vocabulary</div>
                <div className="section-item"><span>2.</span> Grammar & Reading</div>
                <div className="section-item"><span>3.</span> Listening</div>
              </div>
              <button className="card-start-btn" disabled={loading}>
                {loading ? 'Loading...' : 'Start Test'}
              </button>
            </div>
          ))}
        </main>
      </div>
    );
  }

  if (view === 'exam') {
    const question = questions[currentIndex];
    const currentAnswer = answers.find(a => a.question_id === question.id);//
    // Helper to get section name dynamically
    const getSectionName = (sectionId) => {
      const sections = {
        0: "Section 1: Kanji & Vocabulary",
        1: "Section 2: Grammar & Reading",
        2: "Section 3: Listening"
      };
      return sections[sectionId] || `Section ${sectionId + 1}`;
    };

    return (
      <div className="exam-container glass-panel">
        <div className="exam-header">
          <div className="section-title" style={{ fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
            {getSectionName(question.section)}
          </div>
          <div className="progress-info">
            <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
            </div>
          </div>

          <div className={`timer-display ${timeLeft < 60 ? 'timer-urgent' : ''}`}>
            <span className="timer-icon">⏱️</span>
            <span className="timer-text">{formatTime(timeLeft)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button className="submit-early-btn" onClick={submitTest}>Final Submit</button>
            <button className="quit-btn" onClick={() => {
              if (window.confirm('Quit the test? Your progress will be lost.')) {
                setView('landing');
                setQuestions([]);
                setAnswers([]);
                setSession(null);
                setCurrentIndex(0);
                setTimeLeft(0);
              }
            }}>✕ Quit</button>
          </div>

        </div>

        <main className="question-area">
          <div className="mondai-label">{question.type}</div>

          {question.audio_url && (
            <div className="audio-section">
              <p>🔊 Listening Focus: Click play to hear the question.</p>
              <audio controls src={question.audio_url} className="custom-audio">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          <div className="question-content">
            <h2 className="question-text">
              {question.question_text.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </h2>

            {question.image_url && !question.image_url.startsWith('{') && (
              <div className="question-image">
                <img src={question.image_url} alt="Question context" />
              </div>
            )}

            <div className="options-grid">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  className={`option-card ${currentAnswer?.selected_index === idx ? 'selected' : ''}`}
                  onClick={() => handleAnswer(question.id, idx)}
                >
                  <span className="option-num">{idx + 1}</span>
                  <span className="option-val">{option}</span>
                </button>
              ))}
            </div>
          </div>
        </main>

        <footer className="nav-footer">
          <button onClick={prevQuestion} disabled={currentIndex === 0}>Previous</button>
          {currentIndex === questions.length - 1 ? (
            <button className="submit-btn" onClick={submitTest} disabled={loading}>
              {loading ? 'Submitting...' : 'Finish & See Results'}
            </button>
          ) : (
            <button onClick={nextQuestion}>Next Question</button>
          )}
        </footer>
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div className="result-container">
        <div className="result-card glass-panel">
          <div className="result-icon">🎯</div>
          <h1>Test Completed!</h1>
          <div className="score-display">
            <div className="score-main">{result.score_percentage}%</div>
            <div className="score-sub">{result.correct_answers} Correct / {result.total_questions} Total</div>
          </div>

          <div className="grade-box">
            {result.score_percentage >= 60 ? (
              <p className="pass">合格 (PASS!)</p>
            ) : (
              <p className="fail">不合格 (Keep studying!)</p>
            )}
          </div>

          <div className="section-analysis">
            <h3>Detailed Analysis</h3>
            {result.section_scores && Object.values(result.section_scores).map((section, idx) => (
              <div key={idx} className="section-result-item">
                <div className="section-name">{section.name}</div>
                <div className="section-bar-container">
                  <div
                    className="section-bar-fill"
                    style={{
                      width: `${section.total > 0 ? (section.correct / section.total) * 100 : 0}%`,
                      backgroundColor: (section.total > 0 && (section.correct / section.total) >= 0.6) ? '#10b981' : '#ef4444'
                    }}
                  ></div>
                </div>
                <div className="section-numbers">
                  {section.correct} / {section.total}
                </div>
              </div>
            ))}
          </div>

          <button className="restart-btn" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
