import React, { useState, useEffect, useRef, useCallback } from "react";
import testImage from "../../assets/layout6.png";
import robotImage from "../../assets/robotimg_arrow.png";
import styles from "./MonitoringStyles";
import Tooltip from "./Tooltip";
import ModalContent from "./ModalContent";
import { styled } from "@mui/material/styles";
import { Button, Modal, Box, Switch } from "@mui/material";
import axios from "axios";

const SettingsIcon = ({ color = "#fff" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="30"
    height="30"
    viewBox="0 0 30 30"
  ></svg>
);

const Monitoring = ({ error, robotDataList, isOpen }) => {
  const [smapData, setSmapData] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [naturalImageSize, setNaturalImageSize] = useState({
    width: 0,
    height: 0,
  });
  const [isResizing, setIsResizing] = useState(false);
  const [showStaticCircles, setShowStaticCircles] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isError = robotDataList.some(
    (robotData) => robotData.RobotState.RobotEmergency == 1
  );

  const minX = -43.64;
  const maxX = 31.902;
  const minY = -31.404;
  const maxY = 28.618;
  let robot_ip = "no robot";
  if (robotDataList[0]) {
    robot_ip = robotDataList[0].RobotInfo.CurrentIP;
  }
  console.log("map_ip", robot_ip);
  useEffect(() => {
    async function fetchMapName(ip) {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_NODE_SERVER_IP}/api/get-map-list`,
          { ip }
        );
        const { maps, current_map } = response.data;
        const sortedMaps = [
          current_map,
          ...maps.filter((map) => map !== current_map),
        ];
        return current_map;
      } catch (error) {
        console.error("Failed to fetch map files:", error);
        return error;
      }
    }
    fetchMapName(robot_ip).then(async (result) => {
      console.log(result);
      try {
        const mapResponse = await axios.post(
          `${process.env.REACT_APP_NODE_SERVER_IP}/api/get-map-file`,
          {
            ip: robot_ip,
            mapName: result,
          }
        );
        const { mapData } = mapResponse.data;
        console.log("mapdata", mapData);

        setSmapData(mapData);
        // 원 그리기 함수
        function drawCircle(x, y, color, ctx) {
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(x, y, 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
        function visualizeMap(data, ctx, canvas) {
          console.log("----------------visulizing map--------------------");

          if (!data || !data.header) return;

          const { minPos, maxPos } = data.header;
          const scaleX = canvas.width / (maxPos.x - minPos.x);
          const scaleY = canvas.height / (maxPos.y - minPos.y);

          data.normalPosList?.forEach((pos) => {
            const x = (pos.x - minPos.x) * scaleX;
            const y = canvas.height - (pos.y - minPos.y) * scaleY;
            drawCircle(x, y, "#E7E964", ctx);
          });
        }
        visualizeMap(
          smapData,
          canvasRef.current.getContext("2d"),
          canvasRef.current
        );
        console.log("----------------visulizing map--------------------");
      } catch (err) {
        console.error("Failed to fetch map details or robot data:", err);
      }
    });
  });

  const getRobotSizeByType = (robotType, canvasWidth) => {
    switch (robotType) {
      case "IM200":
        return canvasWidth * 0.016;
      case "IM300":
        return canvasWidth * 0.066;
      case "IM500":
        return canvasWidth * 0.076;
      case "IM1000":
        return canvasWidth * 0.086;
      case "IM2000":
        return canvasWidth * 0.113;
      default:
        return canvasWidth * 0.05; // 기본 크기
    }
  };
  const calculateShortestRotation = (currentAngle, targetAngle) => {
    let delta = targetAngle - currentAngle;
    if (targetAngle < 180) {
      if (delta < -180) delta += 360;
      else if (delta > 180) delta -= 360;
    }
    return currentAngle + delta;
  };

  const BrandSwitch = styled(Switch)(({ theme }) => ({
    "& .MuiSwitch-switchBase.Mui-checked": {
      color: "#E7E964",
      "&:hover": {
        backgroundColor: "rgba(231, 233, 100, 0.1)",
      },
    },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
      backgroundColor: "#E7E964",
    },
  }));

  const handleImageLoad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.src = testImage;

    img.onload = () => {
      const naturalWidth = img.width;
      const naturalHeight = img.height;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const scaleFactor = containerWidth / naturalWidth;
      const canvasHeight = naturalHeight * scaleFactor;

      canvas.width = containerWidth;
      canvas.height = canvasHeight;

      setNaturalImageSize({ width: naturalWidth, height: naturalHeight });
      setImageSize({ width: containerWidth, height: canvasHeight });

      if (showImage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
  };

  const handleClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    console.log(clickX / rect.width, clickY / rect.height);
  };

  useEffect(() => {
    if (canvasRef.current) {
      handleImageLoad();
    }
  }, [testImage, showImage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      setIsResizing(true);
      const { width } = container.getBoundingClientRect();
      const sidebarWidth = isOpen ? 320 : 60;
      const availableWidth = width - sidebarWidth;

      if (naturalImageSize.width > 0 && naturalImageSize.height > 0) {
        const scaledHeight =
          (availableWidth * naturalImageSize.height) / naturalImageSize.width;
        setImageSize({ width: availableWidth, height: scaledHeight });
      }
    });

    resizeObserver.observe(container);

    const resizeTimeout = setTimeout(() => {
      setIsResizing(false);
    }, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, [naturalImageSize, isOpen]);

  // useEffect(() => {
  //   const fetchSmapData = async () => {
  //     try {
  //       const response = await fetch('/assets/Map_Fact.smap');
  //       if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  //       const text = await response.text();
  //       const jsonStart = text.indexOf('{');
  //       const jsonEnd = text.lastIndexOf('}') + 1;

  //       if (jsonStart !== -1 && jsonEnd !== -1) {
  //         const jsonString = text.slice(jsonStart, jsonEnd);
  //         setSmapData(JSON.parse(jsonString));
  //       } else {
  //         throw new Error("Could not locate JSON data within .smap file");
  //       }
  //     } catch (error) {
  //       console.error("Error fetching or parsing .smap file:", error);
  //     }
  //   };
  //   fetchSmapData();
  // }, []);

  const [tooltipInfo, setTooltipInfo] = useState({
    show: false,
    position: { left: 0, top: 0 },
    data: null,
  });
  const [modalData, setModalData] = useState(null);

  const handleMouseEnter = (robotData, left, top) => {
    setTooltipInfo({
      show: true,
      position: { left: left, top: top - 15 },
      data: robotData,
    });
  };

  const handleMouseLeave = () => {
    setTooltipInfo({ ...tooltipInfo, show: false });
  };

  const handleCircleClick = (robotData) => {
    setModalData(robotData);
  };

  const handleModalClose = () => {
    setModalData(null);
  };

  const calculatePosition = (x, y) => {
    const normalizedX = (x - minX) / (maxX - minX);
    const normalizedY = (y - minY) / (maxY - minY);
    const scaledLeft = normalizedX * imageSize.width;
    const scaledTop = (1 - normalizedY) * imageSize.height;
    return { left: scaledLeft, top: scaledTop };
  };

  return (
    <div id="monitoring-container" ref={containerRef} style={styles.container}>
      <div
        style={{
          ...styles.header,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between", // 버튼을 오른쪽으로 정렬
        }}
      >
        <h1 style={{ flex: 1, textAlign: "center", fontSize: "14px" }}>
          Monitoring
        </h1>
        {/* <Button
          variant="contained"
          style={{
            marginLeft: "auto",
            marginRight: "10px",
            marginTop: "4px",
            marginBottom: "4px",
            padding: "2px",
            backgroundColor: "transparent",
            color: "gray",
            fontWeight: "600",
            fontSize: "10px",
            boxShadow: "none",
            transition: "color 0.3s ease", // 텍스트 컬러 전환 효과 추가
            borderRadius: "30px",
          }}
          onClick={() => {
            console.log("맵 업데이트 클릭됨!");
          }}
          onMouseEnter={(e) => {
            e.target.style.color = "#E7E964"; // 텍스트 색상 변경
          }}
          onMouseLeave={(e) => {
            e.target.style.color = "gray"; // 텍스트 색상 복원
          }}
        >
          맵 업데이트
        </Button> */}
      </div>

      <div
        style={{
          position: "relative",
          ...styles.imageContainer,
          paddingTop: "20px",
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{ width: "100%" }}
        />

        {robotDataList.map((robotData) => {
          //console.log('here', robotData)
          const { left, top } = calculatePosition(
            robotData.RobotInfo.Position.x,
            robotData.RobotInfo.Position.y
          );
          const robotSize = getRobotSizeByType(
            robotData.RobotInfo.RobotType,
            imageSize.width
          );
          const currentAngle = robotData.currentAngle || 0;
          const targetAngle = robotData.RobotInfo.Angle || 0;
          const smoothAngle = calculateShortestRotation(
            currentAngle,
            targetAngle
          );

          return (
            <img
              key={robotData.RobotInfo.RobotNum}
              src={robotImage}
              alt="Robot"
              style={{
                position: "absolute",
                left: `${left}px`,
                top: `${top-16}px`,
                width: `${robotSize}px`,
                height: `${robotSize}px`,
                transform: `translate(-50%, -50%) rotate(${-(
                  robotData.RobotInfo.Angle * (180 / Math.PI) +
                  90
                )}deg)`,
                //transform: `translate(-50%, -50%) rotate(${targetAngle}deg)`,

                transition: isResizing
                  ? "left 3s ease, top 3s ease, transform 2s ease"
                  : "left 2s ease, top 2s ease, transform 2s ease",
              }}
              onMouseEnter={() => handleMouseEnter(robotData, left, top)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleCircleClick(robotData)}
            />
          );
        })}

        {tooltipInfo.show && tooltipInfo.data && (
          <Tooltip position={tooltipInfo.position}>
            <span
              style={{
                color:
                  tooltipInfo.data.RobotState.RobotEmergency === 1
                    ? "red"
                    : "green", // 에러일 때 빨간색, 정상일 때 기본 색
                fontSize: "12px",
                marginRight: "5px",
              }}
            >
              𒊹
            </span>
            ID: {tooltipInfo.data.RobotInfo.RobotNum}, Model:{" "}
            {tooltipInfo.data.RobotInfo.RobotType}
          </Tooltip>
        )}
      </div>

      {modalData && (
        <ModalContent data={modalData} onClose={handleModalClose} />
      )}
      <div
        style={
          robotDataList.length === 0
            ? styles.neutralContainer
            : isError
            ? styles.errorContainer
            : styles.successContainer
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20.83"
          height="18.662"
          viewBox="0 0 20.83 18.662"
          style={
            robotDataList.length === 0
              ? styles.neutralIcon
              : isError
              ? styles.errorIcon
              : styles.successIcon
          }
        >
          <path
            id="패스_7739"
            data-name="패스 7739"
            d="M12.51,1.338l7.578,13.2a2.808,2.808,0,0,1,.381,1.367A2.527,2.527,0,0,1,17.8,18.555H2.666A2.527,2.527,0,0,1,0,15.908a2.637,2.637,0,0,1,.381-1.367l7.578-13.2a2.6,2.6,0,0,1,4.551,0ZM9.15,14.258a1.09,1.09,0,0,0,2.178,0,1.089,1.089,0,0,0-2.178,0Zm.166-8.35.127,5.313a.737.737,0,0,0,.8.811.725.725,0,0,0,.772-.811l.146-5.3a.885.885,0,0,0-.928-.9A.859.859,0,0,0,9.316,5.908Z"
          />
        </svg>

        <span style={styles.message}>
          {robotDataList.length === 0
            ? "연결된 AMR이 없습니다"
            : isError
            ? "오류가 발생한 AMR이 있습니다"
            : "모든 AMR이 정상적으로 연결되었습니다"}
        </span>
      </div>
    </div>
  );
};

export default Monitoring;
