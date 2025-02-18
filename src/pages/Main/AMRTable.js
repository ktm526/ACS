import React from "react";
import styles from "./AMRTableStyles";

const AMRTable = ({ robotDataList }) => {
  const getAMRStatus = (robot) => {
    console.log("table:", robot);
    const from = robot.RobotTransform?.CurrentPosition || {
      x: "N/A",
      y: "N/A",
    };
    console.log(robot.RobotState?.RobotEmergency)
    const to = robot.RobotTransform?.DesiredPositiion || { x: "N/A", y: "N/A" };
    const battery = robot.RobotState?.BatteryCharge || "N/A";
    const status = robot.RobotState.RobotEmergency === false ? "정상" : "비정상";

    return { from, to, battery, status };
  };
  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <div style={styles.headerRow}>
          <div style={styles.tableHeaderItem}>AMR</div>
          <div style={styles.tableHeaderItem}>From</div>
          <div style={styles.tableHeaderItem}>To</div>
          <div style={styles.tableHeaderItem}>Battery</div>
          <div style={styles.tableHeaderItem}>이상 여부</div>
          <div style={styles.tableHeaderItem}>Log</div>
        </div>
        <div style={styles.bodyWrapper}>
          {robotDataList.map((robot, index) => {
            const amrInfo = getAMRStatus(robot);
            return (
              <React.Fragment key={robot.RobotInfo.RobotNum}>
                <div style={styles.tableRow}>
                  <div style={styles.tableCell}>{robot.RobotInfo.RobotNum}</div>
                  <div style={styles.tableCell}>
                    {`(${amrInfo.from.x.toFixed(2)}, ${amrInfo.from.y.toFixed(
                      2
                    )})`}
                  </div>
                  <div style={styles.tableCell}>
                    {`(${amrInfo.to.x.toFixed(2)}, ${amrInfo.to.y.toFixed(2)})`}
                  </div>
                  <div style={styles.tableCell}>{amrInfo.battery}%</div>
                  <div style={styles.tableCell}>{amrInfo.status}</div>
                  <div style={styles.tableCell}>...</div>
                </div>
                {index < robotDataList.length - 1 && (
                  <div style={styles.rowDivider}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AMRTable;
