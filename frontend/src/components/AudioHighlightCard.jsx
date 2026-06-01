import React from 'react';

const AudioHighlightCard = ({ title, description, pillText }) => (
  <div className="audio-highlights-card">
    <div className="feature-header">{title}</div>
    <p>{description}</p>
    <div className="audio-highlight-pill">{pillText}</div>
  </div>
);

export default AudioHighlightCard;
