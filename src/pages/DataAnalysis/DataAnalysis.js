import React, { useState, useEffect } from "react";
import "./DataAnalysis.css";
import io from "socket.io-client";

const socket = io(`${process.env.REACT_APP_NODE_SERVER_IP}`);

// 타임스탬프 변환 함수
const formatTimestamp = (timestamp) => {
  const date = new Date(parseFloat(timestamp));
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 메시지 포맷팅 함수
const formatMessage = (message) => {
  if (!message) return "";
  const parts = message.split(";");
  const [taskId, status, code, locationInfo] = parts;
  return `
    Task: ${taskId || "N/A"} | 
    Status: ${status || "N/A"} | 
    Code: ${code || "N/A"} | 
    Location: ${locationInfo || "N/A"}
  `.trim();
};

// 날짜 범위 계산 함수
const getDateRange = (baseDate, unit, offset = 0) => {
  const current = new Date(baseDate);
  let start, end;

  if (unit === "Day") {
    start = new Date(current.setDate(current.getDate() + offset));
    end = new Date(start);
  } else if (unit === "Week") {
    const dayOfWeek = current.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(
      current.setDate(current.getDate() + daysToMonday + offset * 7)
    );

    start = new Date(monday);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (unit === "Month") {
    start = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    end = new Date(current.getFullYear(), current.getMonth() + offset + 1, 0);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const DataAnalysis = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [unit, setUnit] = useState("Day");
  const [offset, setOffset] = useState(0);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    setOffset(0);
  }, [unit]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_NODE_SERVER_IP}/api/logs`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();

    socket.on("newLog", (newLog) => {
      setLogs((prevLogs) => [...prevLogs, newLog]);
    });

    return () => {
      socket.off("newLog");
    };
  }, []);

  useEffect(() => {
    const { start, end } = getDateRange(new Date(), unit, offset);
    setDateRange({
      start: start.toLocaleDateString("ko-KR"),
      end: end.toLocaleDateString("ko-KR"),
    });

    setFilteredLogs(
      logs.filter((log) => {
        const logDate = new Date(parseFloat(log.timestamp));
        return logDate >= start && logDate <= end;
      })
    );
  }, [logs, unit, offset]);

  const getStatusClassName = (status) => {
    if (status === "정상") return "status-normal";
    if (status === "경고") return "status-warning";
    if (status === "에러") return "status-error";
    return "";
  };

  const downloadCSV = () => {
    const csvContent = [
      ["Timestamp", "Robot ID", "Status", "Type", "Message"],
      ...filteredLogs.map((log) => [
        log.timestamp,
        log.robot_id,
        log.status,
        log.type,
        log.message,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "logs.csv";
    link.click();
  };

  return (
    <div className="data-analysis">
      <h1 className="pageTitle">Logs</h1>

      <div className="table-container">
        <div className="table-header">
          <span>Log Data</span>
          <div className="filter-container">
            <div className="filter-select-container">
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="filter-select"
              >
                <option value="Day">Day</option>
                <option value="Week">Week</option>
                <option value="Month">Month</option>
              </select>
            </div>

            <button
              onClick={() => setOffset(offset - 1)}
              className="arrow-button"
            >
              ◀
            </button>
            <span className="date-range">
              {dateRange.start} ~ {dateRange.end}
            </span>
            <button
              onClick={() => setOffset(offset + 1)}
              className="arrow-button"
            >
              ▶
            </button>
          </div>
          <button className="download-button" onClick={downloadCSV}>
            Download CSV
          </button>
        </div>

        <table className="log-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Robot ID</th>
              <th>Status</th>
              <th>Type</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr key={index}>
                <td>{formatTimestamp(log.timestamp)}</td>
                <td>{log.robot_id}</td>
                <td>
                  <span className={getStatusClassName(log.status)}>
                    {log.status}
                  </span>
                </td>
                <td>{log.type}</td>
                <td>{formatMessage(log.message)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataAnalysis;
