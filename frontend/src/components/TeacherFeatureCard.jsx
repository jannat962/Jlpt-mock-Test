import React from 'react';

const TeacherFeatureCard = ({ title, description, buttonText, onClick }) => (
  <div className="teacher-feature-card">
    <div className="feature-header">{title}</div>
    <p>{description}</p>
    <button className="btn-nav" onClick={onClick}>{buttonText}</button>
  </div>
);

export default TeacherFeatureCard;
