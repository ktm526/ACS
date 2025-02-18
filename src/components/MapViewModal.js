import React, { useEffect, useRef, useState } from 'react';
import { Modal, Box, IconButton, Typography, Grid, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from '../pages/mapeditor_styles';

const GRID_SIZE = 50;
const BRAND_COLOR = 'rgba(231, 233, 100, 0.5)';
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const MapViewModal = ({ open, onClose, mapFileName }) => {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);
    const [loading, setLoading] = useState(false);  // 로딩 상태 초기화
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });

    // 맵 데이터를 불러오는 함수
    const loadMapData = async () => {
        try {
            setLoading(true); // 로딩 상태 설정
            setNodes([]);     // 초기화
            setEdges([]);     // 초기화
            setSelectedElement(null);  // 초기화
            imgRef.current = null;  // 이미지 초기화

            const response = await fetch(`${process.env.REACT_APP_NODE_SERVER_IP}/uploads/${mapFileName}`);
            if (response.ok) {
                const mapData = await response.json();

                const relativeNodes = mapData.nodes.map((node, index) => ({
                    ...node,
                    id: index,
                    x: node.x * canvasSize.width,
                    y: node.y * canvasSize.height,
                }));

                const relativeEdges = mapData.edges.map((edge, index) => ({
                    ...edge,
                    id: index,
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

                setNodes(relativeNodes);
                setEdges(relativeEdges);

                const img = new Image();
                img.onload = () => {
                    imgRef.current = img;
                    setLoading(false);  // 로딩 상태 해제
                    renderCanvas();
                };
                img.src =`${process.env.REACT_APP_NODE_SERVER_IP}/uploads/${mapData.imageFileName}`;
            } else {
                console.error('Failed to load map data');
                setLoading(false);  // 로딩 상태 해제
            }
        } catch (error) {
            console.error('Error loading map data:', error);
            setLoading(false);  // 로딩 상태 해제
        }
    };

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imgRef.current || loading) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasSize.width * dpr;
        canvas.height = canvasSize.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(imgRef.current, 0, 0, canvasSize.width, canvasSize.height);

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

            if (selectedElement?.type === 'node' && selectedElement?.id === node.id) {
                ctx.strokeStyle = BRAND_COLOR;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        if (selectedElement?.type === 'edge') {
            ctx.lineWidth = 2;
            ctx.strokeStyle = BRAND_COLOR;
            ctx.beginPath();
            ctx.moveTo(selectedElement.start.x, selectedElement.start.y);
            ctx.lineTo(selectedElement.end.x, selectedElement.end.y);
            ctx.stroke();
            ctx.closePath();
        }
    };

    const handleDoubleClick = (e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = (e.clientX - rect.left) * (canvasRef.current.width / (rect.width * dpr));
        const y = (e.clientY - rect.top) * (canvasRef.current.height / (rect.height * dpr));

        const clickedNode = nodes.find(node => {
            const nodeSize = 30 * (canvasSize.width / 1200);
            return x >= node.x - nodeSize / 2 && x <= node.x + nodeSize / 2 &&
                   y >= node.y - nodeSize / 2 && y <= node.y + nodeSize / 2;
        });

        if (clickedNode) {
            setSelectedElement({ type: 'node', id: clickedNode.id, ...clickedNode });
        } else {
            let closestEdge = null;
            let closestDistance = Number.MAX_SAFE_INTEGER;

            edges.forEach(edge => {
                const distance = Math.abs((edge.end.y - edge.start.y) * x - (edge.end.x - edge.start.x) * y + edge.end.x * edge.start.y - edge.end.y * edge.start.x) /
                                 Math.sqrt(Math.pow(edge.end.y - edge.start.y, 2) + Math.pow(edge.end.x - edge.start.x, 2));
                if (distance < closestDistance) {
                    closestEdge = edge;
                    closestDistance = distance;
                }
            });

            if (closestEdge && closestDistance < 5 * (canvasSize.width / 1200)) {
                setSelectedElement({ type: 'edge', id: closestEdge.id, ...closestEdge });
            } else {
                setSelectedElement(null);
            }
        }
    };

    const handleColorChange = (color) => {
        if (selectedElement?.type === 'node') {
            const updatedNodes = nodes.map(node => 
                node.id === selectedElement.id ? { ...node, color } : node
            );
            setNodes(updatedNodes);
            setSelectedElement(prev => ({ ...prev, color }));
        }
    };

    const handleEdgeTypeChange = (event) => {
        if (selectedElement?.type === 'edge') {
            const updatedEdges = edges.map(edge =>
                edge.id === selectedElement.id ? { ...edge, type: event.target.value } : edge
            );
            setEdges(updatedEdges);
            setSelectedElement(prev => ({ ...prev, type: event.target.value }));
        }
    };

    const handleSave = async () => {
        // 기존 포맷에 맞게 데이터 재구성
        const updatedMapData = {
            mapName: mapFileName.split('.')[0], // 파일명에서 맵 이름 추출
            imageFileName: imgRef.current ? imgRef.current.src.split('/').pop() : '', // 이미지 파일명 설정
            nodes: nodes.map(node => ({
                ...node,
                x: node.x / canvasSize.width,
                y: node.y / canvasSize.height,
            })),
            edges: edges.map(edge => ({
                ...edge,
                start: {
                    x: edge.start.x / canvasSize.width,
                    y: edge.start.y / canvasSize.height,
                },
                end: {
                    x: edge.end.x / canvasSize.width,
                    y: edge.end.y / canvasSize.height,
                },
            })),
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_NODE_SERVER_IP}/uploads/${mapFileName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedMapData),
            });

            if (response.ok) {
                alert('Changes saved successfully');
                onClose();
            } else {
                console.error('Failed to save changes');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    useEffect(() => {
        if (open) {
            loadMapData();
        }
    }, [open, mapFileName]);

    useEffect(() => {
        if (!loading) {
            renderCanvas();
        }
    }, [nodes, edges, selectedElement, loading]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            sx={{ backdropFilter: 'blur(10px)' }}
        >
            <Box
                sx={{
                    ...styles.modalBoxLarge,
                    display: 'flex',
                    position: 'relative',
                    padding: '20px',
                }}
            >
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        color: '#E57373',
                        backgroundColor: 'transparent',
                        borderRadius: '50%',
                        padding: '2px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        '&:hover': {
                            backgroundColor: '#E57373',
                            color: 'white',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Box sx={{ flex: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            boxShadow: 'inset 0px 0px 10px rgba(0, 0, 0, 0.5)',
                        }}
                        onDoubleClick={handleDoubleClick}
                    />
                </Box>
                <Box
                    sx={{
                        marginLeft: '20px',
                        padding: '20px',
                        backgroundColor: '#2B2633',
                        borderRadius: '8px',
                        width: '300px',
                        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                        color: 'white',
                        flex: 1,
                    }}
                >
                    <Typography variant="h6" sx={{ marginBottom: '10px' }}>Element Info</Typography>
                    {selectedElement ? (
                        <>
                            <Typography variant="subtitle2">ID</Typography>
                            <Box sx={{ marginBottom: '10px', padding: '8px', backgroundColor: '#3C3A45', borderRadius: '4px' }}>
                                {selectedElement.id}
                            </Box>
                            {selectedElement.type === 'node' && (
                                <>
                                    <Typography variant="subtitle2">Coordinates</Typography>
                                    <Grid container spacing={2} sx={{ marginBottom: '10px' }}>
                                        <Grid item xs={6}>
                                            <Box sx={{ padding: '8px', backgroundColor: '#3C3A45', borderRadius: '4px' }}>
                                                X: {Math.round(selectedElement.x)}
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ padding: '8px', backgroundColor: '#3C3A45', borderRadius: '4px' }}>
                                                Y: {Math.round(selectedElement.y)}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    <Typography variant="subtitle2">Color</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#3C3A45', borderRadius: '4px' }}>
                                        {COLORS.map(color => (
                                            <Box
                                                key={color}
                                                onClick={() => handleColorChange(color)}
                                                sx={{
                                                    width: '20px',
                                                    height: '20px',
                                                    backgroundColor: color,
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    border: selectedElement.color === color ? `2px solid ${BRAND_COLOR}` : '2px solid transparent',
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </>
                            )}
                            {selectedElement.type === 'edge' && (
                                <>
                                    <Typography variant="subtitle2">Type</Typography>
                                    <FormControl fullWidth sx={{ marginBottom: '10px' }}>
                                        <InputLabel sx={{ color: 'white' }}>Type</InputLabel>
                                        <Select
                                            value={selectedElement.type}
                                            onChange={handleEdgeTypeChange}
                                            sx={{ color: 'white', backgroundColor: '#3C3A45', borderRadius: '4px' }}
                                        >
                                            <MenuItem value="unidirectional">Unidirectional</MenuItem>
                                            <MenuItem value="bidirectional">Bidirectional</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Typography variant="subtitle2">Start Node</Typography>
                                    <Box sx={{ marginBottom: '10px', padding: '8px', backgroundColor: '#3C3A45', borderRadius: '4px' }}>
                                        {selectedElement.start.id}
                                    </Box>
                                    <Typography variant="subtitle2">End Node</Typography>
                                    <Box sx={{ marginBottom: '10px', padding: '8px', backgroundColor: '#3C3A45', borderRadius: '4px' }}>
                                        {selectedElement.end.id}
                                    </Box>
                                </>
                            )}
                        </>
                    ) : (
                        <Typography>No element selected</Typography>
                    )}
                    <Button
                        onClick={handleSave}
                        sx={{
                            marginTop: '20px',
                            width: '100%',
                            backgroundColor: '#E7E964',
                            color: '#2B2633',
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: '#D4D455',
                            },
                        }}
                    >
                        Save
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default MapViewModal;
