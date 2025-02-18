import React, { useState, useEffect } from 'react';
import MapUploadModal from './MapUploadModal';
import MapViewer from './MapViewer'; // MapViewer 추가
import { ReactComponent as RobotIcon } from '../../assets/robot-icon.svg';
import { ReactComponent as EditIcon } from '../../assets/edit-icon.svg';
import { ReactComponent as ExpandIcon } from '../../assets/expand.svg';
import axios from 'axios';
import styles from './SavedMapList.module.css';

const SavedMapList = ({ robot }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapFiles, setMapFiles] = useState([]);
  const [currentMap, setCurrentMap] = useState('');
  const [mapDetails, setMapDetails] = useState(null); // 선택된 맵 세부 정보
  const [selectedMapName, setSelectedMapName] = useState(''); // 현재 선택된 맵 이름
  const [userObjects, setUserObjects] = useState(null); // 장애물 정보 추가
  const [loading, setLoading] = useState(false); // 로딩 상태 관리
  const [error, setError] = useState(null); // 에러 상태 관리

  useEffect(() => {
    if (isExpanded && robot.RobotInfo.CurrentIP) {
      fetchMapFiles(robot.RobotInfo.CurrentIP);
    }
  }, [isExpanded, robot.RobotInfo.CurrentIP]);

  const fetchMapFiles = async (ip) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_NODE_SERVER_IP}/api/get-map-list`, { ip });
      const { maps, current_map } = response.data;
      setCurrentMap(current_map || '');
      const sortedMaps = [current_map, ...maps.filter((map) => map !== current_map)];
      setMapFiles(sortedMaps);
    } catch (error) {
      console.error('Failed to fetch map files:', error);
    }
  };

  const fetchMapDetails = async (mapName) => {
    setLoading(true);
    setError(null);
    try {
      const mapResponse = await axios.post(`${process.env.REACT_APP_NODE_SERVER_IP}/api/get-map-file`, {
        ip: robot.RobotInfo.CurrentIP,
        mapName,
      });

      const { mapData } = mapResponse.data;
      setMapDetails(mapData);
      setSelectedMapName(mapName); // 선택된 맵 이름 저장

      // 로봇 데이터 요청
      const robotResponse = await axios.post(`${process.env.REACT_APP_NODE_SERVER_IP}/api/robot-data`, {
        robotIP: robot.RobotInfo.CurrentIP,
      });

      const { user_objects } = robotResponse.data; // 로봇 장애물 정보 추출
      setUserObjects(user_objects);
      console.log('Fetched map details:', mapData);
      console.log('User Objects (Obstacles):', user_objects);
    } catch (err) {
      console.error('Failed to fetch map details or robot data:', err);
      setError('Failed to fetch map or robot data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const closeViewerModal = () => {
    setMapDetails(null); // 맵 세부 정보 초기화
    setUserObjects(null); // 장애물 정보 초기화
  };

  return (
    <div className={styles.overlayContainer}>
      {isExpanded && <div className={styles.overlayBackground} onClick={() => setIsExpanded(false)} />}
      <div className={`${styles.container} ${isExpanded ? styles.expanded : ''}`}>
        <div className={styles.header}>
          <div className={styles.robotInfo}>
            <RobotIcon className={styles.robotIcon} />
            <div className={styles.robotDetails}>
              <span className={styles.robotUID}>{robot.uid}</span>
              <span className={styles.robotIP}>{robot.RobotInfo.CurrentIP}</span>
            </div>
          </div>
          <button className={`${styles.expandToggle} ${isExpanded ? styles.rotated : ''}`} onClick={toggleExpand}>
            <ExpandIcon className={styles.expandIcon} />
          </button>
        </div>
        {isExpanded && (
          <div className={styles.fileList}>
            {mapFiles.map((fileName) => (
              <div
                key={fileName}
                className={`${styles.listItem} ${fileName === currentMap ? styles.currentMap : ''}`}
                onClick={() => fetchMapDetails(fileName)} // 파일 클릭 시 맵 세부 정보 가져오기
              >
                <div className={styles.fileName}>{fileName}</div>
                <EditIcon className={styles.editIcon} />
              </div>
            ))}
            <div className={styles.addNewFile} onClick={openModal}>
              + 새로운 파일 추가
            </div>
          </div>
        )}
      </div>

      {/* 로딩 상태 표시 */}
      {loading && <p>Loading data...</p>}

      {/* 에러 상태 표시 */}
      {error && <p className={styles.error}>Error: {error}</p>}

      {/* 맵 뷰어 모달 */}
      {mapDetails && (
        <div className={styles.mapViewerOverlay}>
          <button className={styles.mapViewerCloseButton} onClick={closeViewerModal}>
            &times; {/* 닫기 버튼 */}
          </button>
          <div className={styles.mapViewerModal}>
            <h3 className={styles.mapViewerTitle}>{selectedMapName}</h3>
            <MapViewer fileData={mapDetails} mapName={selectedMapName} obstacles={userObjects} />
            </div>
          {userObjects && (
            <div className={styles.userObjects}>
              <h4>Obstacles:</h4>
              <pre>{JSON.stringify(userObjects, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {isModalOpen && <MapUploadModal onClose={closeModal} />}
    </div>
  );
};

export default SavedMapList;
