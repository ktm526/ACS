import React, { useState } from "react";
import AMRSelect from "./AMRSelect";
import DirectionControls from "./DirectionControls";
import LiftControls from "./LiftControls";
import AMRStatus from "./AMRStatus";
import AMRSettings from "./AMRSettings";
import "./SettingsPage.css";

const SettingsPage = () => {
  const [selectedIp, setSelectedIp] = useState("");
  const [settings, setSettings] = useState({
    idleSpeed: 0,
    transportSpeed: 0,
    liftHeight1: 0,
    liftHeight2: 0,
    liftHeight3: 0,
  });

  const handleSettingsUpdate = (newSettings) => {
    setSettings(newSettings); // 새로운 설정 업데이트
  };

  return (
    <div className="settings-page">
      <div className="page-title">AMR Settings</div>
      <div className="amr-select-container">
        <AMRSelect
          selectedIp={selectedIp}
          setSelectedIp={setSelectedIp}
          onSettingsUpdate={handleSettingsUpdate} // AMRSelect에서 업데이트된 설정 받기
        />
      </div>

      <div className="controls-row">
        <DirectionControls ipAddress={selectedIp} />
        <LiftControls ipAddress={selectedIp} />
        <AMRStatus ipAddress={selectedIp} />
      </div>

      <div className="amr-settings-container">
        <AMRSettings
          ipAddress={selectedIp}
          settings={settings} // 설정 상태 전달
          setSettings={setSettings} // 설정 업데이트 함수 전달
        />
      </div>
    </div>
  );
};

export default SettingsPage;
