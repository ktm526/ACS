// src/MapEditor/MapEditor.js

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import styles from "./MapEditor.module.css";
import RobotMapList from "./RobotMapList";

const socket = io(`${process.env.REACT_APP_NODE_SERVER_IP}`, {
  withCredentials: true,
  transports: ["websocket"],
});

const MapEditor = () => {
  const [robotDataList, setRobotDataList] = useState([]);

  useEffect(() => {
    // 서버로부터 전체 로봇 정보 배열을 수신
    socket.on("updateRobotInfo", (allRobotsData) => {
      console.log("Received all robots data from WebSocket:", allRobotsData);
      setRobotDataList(allRobotsData); // 전체 로봇 정보를 직접 설정
    });

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      socket.off("updateRobotInfo");
    };
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Map Editor</h1>
      <h2 className={styles.subtitle}>저장된 맵 목록</h2>
      <RobotMapList robotDataList={robotDataList} />
    </div>
  );
};

export default MapEditor;
