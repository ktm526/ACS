import React, { useState } from 'react';
import './LiftControls.css';

const LiftControls = ({ ipAddress }) => {
  const [targetHeight, setTargetHeight] = useState(''); // 높이 입력 값 상태 관리

  const handleLiftAction = async (action, height) => {
    if (!ipAddress) {
      console.error('IP 주소가 제공되지 않았습니다.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_NODE_SERVER_IP}/api/lift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, height, ipAddress }),
      });

      if (!response.ok) {
        throw new Error('리프트 제어 요청 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      console.log('Lift action result:', result);
    } catch (error) {
      console.error('Error performing lift action:', error);
    }
  };

  const handleHeightChange = (e) => {
    setTargetHeight(e.target.value);
  };

  const handleMove = () => {
    if (!targetHeight) {
      alert('목표 높이를 입력하세요.');
      return;
    }
    handleLiftAction('move', targetHeight);
  };

  return (
    <div className="lift-controls">
      <h2 className="lift-header">리프트 제어</h2>
      <div className="lift-buttons">
        <div className="button-group">
          <button className="lift-button lift-up" onClick={() => handleLiftAction('up')}>
            ▲
          </button>
          <button className="lift-button lift-stop" onClick={() => handleLiftAction('stop')}>
            ■
          </button>
          <button className="lift-button lift-down" onClick={() => handleLiftAction('down')}>
            ▼
          </button>
        </div>
        <div className="lift-height-container">
          <input
            type="number"
            placeholder="높이 입력"
            value={targetHeight}
            onChange={handleHeightChange}
            className="lift-height-input"
          />
          <button className="lift-move-button" onClick={handleMove}>
            이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiftControls;
