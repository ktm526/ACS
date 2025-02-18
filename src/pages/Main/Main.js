import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Monitoring from "./Monitoring";
import AMRTable from "./AMRTable";
import AMRList from "./AMRList";
import AMRDetail from "./AMRDetail"; // 추가
import styles from "./mainStyles";

const socket = io(`${process.env.REACT_APP_NODE_SERVER_IP}`, {
  withCredentials: true,
  transports: ["websocket"],
});

const MainPage = () => {
  const [robotDataList, setRobotDataList] = useState([]);
  const [selectedRobot, setSelectedRobot] = useState(null); // 선택된 로봇 상태

  useEffect(() => {
    socket.on("updateRobotInfo", (allRobotsData) => {
      setRobotDataList(allRobotsData);
    });

    return () => {
      socket.off("updateRobotInfo");
    };
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Main Monitoring</h1>
      <div style={styles.contentRow}>
        <div style={styles.leftColumn}>
          <div style={styles.monitoringSection}>
            <Monitoring robotDataList={robotDataList} />
          </div>
          <div style={styles.amrTableSection}>
            <AMRTable robotDataList={robotDataList} />
          </div>
        </div>
        <div style={styles.rightColumn}>
          <AMRList
            robotDataList={robotDataList}
            onSelectRobot={setSelectedRobot}
          />
          <div style={styles.additionalSection}>
            <AMRDetail selectedRobot={selectedRobot} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
