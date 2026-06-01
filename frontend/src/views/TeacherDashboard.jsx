import React from 'react';
import TeacherHeroCard from '../components/TeacherHeroCard';
import TeacherFeatureCard from '../components/TeacherFeatureCard';
import TeacherTestCard from '../components/TeacherTestCard';
import TeacherPanel from '../components/TeacherPanel';
import AudioHighlightCard from '../components/AudioHighlightCard';

const TeacherDashboard = ({ availableTests, createTest, editTest, deleteTest, setView }) => {
  const totalQuestions = availableTests.reduce((sum, item) => sum + (item.questions?.length || 0), 0);
  const totalListening = availableTests.reduce((sum, item) => sum + (item.questions?.filter(q => q.type?.toLowerCase().includes('listening')).length || 0), 0);
  const testCount = availableTests.length;

  return (
    <div className="main-content teacher-dashboard">
      <div className="content-left">
        <TeacherHeroCard onLaunchAI={() => setView('ai-generator')} onNewExam={createTest} />

        <div className="audio-gen-highlights">
          <AudioHighlightCard
            title="🎧 Audio Generator Ready"
            description="Generate listening audio for your saved questions and preview native Japanese pronunciation before publishing."
            pillText="Audio generation available in Test Editor per listening item"
          />
        </div>

        <div className="teacher-feature-grid">
          <TeacherFeatureCard
            title="🤖 AI Question Generator"
            description="Design fully JLPT-aligned questions from syllabus inputs, grammar patterns, and vocabulary tokens."
            buttonText="Open AI Lab"
            onClick={() => setView('ai-generator')}
          />
          <TeacherFeatureCard
            title="🎧 Audio Generation Studio"
            description="Generate listening audio for saved questions and preview native Japanese pronunciation."
            buttonText="Open Audio Studio"
            onClick={createTest}
          />
          <TeacherFeatureCard
            title="📦 Saved Exams"
            description={`Manage ${testCount} saved mock exams with ${totalQuestions} questions, including ${totalListening} listening prompts.`}
            buttonText="View Sets"
            onClick={() => document.getElementById('saved-tests')?.scrollIntoView({ behavior: 'smooth' })}
          />
        </div>

        <section className="admin-tests-list" id="saved-tests">
          <div className="section-subtitle">Recent Exam Sets</div>
          <div className="mock-test-grid teacher-test-grid">
            {availableTests.map(test => (
              <TeacherTestCard
                key={test.id}
                test={test}
                onEdit={() => editTest(test)}
                onDelete={() => deleteTest(test.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <aside className="content-right teacher-quick-panel glass-panel">
        <TeacherPanel title="Welcome, Sensei">
          <p>This workspace is optimized for JLPT preparation with polished cards, fast AI workflows, and a calm premium Japanese design language.</p>
        </TeacherPanel>
        <TeacherPanel title="Workflow Highlights">
          <ul className="panel-list">
            <li>Generate questions with targeted JLPT difficulty</li>
            <li>Export to CSV, JSON, or classroom-ready print format</li>
            <li>Generate listening audio for student drills</li>
          </ul>
        </TeacherPanel>
        <TeacherPanel title="Design Notes">
          <p>Use the AI Generator for new sets, then fine-tune listening questions in the Test Editor for full audio support.</p>
        </TeacherPanel>
      </aside>
    </div>
  );
};

export default TeacherDashboard;
