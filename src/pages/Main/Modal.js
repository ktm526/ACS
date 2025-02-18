// Modal.js
import React from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* 모달 배경 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(43, 38, 51, 0.8)', // 배경색 조정, 투명도 추가
          zIndex: 1000,
          backdropFilter: 'blur(5px)', // 배경 블러 효과 추가
        }}
        onClick={onClose}
      ></div>
      {/* 모달 내용 */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#2B2633', // 기존 스타일과 일치시키기 위해 배경색 변경
          padding: '20px',
          zIndex: 1001,
          maxHeight: '80%',
          overflowY: 'auto',
          width: '60%', // 너비 조정
          borderRadius: '20px', // 기존 스타일과 일치
          color: 'white', // 텍스트 색상
          border: '2px solid #59575E', // 테두리 추가
          boxSizing: 'border-box',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)', // 그림자 효과 추가
        }}
      >
        <button
          onClick={onClose}
          style={{
            float: 'right',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
        {children}
      </div>
    </>,
    document.body
  );
};

export default Modal;
