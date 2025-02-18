import React, { useState } from "react";
import styles from "./AMRListStyles";

const AMRList = ({ robotDataList, onSelectRobot }) => {
  const [selectedRobot, setSelectedRobot] = useState(null);
  const [hoverStyle, setHoverStyle] = useState({}); // 동적 배경 스타일

  // 로봇 선택 핸들러
  const handleSelectRobot = (amr) => {
    setSelectedRobot(amr.RobotInfo.RobotNum);
    if (onSelectRobot) {
      onSelectRobot(amr); // 선택된 로봇 정보를 상위로 전달
    }
  };

  // 마우스 이동 시 배경색 업데이트
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; // 요소 내부에서의 X 좌표
    const y = e.clientY - rect.top; // 요소 내부에서의 Y 좌표
    setHoverStyle({
      background: `radial-gradient(circle at ${x}px ${y}px, rgba(77, 75, 80, 0.6), transparent)`,
      transform: "scale(1.02)",
    });
  };

  // 마우스가 떠날 때 초기화
  const handleMouseLeave = () => {
    setHoverStyle({}); // 스타일 초기화
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>AMR List</div>
      </div>
      <div style={styles.content}>
        {robotDataList.map((amr, index) => (
          <React.Fragment key={amr.RobotInfo.RobotNum}>
            <div
              style={{
                ...styles.listItem,
                ...(selectedRobot === amr.RobotInfo.RobotNum
                  ? { backgroundColor: "#4D4B50" }
                  : hoverStyle),
                transition: "transform 0.3s ease, background 0.3s ease",
                cursor: "pointer",
              }}
              onClick={() => handleSelectRobot(amr)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div style={styles.leftSection}>
                <span
                  style={{
                    ...styles.statusIndicator,
                    backgroundColor: amr.RobotState.RobotEmergency
                      ? "red"
                      : "green",
                  }}
                ></span>
                <div style={styles.amrId}>{amr.RobotInfo.RobotNum}</div>
              </div>
            </div>

            {index < robotDataList.length - 1 && <hr style={styles.divider} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default AMRList;
