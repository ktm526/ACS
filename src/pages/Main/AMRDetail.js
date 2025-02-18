import React from "react";
import "./AMRDetail.css";

const AMRDetail = ({ selectedRobot }) => {
  if (!selectedRobot) {
    return <div className="amr-detail-no-data">No robot selected</div>;
  }

  // 표시할 항목 정의
  const allowedKeys = [
    "BatteryCharge",
    "LinearVelocity",
    "AngularVelocity",
    "CurrentIP",
    "TCPIP",
    "RobotEmergency",
  ];

  const renderTableRows = (data, prefix = "") => {
    return Object.entries(data)
      .filter(([key]) => allowedKeys.includes(`${prefix}${key}`)) // 원하는 항목만 필터링
      .map(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          // 중첩된 객체 처리
          return (
            <React.Fragment key={`${prefix}${key}`}>
              <tr className="amr-detail-table-section">
                <td colSpan="2" className="amr-detail-table-section-header">
                  {key.toUpperCase()}
                </td>
              </tr>
              {renderTableRows(value, `${prefix}${key}.`)}
            </React.Fragment>
          );
        }
        return (
          <tr key={`${prefix}${key}`} className="amr-detail-table-row">
            <td className="amr-detail-table-cell">{key}</td>
            <td className="amr-detail-table-cell-value">
              {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
            </td>
          </tr>
        );
      });
  };

  return (
    <div className="amr-detail-container">
      <div className="amr-detail-header">
        <div className="amr-detail-header-title">AMR Details</div>
      </div>
      <div className="amr-detail-content">
        <table className="amr-detail-table">
          <tbody>{renderTableRows(selectedRobot.RobotState)}</tbody>

          <tbody>{renderTableRows(selectedRobot.RobotInfo)}</tbody>
        </table>
      </div>
    </div>
  );
};

export default AMRDetail;
