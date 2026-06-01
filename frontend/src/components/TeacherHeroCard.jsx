import React from 'react';

const TeacherHeroCard = ({ onLaunchAI, onNewExam }) => (
  <section className="teacher-hero-card">
    <div>
      <span className="section-label">Teacher Studio</span>
      <h1>AI Question Lab & Audio Studio</h1>
      <p className="hero-copy">Create premium JLPT practice content with smart AI generation, native audio output, and an elegant Japanese-inspired production workflow.</p>
    </div>
    <div className="teacher-hero-actions">
      <button className="btn-primary" onClick={onLaunchAI}>Launch AI Generator</button>
      <button className="btn-secondary" onClick={onNewExam}>Start New Exam</button>
    </div>
  </section>
);

export default TeacherHeroCard;
