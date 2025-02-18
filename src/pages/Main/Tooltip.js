import React from 'react';

const Tooltip = ({ position, children }) => {
  const tooltipStyle = {
    position: 'absolute',
    left: `${position.left}px`,
    top: `${position.top}px`,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#fff',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    pointerEvents: 'none',
    transform: 'translate(-50%, -100%)', // 툴팁이 원 위에 나타나도록 조정
    whiteSpace: 'nowrap',
    zIndex: 1000,
  };

  return <div style={tooltipStyle}>{children}</div>;
};

export default Tooltip;
