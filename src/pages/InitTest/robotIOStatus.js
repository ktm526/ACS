import React, { useState } from 'react';
import axios from 'axios';
import styles from './robotIOStatusStyles'; // 스타일 임포트

const RobotIOStatus = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [ioData, setIoData] = useState(null);
  const [error, setError] = useState(null);

  const sendIOStatusRequest = async () => {
    try {
      // 기본 요청 헤더 구성
      const header = [
        0x5A, 0x01, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00,  // 데이터 길이 0 (이 경우에는 데이터 영역 없음)
        0x03, 0xF5,              // API 번호 1013 (I/O 상태 요청)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00  // Reserved area
      ];
  
      // 헤더를 16진수 문자열로 변환
      const headerHex = header.map(byte => byte.toString(16).padStart(2, '0')).join('');
  
      // IP로 I/O 상태 데이터를 요청
      const response = await axios.post(`http://${ipAddress}:19204/io-status`, { header: headerHex }, {
        timeout: 5000 // 5초 동안 응답이 없으면 요청 취소
      });
  
      // 응답 처리
      if (response.data.ret_code === 0) {
        setIoData(response.data);  // I/O 데이터를 성공적으로 수신
        setError(null);
      } else {
        setError('I/O 상태 데이터를 불러오는 데 실패했습니다.');
        setIoData(null);
      }
    } catch (err) {
      // 에러가 발생한 경우 (네트워크 에러, 시간 초과 등)
      if (err.code === 'ECONNABORTED') {
        setError('요청 시간이 초과되었습니다. 다시 시도해 주세요.');
      } else {
        setError('요청 중 오류가 발생했습니다.');
      }
      setIoData(null);
    }
  };
  

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Robot I/O Status</span>
      </div>

      <div style={styles.content}>
        <div style={styles.inputContainer}>
          <input
            type="text"
            style={styles.input}
            placeholder="IP 주소 입력"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
          />
          <button style={styles.button} onClick={sendIOStatusRequest}>
            요청
          </button>
        </div>

        {error && <div style={styles.errorContainer}>{error}</div>}

        {ioData && (
          <div>
            <h3>DI (Digital Inputs)</h3>
            <ul>
              {ioData.DI.map((di, index) => (
                <li key={index} style={styles.listItem}>
                  ID: {di.id}, Source: {di.source}, Status: {di.status ? 'High' : 'Low'}, Valid: {di.valid ? 'Enabled' : 'Disabled'}
                </li>
              ))}
            </ul>
            
            <h3>DO (Digital Outputs)</h3>
            <ul>
              {ioData.DO.map((doItem, index) => (
                <li key={index} style={styles.listItem}>
                  ID: {doItem.id}, Source: {doItem.source}, Status: {doItem.status ? 'High' : 'Low'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RobotIOStatus;
