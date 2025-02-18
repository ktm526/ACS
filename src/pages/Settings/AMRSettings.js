import React, { useState, useEffect } from 'react';
import './AMRSettings.css';

const AMRSettings = ({ ipAddress }) => {
  const [settings, setSettings] = useState({
    idleSpeed: 0,
    transportSpeed: 0,
    liftHeight1: 0,
    liftHeight2: 0,
    liftHeight3: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (ipAddress) {
      fetchSettings(ipAddress);
    }
  }, [ipAddress]);

  const fetchSettings = async (ip) => {
    setIsLoading(true);
    try {
      console.log('amr-get-')
      const response = await fetch(`${process.env.REACT_APP_NODE_SERVER_IP}/proxy/amr-get-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched settings:', data);

      // API 응답 데이터로 UI 상태 업데이트
      setSettings({
        idleSpeed: parseFloat(data.AMR_SPD_EMPTY) || 0,
        transportSpeed: parseFloat(data.AMR_SPD_LOAD) || 0,
        liftHeight1: parseFloat(data.AMR_LIFT_1STEP) || 0,
        liftHeight2: parseFloat(data.AMR_LIFT_2STEP) || 0,
        liftHeight3: parseFloat(data.AMR_LIFT_3STEP) || 0,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_NODE_SERVER_IP}/proxy/amr-set-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip: ipAddress, ...settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="amr-settings">
      <div className="settings-header">AMR 설정</div>
      <div className="settings-content">
        {isLoading ? (
          <p className='loading-message'>Loading settings...</p>
        ) : (
          <>
            <div className="settings-group">
              <h3 className="settings-subheader">속도 설정</h3>
              <div className="input-container">
                <div className="input-row">
                  <label>공차 속도</label>
                  <input
                    type="number"
                    value={settings.idleSpeed}
                    onChange={(e) => handleInputChange('idleSpeed', parseFloat(e.target.value))}
                    step="0.1"
                    disabled={isLoading}
                  />
                </div>
                <div className="input-row">
                  <label>운송 속도</label>
                  <input
                    type="number"
                    value={settings.transportSpeed}
                    onChange={(e) => handleInputChange('transportSpeed', parseFloat(e.target.value))}
                    step="0.1"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="settings-group">
              <h3 className="settings-subheader">리프트 높이 설정</h3>
              <div className="input-container">
                <div className="input-row">
                  <label>1단</label>
                  <input
                    type="number"
                    value={settings.liftHeight1}
                    onChange={(e) => handleInputChange('liftHeight1', parseFloat(e.target.value))}
                    step="1"
                    disabled={isLoading}
                  />
                </div>
                <div className="input-row">
                  <label>2단</label>
                  <input
                    type="number"
                    value={settings.liftHeight2}
                    onChange={(e) => handleInputChange('liftHeight2', parseFloat(e.target.value))}
                    step="1"
                    disabled={isLoading}
                  />
                </div>
                <div className="input-row">
                  <label>3단</label>
                  <input
                    type="number"
                    value={settings.liftHeight3}
                    onChange={(e) => handleInputChange('liftHeight3', parseFloat(e.target.value))}
                    step="1"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <button className="save-button" onClick={handleSave} disabled={isLoading}>
              저장
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AMRSettings;
