import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Modal,
  Box,
  Stepper,
  Step,
  StepLabel,
  TextField,
  InputLabel,
  Typography,
  Slider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from './mapeditor_styles';
import MapViewModal from '../components/MapViewModal';

const steps = ['맵 설정', '데이터 설정', '미리보기'];

const GRID_SIZE = 50;  // 격자 간격 설정

const MapEditor = () => {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mapName, setMapName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [smapDataFile, setSmapDataFile] = useState(null);
  const [smapData, setSmapData] = useState(null);
  const [mapList, setMapList] = useState([]);
  const [selectedMapFile, setSelectedMapFile] = useState(null);
  const [smapState, setSmapState] = useState({ scale: 1, rotation: 0, position: { x: 0, y: 0 } });
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const imgRef = useRef(null);
  const dragStartRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 }); // 캔버스 크기를 1200x800으로 고정

  // 3단계 관련 상태 변수
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [previewNode, setPreviewNode] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [openModal, setOpenModal] = useState(false); // 모달 열기/닫기 상태
  const [selectedNode, setSelectedNode] = useState(null); // 선택된 노드 상태
  const [isEditingExistingMap, setIsEditingExistingMap] = useState(false); // 기존 맵 편집 여부
  const [selectedMapData, setSelectedMapData] = useState(null);

  const fetchMapList = async () => {
    try {
      const response = await fetch('http://141.164.61.77:3331/maps');
      if (response.ok) {
        const mapFiles = await response.json();
        setMapList(mapFiles);
      } else {
        console.error('Failed to fetch map list');
      }
    } catch (error) {
      console.error('Error fetching map list:', error);
    }
  };
  const handleMapClick = async (mapFileName) => {
    // 상태 초기화
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedMapFile(null); // 초기화
  
    try {
      // 맵 데이터를 로드합니다.
      await loadMapData(mapFileName);
  
      // 맵 데이터가 로드되면 모달을 엽니다.
      setSelectedMapFile(mapFileName); // 이 시점에 맵 파일 설정
      setOpenModal(true); // 모달을 엽니다.
    } catch (error) {
      console.error('Error loading map data:', error);
    }
  };
  const handleDoubleClick = (e) => {
    if (!previewCanvasRef.current) return;
  
    const rect = previewCanvasRef.current.getBoundingClientRect();
  
    // devicePixelRatio 고려
    const dpr = window.devicePixelRatio || 1;
  
    // 마우스 좌표를 캔버스 좌표로 변환
    let x = (e.clientX - rect.left) * (previewCanvasRef.current.width / (rect.width * dpr));
    let y = (e.clientY - rect.top) * (previewCanvasRef.current.height / (rect.height * dpr));
  
    // X 또는 Y 방향으로 격자에 맞춰 위치 조정
    x = Math.round(x / GRID_SIZE) * GRID_SIZE;
    y = Math.round(y / GRID_SIZE) * GRID_SIZE;
  
    if (!isDrawing) {
        // 첫 번째 노드 생성
        const newNode = { x, y, color: 'red' };
        setNodes([...nodes, newNode]);
        setIsDrawing(true);
    } else {
        const lastNode = nodes[nodes.length - 1];
        const nodesToAdd = [];
        const edgesToAdd = [];
  
        // X축과 Y축을 따라 그리드 생성
        const startX = Math.min(lastNode.x, x);
        const endX = Math.max(lastNode.x, x);
        const startY = Math.min(lastNode.y, y);
        const endY = Math.max(lastNode.y, y);
  
        // 노드 생성 및 상하좌우 연결
        const newNodes = {};
        for (let i = startX; i <= endX; i += GRID_SIZE) {
            for (let j = startY; j <= endY; j += GRID_SIZE) {
                const nodeKey = `${i},${j}`;
                if (!newNodes[nodeKey]) {
                    const newNode = { x: i, y: j, color: 'blue' };
                    newNodes[nodeKey] = newNode;
                    nodesToAdd.push(newNode);
                }
  
                // 상하 연결
                if (j > startY) {
                    const aboveNodeKey = `${i},${j - GRID_SIZE}`;
                    if (newNodes[aboveNodeKey]) {
                        edgesToAdd.push({ start: newNodes[aboveNodeKey], end: newNodes[nodeKey] });
                    }
                }
  
                // 좌우 연결
                if (i > startX) {
                    const leftNodeKey = `${i - GRID_SIZE},${j}`;
                    if (newNodes[leftNodeKey]) {
                        edgesToAdd.push({ start: newNodes[leftNodeKey], end: newNodes[nodeKey] });
                    }
                }
            }
        }
  
        setNodes([...nodes, ...nodesToAdd]);
        setEdges([...edges, ...edgesToAdd]);
  
        setPreviewNode(null);
        setIsDrawing(false);
    }
  };
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
  
    const rect = previewCanvasRef.current.getBoundingClientRect();
  
    // devicePixelRatio 고려
    const dpr = window.devicePixelRatio || 1;
  
    let x = (e.clientX - rect.left) * (previewCanvasRef.current.width / (rect.width * dpr));
    let y = (e.clientY - rect.top) * (previewCanvasRef.current.height / (rect.height * dpr));
  
    // 마지막 노드를 기준으로 x 또는 y에 고정된 위치 계산
    const lastNode = nodes[nodes.length - 1];
    x = Math.round(x / GRID_SIZE) * GRID_SIZE;
    y = Math.round(y / GRID_SIZE) * GRID_SIZE;
  
    setPreviewNode({ x, y });
  };
  const handleOpen = () => {
    setOpen(true);
    setOpenModal(false);  // 다른 모달을 닫음
  };
  const handleClose = async () => {
    setOpen(false);
    setActiveStep(0);
    setMapName('');
    setBackgroundImage(null);
    setSmapDataFile(null);
    setSmapData(null);
    setSmapState({ scale: 1, rotation: 0, position: { x: 0, y: 0 } });
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  
    // 맵 목록을 업데이트합니다.
    await fetchMapList();
  };
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleUpload();  // 마지막 단계에서는 업로드 함수 호출
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  const loadMapData = async (mapFileName) => {
    try {
      const response = await fetch(`http://141.164.61.77:3331/uploads/${mapFileName}`);
      if (response.ok) {
        const mapData = await response.json();
  
        const img = new Image();
        img.onload = () => {
          imgRef.current = img;
  
          const transformedNodes = mapData.nodes.map(node => ({
            ...node,
            x: node.x * canvasSize.width,
            y: node.y * canvasSize.height,
          }));
  
          const transformedEdges = mapData.edges.map(edge => ({
            start: {
              ...edge.start,
              x: edge.start.x * canvasSize.width,
              y: edge.start.y * canvasSize.height,
            },
            end: {
              ...edge.end,
              x: edge.end.x * canvasSize.width,
              y: edge.end.y * canvasSize.height,
            }
          }));
  
          setNodes(transformedNodes);
          setEdges(transformedEdges);
        };
  
        img.src = `http://141.164.61.77:3331/uploads/${mapData.imageFileName}`;
      } else {
        console.error('Failed to load map data');
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    }
  };
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('image', backgroundImage);
    formData.append('mapName', mapName);
  
    // 노드와 엣지를 상대 좌표로 변환하여 저장
    const mapData = {
      mapName,
      nodes: nodes.map(node => ({
        ...node,
        x: node.x / canvasSize.width,
        y: node.y / canvasSize.height,
      })),
      edges: edges.map(edge => ({
        start: {
          ...edge.start,
          x: edge.start.x / canvasSize.width,
          y: edge.start.y / canvasSize.height,
        },
        end: {
          ...edge.end,
          x: edge.end.x / canvasSize.width,
          y: edge.end.y / canvasSize.height,
        }
      })),
    };
  
    formData.append('mapData', JSON.stringify(mapData));
  
    try {
      const response = await fetch('http://141.164.61.77:3331/upload', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Upload success:', result);
        alert('Upload successful');
        
        // 맵 목록을 업데이트합니다.
        await fetchMapList(setMapList);
        
        // 모달을 닫습니다.
        handleClose();
      } else {
        console.error('Upload failed');
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading data:', error);
      alert('Error uploading data');
    }
  };
  useEffect(() => {
    if (isEditingExistingMap && activeStep === 2 && previewCanvasRef.current) {
      renderCanvasForStep3();
    }
  }, [isEditingExistingMap, activeStep, nodes, edges]);

  useEffect(() => {
    if (selectedMapFile) {
      loadMapData(selectedMapFile);
    }
  }, [selectedMapFile]);
  const handleBackgroundImageChange = (event) => {
    const file = event.target.files[0];
    setBackgroundImage(file);
  };
  const handleSmapDataFileChange = (event) => {
    const file = event.target.files[0];
    setSmapDataFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        setSmapData(data);
      } catch (error) {
        console.error('Invalid SMAP file format', error);
      }
    };
    reader.readAsText(file);
  };
  const renderCanvasForStep2 = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imgRef.current) {
      ctx.drawImage(imgRef.current, 0, 0, rect.width, rect.height);
    }

    if (smapData) {
      const canvasSize = { width: rect.width, height: rect.height };
      drawSmapData(ctx, smapState, smapData, canvasSize);
    }
  };
  const renderCanvasForStep3 = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imgRef.current) return;
  
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
  
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    const imgWidth = imgRef.current.width;
    const imgHeight = imgRef.current.height;
    const scale = Math.min(canvasSize.width / imgWidth, canvasSize.height / imgHeight);
    const xOffset = (canvasSize.width - imgWidth * scale) / 2;
    const yOffset = (canvasSize.height - imgHeight * scale) / 2;
  
    ctx.drawImage(imgRef.current, xOffset, yOffset, imgWidth * scale, imgHeight * scale);
  
    renderNodesAndEdges(ctx);
  };
  const renderNodesAndEdges = (ctx) => {
    const nodeBaseSize = 30; 
    const nodeSize = nodeBaseSize * (canvasSize.width / 1200);
    const cornerRadius = nodeSize / 3; 
  
    ctx.lineWidth = 4 * (canvasSize.width / 1200);
    ctx.strokeStyle = '#888';
    edges.forEach((edge) => {
      ctx.beginPath();
      ctx.moveTo(edge.start.x, edge.start.y);
      ctx.lineTo(edge.end.x, edge.end.y);
      ctx.stroke();
      ctx.closePath();
    });
  
    nodes.forEach((node) => {
      ctx.beginPath();
      const centerX = node.x - nodeSize / 2;
      const centerY = node.y - nodeSize / 2;
  
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
  
      ctx.moveTo(centerX + cornerRadius, centerY);
      ctx.lineTo(centerX + nodeSize - cornerRadius, centerY);
      ctx.quadraticCurveTo(centerX + nodeSize, centerY, centerX + nodeSize, centerY + cornerRadius);
      ctx.lineTo(centerX + nodeSize, centerY + nodeSize - cornerRadius);
      ctx.quadraticCurveTo(centerX + nodeSize, centerY + nodeSize, centerX + nodeSize - cornerRadius, centerY + nodeSize);
      ctx.lineTo(centerX + cornerRadius, centerY + nodeSize);
      ctx.quadraticCurveTo(centerX, centerY + nodeSize, centerX, centerY + nodeSize - cornerRadius);
      ctx.lineTo(centerX, centerY + cornerRadius);
      ctx.quadraticCurveTo(centerX, centerY, centerX + cornerRadius, centerY);
  
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.closePath();
  
      ctx.shadowColor = 'transparent';
    });
  };
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        if (activeStep === 2) {
          renderCanvasForStep3();
        }
      };
      img.src = URL.createObjectURL(backgroundImage);
    }
  }, [backgroundImage, activeStep]);
  useEffect(() => {
    if (activeStep === 2 && previewCanvasRef.current && imgRef.current) {
      renderCanvasForStep3();
    }
  }, [activeStep, nodes, edges, previewNode, imgRef.current]);
  const drawRoundedRect = (ctx, x, y, width, height, radius, color) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  };
  useEffect(() => {
    if (activeStep === 1 && canvasRef.current) {
      setupCanvasInteractionsForStep2();
      renderCanvasForStep2();
    } else if (activeStep === 2 && previewCanvasRef.current) {
      renderCanvasForStep3();
    }
    return () => {
      clearCanvasListeners();
    };
  }, [activeStep, smapState, nodes, edges]);

  useEffect(() => {
    fetchMapList();
  }, []);
  const setupCanvasInteractionsForStep2 = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleCanvasScrollForStep2);
      canvas.addEventListener('mousedown', handleCanvasDragStartForStep2);
      canvas.addEventListener('mouseup', handleCanvasDragEndForStep2);
      canvas.addEventListener('mousemove', handleCanvasDragForStep2);
    }
  };
  const clearCanvasListeners = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.removeEventListener('wheel', handleCanvasScrollForStep2);
      canvas.removeEventListener('mousedown', handleCanvasDragStartForStep2);
      canvas.removeEventListener('mouseup', handleCanvasDragEndForStep2);
      canvas.removeEventListener('mousemove', handleCanvasDragForStep2);
    }
  };
  const handleMapDelete = async (mapFileName) => {
    const confirmDelete = window.confirm('정말로 이 맵을 삭제하시겠습니까?');
    if (!confirmDelete) return;
  
    try {
      const response = await fetch(`http://141.164.61.77:3331/maps/${mapFileName}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setMapList(mapList.filter(map => map !== mapFileName));
        alert('맵이 성공적으로 삭제되었습니다.');
      } else {
        console.error('Failed to delete map');
        alert('맵 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting map:', error);
      alert('맵 삭제 중 오류가 발생했습니다.');
    }
  };
  const handleCanvasScrollForStep2 = (event) => {
    event.preventDefault();
    setSmapState((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale + event.deltaY * -0.001, 0.1), 5),
    }));
  };
  const handleCanvasDragStartForStep2 = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };
  const handleCanvasDragForStep2 = (event) => {
    if (!dragStartRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const deltaX = (currentX - dragStartRef.current.x) / smapState.scale;
    const deltaY = (currentY - dragStartRef.current.y) / smapState.scale;

    setSmapState((prev) => ({
      ...prev,
      position: {
        x: prev.position.x + deltaX,
        y: prev.position.y + deltaY,
      },
    }));
    dragStartRef.current = { x: currentX, y: currentY };
  };
  const handleCanvasDragEndForStep2 = () => {
    dragStartRef.current = null;
  };
  const handleCanvasDoubleClick = (event) => {
    const rect = previewCanvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (selectedNode) {
      const newNode = { id: nodes.length + 1, x, y, color: 'red' };
      setNodes((prevNodes) => [...prevNodes, newNode]);

      const newEdge = { start: selectedNode, end: newNode };
      setEdges((prevEdges) => [...prevEdges, newEdge]);

      setSelectedNode(newNode);
    } else {
      const newNode = { id: nodes.length + 1, x, y, color: 'red' };
      setNodes((prevNodes) => [...prevNodes, newNode]);
      setSelectedNode(newNode);
    }
  };
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#888';
    edges.forEach((edge) => {
      ctx.beginPath();
      ctx.moveTo(edge.start.x, edge.start.y);
      ctx.lineTo(edge.end.x, edge.end.y);
      ctx.stroke();
    });

    const nodeSize = 30;
    const cornerRadius = 10;

    nodes.forEach((node) => {
      drawRoundedRect(ctx, node.x - nodeSize / 2, node.y - nodeSize / 2, nodeSize, nodeSize, cornerRadius, node.color);
    });

    if (previewNode) {
      drawRoundedRect(ctx, previewNode.x - nodeSize / 2, previewNode.y - nodeSize / 2, nodeSize, nodeSize, cornerRadius, 'rgba(0, 0, 255, 0.5)');
    }
  };
  useEffect(() => {
    renderCanvasForStep3();
  }, [nodes, edges, previewNode]);

  useEffect(() => {
    renderCanvas();
  }, [nodes, edges, previewNode]);

  //------
  const calculateDataBounds = (smapData) => {
    const { minPos, maxPos } = smapData.header;
    return { width: maxPos.x - minPos.x, height: maxPos.y - minPos.y };
  };
  
  const drawSmapData = (ctx, state, smapData, canvasSize) => {
    if (smapData && smapData.normalPosList) {
      ctx.save();
  
      const bounds = calculateDataBounds(smapData);
      const scaleX = canvasSize.width / bounds.width;
      const scaleY = canvasSize.height / bounds.height;
      const scale = Math.min(scaleX, scaleY) * 0.8;
  
      const center = { x: bounds.width / 2, y: bounds.height / 2 };
  
      ctx.translate(canvasSize.width / 2, canvasSize.height / 2);
  
      ctx.rotate((state.rotation * Math.PI) / 180);
      ctx.scale(state.scale * scale, state.scale * scale);
  
      ctx.translate(-center.x + state.position.x, -center.y + state.position.y);
  
      ctx.fillStyle = 'red';
      smapData.normalPosList.forEach((point) => {
        const x = point.x;
        const y = point.y;
        ctx.fillRect(x, y, 4 / scale, 4 / scale);
      });
  
      ctx.restore();
    }
  };
  


// useEffect(() => {
//   if (isEditingExistingMap && activeStep === 2 && previewCanvasRef.current) {
//     renderCanvasForStep3();
//   }
// }, [isEditingExistingMap, activeStep, nodes, edges]);
// useEffect(() => {
//   if (selectedMapFile) {
//     loadMapData(selectedMapFile);
//   }
// }, [selectedMapFile]);


  

// useEffect 의존성 배열에 imgRef 추가
// useEffect(() => {
//   if (backgroundImage) {
//       const img = new Image();
//       img.onload = () => {
//           console.log('Image loaded:', img);
//           imgRef.current = img;
//           if (activeStep === 2) {
//               renderCanvasForStep3(); // 3단계 모달에 이미지 렌더링
//           }
//       };
//       img.src = URL.createObjectURL(backgroundImage);
//   }
// }, [backgroundImage, activeStep]);

// useEffect(() => {
//   if (activeStep === 2 && previewCanvasRef.current && imgRef.current) {
//     renderCanvasForStep3();
//   }
// }, [activeStep, nodes, edges, previewNode, imgRef.current]);
  

  

  // useEffect(() => {
  //   if (activeStep === 1 && canvasRef.current) {
  //     setupCanvasInteractionsForStep2();
  //     renderCanvasForStep2();
  //   } else if (activeStep === 2 && previewCanvasRef.current) {
  //     renderCanvasForStep3();
  //   }
  //   return () => {
  //     clearCanvasListeners();
  //   };
  // }, [activeStep, smapState, nodes, edges]);
  // useEffect(() => {
  //   const fetchMapList = async () => {
  //     try {
  //       const response = await fetch('http://141.164.61.77:3331/maps');
  //       if (response.ok) {
  //         const mapFiles = await response.json();
  //         setMapList(mapFiles);
  //       } else {
  //         console.error('Failed to fetch map list');
  //       }
  //     } catch (error) {
  //       console.error('Error fetching map list:', error);
  //     }
  //   };
  
  //   fetchMapList();
  // }, []);


  // useEffect(() => {
  //   renderCanvasForStep3();
  // }, [nodes, edges, previewNode]);

  // useEffect(() => {
  //   renderCanvas();
  // }, [nodes, edges, previewNode]);


  return (
    <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={styles.title}>맵 편집하기</h1>
            <Button variant="contained" style={styles.button} onClick={handleOpen}>
                새로 생성하기
            </Button>
        </div>
        <div>
            <h2>저장된 맵 목록</h2>
            <ul>
  {mapList.map((mapFile, index) => (
    <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
      <span style={{ flexGrow: 1 }}>{mapFile}</span>
      <Button
        variant="contained"
        onClick={() => handleMapClick(mapFile)}
        style={{ marginLeft: '10px' }}
      >
        로드
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => handleMapDelete(mapFile)}
        style={{ marginLeft: '10px' }}
      >
        삭제
      </Button>
    </li>
  ))}
</ul>

            <MapViewModal open={openModal} onClose={() => setOpenModal(false)} mapFileName={selectedMapFile} />
        </div>
        <Modal
            open={open}
            onClose={handleClose}
            sx={{ backdropFilter: 'blur(10px)' }}
        >
            <Box sx={[
                styles.modalBox,
                activeStep === 1 && styles.modalBoxMedium,
                activeStep === 2 && styles.modalBoxLarge,
            ]}>
                <Box sx={styles.titleBox}>
                    <Typography sx={styles.modalTitle}>{steps[activeStep]}</Typography>
                    <IconButton onClick={handleClose} sx={styles.closeButton}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: activeStep === 2 ? 'row' : 'column' }}>
                    {activeStep === 0 && (
                        <div>
                            <InputLabel sx={styles.inputLabel}>맵 이름</InputLabel>
                            <TextField
                                fullWidth
                                variant="outlined"
                                value={mapName}
                                onChange={(e) => setMapName(e.target.value)}
                                sx={styles.textField}
                            />
                            <InputLabel sx={styles.inputLabel}>배경 이미지</InputLabel>
                            <div style={styles.fileInputContainer}>
                                <Button variant="contained" component="label" sx={styles.fileInputButton}>
                                    파일 선택
                                    <input type="file" hidden onChange={handleBackgroundImageChange} />
                                </Button>
                                {backgroundImage && (
                                    <Typography sx={styles.fileName}>{backgroundImage.name}</Typography>
                                )}
                            </div>
                            <InputLabel sx={styles.inputLabel}>Smap 데이터 파일</InputLabel>
                            <div style={styles.fileInputContainer}>
                                <Button variant="contained" component="label" sx={styles.fileInputButton}>
                                    파일 선택
                                    <input type="file" hidden onChange={handleSmapDataFileChange} />
                                </Button>
                                {smapDataFile && (
                                    <Typography sx={styles.fileName}>{smapDataFile.name}</Typography>
                                )}
                            </div>
                        </div>
                    )}
                    {activeStep === 1 && (
                        <div style={styles.canvasContainer}>
                            <canvas ref={canvasRef} style={styles.canvas}></canvas>
                            <Box sx={styles.sliderContainer}>
                                <Typography variant="caption" sx={styles.sliderLabel}>
                                    회전
                                </Typography>
                                <Slider
                                    value={smapState.rotation}
                                    onChange={(e, newValue) => setSmapState((prev) => ({ ...prev, rotation: newValue }))}
                                    min={0}
                                    max={360}
                                    sx={styles.slider}
                                />
                            </Box>
                        </div>
                    )}
                    {activeStep === 2 && (
                        <>
                            <Box sx={styles.previewArea}>
                                <canvas
                                    ref={previewCanvasRef}
                                    style={{ width: '100%', height: '100%', border: '1px solid black' }}
                                    onDoubleClick={handleDoubleClick}
                                    onMouseMove={handleMouseMove}
                                />
                            </Box>
                            <Box sx={styles.toolsContainer}>
                                <Button sx={styles.toolButton} onClick={() => setSelectedNode(null)}>
                                    노드 선택 해제
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
                <Box sx={styles.controlButtons}>
                    <Button variant="contained" disabled={activeStep === 0} onClick={handleBack} sx={styles.backButton}>
                        이전
                    </Button>
                    <Stepper activeStep={activeStep} alternativeLabel sx={styles.stepper}>
                        {steps.map((label, index) => (
                            <Step key={index}>
                                <StepLabel></StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    <Button variant="contained" onClick={handleNext} sx={styles.nextButton}>
                        {activeStep === steps.length - 1 ? (
                            <span onClick={handleUpload}>완료</span>
                        ) : (
                            '다음'
                        )}
                    </Button>
                </Box>
            </Box>
        </Modal>
    </div>
);
};


export default MapEditor;
