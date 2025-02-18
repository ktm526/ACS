import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AMRSelect.css';

const AMRSelect = ({ selectedIp, setSelectedIp, onSettingsUpdate }) => {
  const [ipOptions, setIpOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_NODE_SERVER_IP}/api/connected-robots`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const uniqueIps = Array.from(new Set(data.filter((ip) => ip)));
        setIpOptions(uniqueIps);
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching IP options:', error);
        setError('IP options could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectChange = async (e) => {
    const selectedIp = e.target.value;
    setSelectedIp(selectedIp);
  
    try {
      // 프록시 서버를 통해 요청
      const response = await axios.post(`${process.env.REACT_APP_NODE_SERVER_IP}/proxy/amr-get-message`, { ip: selectedIp });
      console.log(response.data)
      onSettingsUpdate(response.data); // AMRSettings에 데이터 전달
    } catch (error) {
      console.error('Failed to fetch settings through proxy:', error);
    }
  };
  

  return (
    <div className="amr-select">
      <label htmlFor="ipAddress" className="label">AMR IP 주소:</label>
      {loading ? (
        <p className="loading-message">Loading IP options...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <select
          id="ipAddress"
          value={selectedIp}
          onChange={handleSelectChange}
          className="select"
        >
          <option value="" disabled hidden>
            IP 주소를 선택하세요
          </option>
          <option>10.29.176.165</option>
          {ipOptions.length > 0 ? (
            ipOptions.map((ip) => (
              <option key={ip} value={ip}>
                {ip}
              </option>
            ))
          ) : (
            <option disabled>사용 가능한 IP가 없습니다</option>
          )}
        </select>
      )}
    </div>
  );
};

export default AMRSelect;
