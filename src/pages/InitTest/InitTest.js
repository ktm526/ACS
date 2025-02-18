import React from 'react';
import MapList from './MapList';
import styles from './initTestStyles';  // 스타일 파일
import RobotIOStatus from './robotIOStatus';

const InitTestPage = () => {
  return (
    <div style={styles.container}>
      {/* 페이지 제목 */}
      <h1 style={styles.pageTitle}>Init Test</h1>

      {/* MapList 컴포넌트 */}
      <div style={styles.fullWidthSection}>
        <MapList />
        <RobotIOStatus />
      </div>
    </div>
  );
};

export default InitTestPage;
