import React from 'react';

const ModalContent = ({ data, onClose }) => {
  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    backgroundColor: '#1c1c1e', // 다크 그레이 배경색
    color: '#ffffff', // 흰색 텍스트
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)', // 깊이감을 위한 그림자
    width: '400px',
    maxWidth: '90%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(28, 28, 30, 0.75)', // 반투명한 다크 오버레이
    zIndex: 999,
  };

  const buttonStyle = {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#2c2c2e', // 버튼 배경색
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)', // 버튼 그림자
  };

  const titleStyle = {
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: '600',
  };

  const listStyle = {
    listStyleType: 'none',
    padding: 0,
    margin: '10px 0',
  };

  const listItemStyle = {
    marginBottom: '10px',
    fontSize: '18px',
  };

  // 로봇 정보 추출
  const robotNum = data.RobotInfo.RobotNum;
  const status = data.RobotInfo.Status;

  // 위치 정보 추출 및 확인
  const position = data.RobotInfo.Position;
  const x = parseFloat(position.x);
  const y = parseFloat(position.y);
  const z = parseFloat(position.z);

  return (
    <>
      <div style={overlayStyle} onClick={onClose}></div>
      <div style={modalStyle}>
        <h2 style={titleStyle}>Robot {robotNum}</h2>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>Position:</p>
        <ul style={listStyle}>
          <li style={listItemStyle}>x: {Number.isFinite(x) ? x.toFixed(2) : 'N/A'}</li>
          <li style={listItemStyle}>y: {Number.isFinite(y) ? y.toFixed(2) : 'N/A'}</li>
          {Number.isFinite(z) && (
            <li style={listItemStyle}>z: {z.toFixed(2)}</li>
          )}
        </ul>
        <p style={{ fontSize: '18px', marginTop: '20px' }}>Status: {status}</p>
        <button style={buttonStyle} onClick={onClose}>Close</button>
      </div>
    </>
  );
};

export default ModalContent;
