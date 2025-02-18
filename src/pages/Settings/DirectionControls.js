import React, { useState } from 'react';
import './DirectionControls.css';

const DirectionControls = ({ ipAddress }) => {
  const [activeButton, setActiveButton] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  const sendMovementCommand = async (direction) => {
    if (!ipAddress) {
      console.error('IP 주소가 입력되지 않았습니다.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_NODE_SERVER_IP}/api/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip: ipAddress, direction }),
      });
      const result = await response.json();
      console.log('Response:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMouseDown = (direction) => {
    setActiveButton(direction);
    sendMovementCommand(direction);
    const id = setInterval(() => sendMovementCommand(direction), 500);
    setIntervalId(id);
  };

  const handleMouseUp = () => {
    clearInterval(intervalId);
    setIntervalId(null);
    setActiveButton(null);
  };

  return (
    <div className="direction-controls">
      <div className="direction-header">AMR 이동</div>
      <div className="direction-buttons">
        <div className="direction-row">
          <button
            className={`direction-button ${activeButton === 'up' ? 'active' : ''}`}
            onMouseDown={() => handleMouseDown('up')}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            ▲
          </button>
        </div>
        <div className="direction-row">
        <button
  className={`direction-button rotate ${activeButton === 'rotate-left' ? 'active' : ''}`}
  onMouseDown={() => handleMouseDown('rotate-left')}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
>
  ↺
</button>


          <button
            className={`direction-button ${activeButton === 'down' ? 'active' : ''}`}
            onMouseDown={() => handleMouseDown('down')}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            ▼
          </button>
          <button
  className={`direction-button rotate ${activeButton === 'rotate-right' ? 'active' : ''}`}
  onMouseDown={() => handleMouseDown('rotate-right')}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
>
  ↻
</button>
        </div>
      </div>
    </div>
  );
};

export default DirectionControls;
