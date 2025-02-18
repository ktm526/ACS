import React, { useState } from 'react';
import axios from 'axios';
import styles from './MapListStyles'; // 스타일 코드 분리

const MapRequest = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [mapData, setMapData] = useState(null);
  const [error, setError] = useState(null);

  const sendMapRequest = async () => {
    console.log("sendMapRequest called"); // 함수 호출 확인
    try {
      // 기본 요청 헤더 구성
      const header = [
        0x5A, 0x01, 0x00, 0x01, 
        0x00, 0x00, 0x00, 0x00,  // 데이터 길이 0 (이 경우에는 데이터 영역 없음)
        0x05, 0x14,              // API 번호 1300 (맵 데이터 요청)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00  // Reserved area
      ];
  
      // 헤더를 16진수 문자열로 변환
      const headerHex = header.map(byte => byte.toString(16).padStart(2, '0')).join('');
  
      // IP로 맵 데이터를 요청
      const response = await axios.post(`http://${ipAddress}:19204/map-data`, { header: headerHex }, {
        timeout: 5000 // 5초 동안 응답이 없으면 요청 취소
      });
  
      // 응답 처리
      if (response.data.ret_code === 0) {
        setMapData(response.data);  // 맵 데이터를 성공적으로 수신
        setError(null);
      } else {
        setError('맵 데이터를 불러오는 데 실패했습니다.');
        setMapData(null);
      }
    } catch (err) {
      // 에러가 발생한 경우 (네트워크 에러, 시간 초과 등)
      if (err.code === 'ECONNABORTED') {
        setError('요청 시간이 초과되었습니다. 다시 시도해 주세요.');
      } else {
        setError('요청 중 오류가 발생했습니다.');
      }
      setMapData(null);
    }
  };
  
  

  return (
    <div style={styles.container}>
      <div style={styles.header}>Map List</div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={ipAddress}
          onChange={(e) => setIpAddress(e.target.value)}
          placeholder="IP 주소 입력"
          style={styles.input}
        />
        <button onClick={sendMapRequest} style={styles.button}>요청</button>
      </div>
      <div style={styles.responseContainer}>
        {error && <p style={styles.error}>{error}</p>}
        {mapData && (
          <ul style={styles.mapList}>
            {mapData.maps.map((mapName, index) => (
              <li key={index} style={styles.mapItem}>{mapName}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MapRequest;
