import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import styles from './SimulationStyles';
import plusIcon from '../../assets/plus.svg';
import minusIcon from '../../assets/minus.svg';
import playIcon from '../../assets/play.svg';
import pauseIcon from '../../assets/pause.svg';
import removeIcon from '../../assets/remove.svg'; // 'x' 버튼용 SVG
import { Divider } from '@mui/material';

const Simulation = () => {
  const [csvList, setCsvList] = useState([]);
  const [selectedCsv, setSelectedCsv] = useState('');
  const [robotsData, setRobotsData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isModalOpen, setIsModalOpen] = useState(true); // Modal state
  const [selectedMap, setSelectedMap] = useState(''); // Selected map state
  const [robots, setRobots] = useState([{ id: Date.now(), x: '', y: '' }]); // Dynamic robots form
  const canvasRef = useRef(null);
  const serverIp = process.env.REACT_APP_NODE_SERVER_IP;

  let currentFrameIndex = useRef(0);
  let intervalId = useRef(null);

  // Fetch CSV file list
  useEffect(() => {
    const fetchCsvList = async () => {
      try {
        const response = await axios.get(serverIp + '/simulation-files');
        setCsvList(response.data);
      } catch (error) {
        console.error('Error fetching CSV files list:', error);
      }
    };
    fetchCsvList();
  }, [serverIp]);

  const handleCsvChange = async (csvFileName) => {
    setSelectedCsv(csvFileName);
    try {
      const response = await axios.get(serverIp + `/simulation-files/${csvFileName}`);
      const rawData = response.data.split('\n');

      const framesData = [];
      let currentTimeString = null;
      let currentRobots = [];

      rawData.forEach((row) => {
        const trimmedRow = row.trim();
        if (!trimmedRow || trimmedRow === '<start>') {
          return;
        }

        const timestampRegex = /^\d{2}\.\d{2}:\d{2}:\d{2}\.\d+$/;
        if (timestampRegex.test(trimmedRow)) {
          if (currentTimeString !== null && currentRobots.length > 0) {
            framesData.push({
              time: currentTimeString,
              robots: currentRobots,
            });
          }
          currentTimeString = trimmedRow;
          currentRobots = [];
        } else if (trimmedRow.startsWith('status:')) {
          const columns = trimmedRow.split(',').map(col => col.trim());
          const robotId = columns[1];
          const x = parseFloat(columns[2]);
          const y = parseFloat(columns[3]);

          if (!isNaN(x) && !isNaN(y)) {
            currentRobots.push({
              id: robotId,
              x: x,
              y: y,
            });
          }
        }
      });

      if (currentTimeString !== null && currentRobots.length > 0) {
        framesData.push({
          time: currentTimeString,
          robots: currentRobots,
        });
      }

      setRobotsData(framesData);
      currentFrameIndex.current = 0;
    } catch (error) {
      console.error('Error loading CSV file:', error);
    }
  };

  const addRobot = () => {
    setRobots([...robots, { id: Date.now(), x: '', y: '' }]);
  };

  const removeRobot = (id) => {
    setRobots(robots.filter((robot) => robot.id !== id));
  };

  const handleRobotChange = (id, field, value) => {
    setRobots(
      robots.map((robot) =>
        robot.id === id ? { ...robot, [field]: value } : robot
      )
    );
  };

  const handleSubmit = () => {
    console.log('Selected Map:', selectedMap);
    console.log('Robots Data:', robots);
    setIsModalOpen(false); // Close modal after submission
  };
  const startFramePlayback = () => {
    if (!isPlaying && robotsData.length > 0) {
      setIsPlaying(true);
      intervalId.current = setInterval(drawFrame, 100 / playbackSpeed);
    }
  };

  const stopFramePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      clearInterval(intervalId.current);
    }
  };

  const increasePlaybackSpeed = () => {
    setPlaybackSpeed(prevSpeed => {
      const newSpeed = Math.min(prevSpeed + 0.1, 2.0);
      if (isPlaying) {
        clearInterval(intervalId.current);
        intervalId.current = setInterval(drawFrame, 100 / newSpeed);
      }
      return newSpeed;
    });
  };

  const decreasePlaybackSpeed = () => {
    setPlaybackSpeed(prevSpeed => {
      const newSpeed = Math.max(prevSpeed - 0.1, 0.1);
      if (isPlaying) {
        clearInterval(intervalId.current);
        intervalId.current = setInterval(drawFrame, 100 / newSpeed);
      }
      return newSpeed;
    });
  };

  const scaleCoordinates = (x, y, minX, maxX, minY, maxY) => {
    const canvas = canvasRef.current;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const scaledX = ((x - minX) / (maxX - minX)) * canvasWidth;
    const scaledY = ((y - minY) / (maxY - minY)) * canvasHeight;
    return { x: scaledX, y: canvasHeight - scaledY };
  };

  const drawFrame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const currentFrame = robotsData[currentFrameIndex.current];

    if (!currentFrame) return;

    const allRobots = robotsData.flatMap(frame => frame.robots);
    const minX = Math.min(...allRobots.map(coord => coord.x));
    const maxX = Math.max(...allRobots.map(coord => coord.x));
    const minY = Math.min(...allRobots.map(coord => coord.y));
    const maxY = Math.max(...allRobots.map(coord => coord.y));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '14px Pretendard';
    ctx.fillText(`Timestamp: ${currentFrame.time}`, 10, 20);

    currentFrame.robots.forEach((robot) => {
      const { x, y } = scaleCoordinates(robot.x, robot.y, minX, maxX, minY, maxY);

      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'blue';
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = '12px Pretendard';
      ctx.fillText(`ID: ${robot.id}`, x + 12, y - 12);
    });

    currentFrameIndex.current = (currentFrameIndex.current + 1) % robotsData.length;
  };
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      canvas.width = 1200;
      canvas.height = 800;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: '#1E1E1E', // Dark theme background color
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.6)', // Subtle shadow for depth
    p: 4,
    borderRadius: '12px', // Rounded corners for a modern look
    color: 'white', // White text on dark background
    backdropFilter: 'blur(10px)', // Background blur effect
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Simulation</h1>

      {/* Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box sx={modalStyle}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Setup Simulation</h2>

          {/* Map Dropdown */}
          <div>
            <label htmlFor="map-select">Select Map:</label>
            <select
              id="map-select"
              value={selectedMap}
              onChange={(e) => setSelectedMap(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                backgroundColor: '#2E2E2E',
                border: '1px solid #59575E',
                borderRadius: '8px',
                color: 'white',
                marginTop:'6px'
              }}
            >
              <option value="">--Select a Map--</option>
              <option value="Map1">Map 1</option>
              <option value="Map2">Map 2</option>
              <option value="Map3">Map 3</option>
            </select>
          </div>

          {/* Robots Form */}
          <div>
            <h3>Robots</h3>
            {robots.map((robot, index) => (
              <div key={robot.id} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: '8px' }}>
                  Robot {index + 1}  |    X
                  <input
                    type="number"
                    value={robot.x}
                    onChange={(e) =>
                      handleRobotChange(robot.id, 'x', e.target.value)
                    }
                    style={{
                      width: '60px',
                      marginLeft: '8px',
                      padding: '4px',
                      backgroundColor: '#2E2E2E',
                      border: '1px solid #59575E',
                      borderRadius: '4px',
                      color: 'white',
                    }}
                  />
                </label>
                <label>
                  Y
                  <input
                    type="number"
                    value={robot.y}
                    onChange={(e) =>
                      handleRobotChange(robot.id, 'y', e.target.value)
                    }
                    style={{
                      width: '60px',
                      marginLeft: '8px',
                      padding: '4px',
                      backgroundColor: '#2E2E2E',
                      border: '1px solid #59575E',
                      borderRadius: '4px',
                      color: 'white',
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeRobot(robot.id)}
                  style={{
                    marginLeft: '10px',
                    marginRight: '0px',
                    backgroundColor: 'transparent', // Remove background color
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <img src={removeIcon} alt="Remove Robot" style={{ width: '8px', height: '8xpx' }} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addRobot}
              style={{
                backgroundColor: 'transparent', // Transparent background for the '+' button
                border: 'none',
                cursor: 'pointer',
                marginBottom: '16px',
                //display: 'flex',
                alignItems: 'center',
                width: '100%'
              }}
            >
              <img src={plusIcon} alt="Add Robot" style={{ width: '14px', height: '14px' }} />
            </button>
          </div>

          <Button
            onClick={handleSubmit}
            variant="outlined"
            style={{
              width: '100%',
              padding: '10px',
              borderColor: 'rgba(255, 255, 255, 0.5)', // Light gray border
              borderWidth: '0.5px',
              color: 'white',
              backgroundColor: 'transparent', // Transparent background
              borderRadius: '8px',
              cursor: 'pointer',
              textTransform: 'none', // Remove uppercase transformation
            }}
          >
            Start Simulation
          </Button>
        </Box>
      </Modal>

      {/* Simulation Canvas */}
      <div style={styles.canvasContainer}>
        <select
          style={styles.dropdownMenu}
          value={selectedCsv}
          onChange={(e) => handleCsvChange(e.target.value)}
        >
          <option value="">Select CSV File</option>
          {csvList.map((csvFileName, index) => (
            <option key={index} value={csvFileName}>
              {csvFileName}
            </option>
          ))}
        </select>

        <canvas ref={canvasRef} style={{ width: '1200px', height: '800px' }} />

        <div style={styles.controlsContainer}>
          <div style={styles.iconButtonContainer}>
            <button style={styles.iconButton} onClick={isPlaying ? stopFramePlayback : startFramePlayback}>
              <img
                src={isPlaying ? pauseIcon : playIcon}
                alt={isPlaying ? 'Pause' : 'Play'}
                style={styles.iconImage}
              />
            </button>

            <div style={styles.divider}></div>

            <div style={styles.speedControlContainer}>
              <button style={styles.iconButton} onClick={decreasePlaybackSpeed}>
                <img src={minusIcon} alt="Decrease speed" style={styles.speedControl} />
              </button>

              <span style={styles.speedDisplay}>{playbackSpeed.toFixed(1)}x</span>

              <button style={styles.iconButton} onClick={increasePlaybackSpeed}>
                <img src={plusIcon} alt="Increase speed" style={styles.speedControl} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
