import React from 'react';

const TeacherPanel = ({ title, children }) => (
  <div className="teacher-panel-block">
    <div className="panel-title">{title}</div>
    {children}
  </div>
);

export default TeacherPanel;
