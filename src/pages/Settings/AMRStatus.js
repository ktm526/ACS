// AMRStatus.js

import React, { useState } from 'react';
import './AMRStatus.css';

const AMRStatus = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [emergency, setEmergency] = useState(false);
  const [liftLimit, setLiftLimit] = useState(false);
  const [bumperLimit, setBumperLimit] = useState(false);

  const toggleEmergency = () => setEmergency(!emergency);
  const toggleLiftLimit = () => setLiftLimit(!liftLimit);
  const toggleBumperLimit = () => setBumperLimit(!bumperLimit);

  return (
    <div className="amr-status">
      <div className="status-header">AMR 상태</div>
      <div className="status-content">
        <div className="status-row">
          <div className="status-item">
            <span className="status-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
            </span>
            <div className="status-box">X: {position.x}, Y: {position.y}</div>
          </div>
          <div className="status-item" onClick={toggleEmergency}>
            <span className="status-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 20h20L12 2z" stroke={emergency ? "red" : "white"} strokeWidth="2" />
                <path d="M12 9v4" stroke={emergency ? "red" : "white"} strokeWidth="2" />
                <circle cx="12" cy="17" r="1" fill={emergency ? "red" : "white"} />
              </svg>
            </span>
            <div className={`status-box ${emergency ? 'warning' : ''}`}>
              {emergency ? 'Warning' : 'Normal'}
            </div>
          </div>
        </div>
        <div className="status-row">
          <div className="status-item" onClick={toggleLiftLimit}>
            <span className="status-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4v16M16 8l-4-4-4 4" stroke={liftLimit ? "#E7E964" : "white"} strokeWidth="3" />
              </svg>
            </span>
            <div className={`status-box ${liftLimit ? 'limit' : ''}`}>
              {liftLimit ? 'Lift Limit' : 'Lift Off'}
            </div>
          </div>
          <div className="status-item" onClick={toggleBumperLimit}>
            <span className="status-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L5 8v6c0 4 3 7 7 8 4-1 7-4 7-8V8l-7-6z" stroke={bumperLimit ? "#E7E964" : "white"} strokeWidth="2" />
              </svg>
            </span>
            <div className={`status-box ${bumperLimit ? 'limit' : ''}`}>
              {bumperLimit ? 'Bumper Limit' : 'Bumper Off'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AMRStatus;
