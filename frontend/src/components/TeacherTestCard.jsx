import React from 'react';

const TeacherTestCard = ({ test, onEdit, onDelete }) => (
  <div className="teacher-test-card">
    <div className="test-card-top">
      <span className="test-card-level">{test.level}</span>
      <span className="test-card-duration">{test.duration} min</span>
    </div>
    <h2 className="test-card-title">{test.title}</h2>
    <div className="test-card-meta">
      <span>🙋 {test.questions?.length || 0} items</span>
      <span>🎧 {test.questions?.filter(q => q.type?.toLowerCase().includes('listening')).length || 0} listening</span>
    </div>
    <div className="test-card-actions">
      <button className="btn-nav" onClick={onEdit}>Edit</button>
      <button className="btn-nav btn-danger" onClick={onDelete}>Delete</button>
    </div>
  </div>
);

export default TeacherTestCard;
