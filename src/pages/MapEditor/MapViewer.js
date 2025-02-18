import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from './MapViewer.module.css';

const MapViewer = ({ fileData, mapName, obstacles = [] }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [rectangles, setRectangles] = useState([]);
  const [tool, setTool] = useState(null);

  console.log('Received obstacles in mapviewer:', obstacles);

  // 사각형 그리기 함수
  const drawRectangle = useCallback((start, end, ctx = canvasRef.current.getContext('2d')) => {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  }, []);

  // 원 그리기 함수
  const drawCircle = useCallback((x, y, color, ctx) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // 텍스트 그리기 함수
  const drawText = useCallback((text, x, y, ctx) => {
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.fillText(text, x, y);
  }, []);

  // 선 그리기 함수
  const drawLine = useCallback((x1, y1, x2, y2, color, ctx) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }, []);

  // 장애물 표시 함수
  // 장애물 표시 함수 수정
const drawObstacles = useCallback(
  (ctx, scaleX, scaleY, canvasHeight, minX, minY) => {
    if (!obstacles || obstacles.length === 0) {
      console.log('No obstacles to draw');
      return;
    }

    obstacles.forEach((obstacle) => {
      // 꼭짓점 정보를 계산
      const vertices = obstacle.objects?.reduce(
        (acc, edge) => {
          const startX = Number(edge.start_x);
          const startY = Number(edge.start_y);
          const endX = Number(edge.end_x);
          const endY = Number(edge.end_y);

          return {
            minX: Math.min(acc.minX, startX, endX),
            minY: Math.min(acc.minY, startY, endY),
            maxX: Math.max(acc.maxX, startX, endX),
            maxY: Math.max(acc.maxY, startY, endY),
          };
        },
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      );

      if (!vertices) return;

      const startX = (vertices.minX - minX) * scaleX;
      const startY = canvasHeight - (vertices.maxY - minY) * scaleY;
      const endX = (vertices.maxX - minX) * scaleX;
      const endY = canvasHeight - (vertices.minY - minY) * scaleY;

      console.log('Drawing rectangle with vertices:', {
        startX,
        startY,
        endX,
        endY,
      });

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    });
  },
  [obstacles]
);


  // 맵 시각화 함수
  const visualizeMap = useCallback(
    (data, ctx, canvas) => {
      if (!data || !data.header) return;
  
      const { minPos, maxPos } = data.header;
      const scaleX = canvas.width / (maxPos.x - minPos.x);
      const scaleY = canvas.height / (maxPos.y - minPos.y);
  
      data.normalPosList?.forEach((pos) => {
        const x = (pos.x - minPos.x) * scaleX;
        const y = canvas.height - (pos.y - minPos.y) * scaleY;
        drawCircle(x, y, 'blue', ctx);
      });
  
      data.advancedPointList?.forEach((point) => {
        const x = (point.pos.x - minPos.x) * scaleX;
        const y = canvas.height - (point.pos.y - minPos.y) * scaleY;
        drawCircle(x, y, 'green', ctx);
        drawText(point.instanceName, x, y - 10, ctx);
      });
  
      data.advancedLineList?.forEach((line) => {
        const startX = (line.line.startPos.x - minPos.x) * scaleX;
        const startY = canvas.height - (line.line.startPos.y - minPos.y) * scaleY;
        const endX = (line.line.endPos.x - minPos.x) * scaleX;
        const endY = canvas.height - (line.line.endPos.y - minPos.y) * scaleY;
        drawLine(startX, startY, endX, endY, 'green', ctx);
      });
  
      // 장애물 표시
      drawObstacles(ctx, scaleX, scaleY, canvas.height, minPos.x, minPos.y);
    },
    [drawCircle, drawText, drawLine, drawObstacles]
  );
  

  // 캔버스에 맵과 사각형을 그리기
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    visualizeMap(fileData, ctx, canvas);

    rectangles.forEach((rect) => {
      drawRectangle(rect.start, rect.end, ctx);
    });
  }, [fileData, rectangles, visualizeMap, drawRectangle]);

  // 마우스 이벤트 처리
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'rectangle') {
      setIsDrawing(true);
      setStartPos({ x, y });
    } else if (tool === 'eraser') {
      const clickedRectangleIndex = rectangles.findIndex(
        (rect) => x >= rect.start.x && x <= rect.end.x && y >= rect.start.y && y <= rect.end.y
      );
      if (clickedRectangleIndex !== -1) {
        const newRectangles = [...rectangles];
        newRectangles.splice(clickedRectangleIndex, 1);
        setRectangles(newRectangles);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || tool !== 'rectangle') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawMap();
    drawRectangle(startPos, { x, y });
  };

  const handleMouseUp = (e) => {
    if (isDrawing && tool === 'rectangle') {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRectangle = { start: startPos, end: { x, y } };
      setRectangles([...rectangles, newRectangle]);
      setIsDrawing(false);
    }
  };

  // 맵 및 장애물 데이터 렌더링
  useEffect(() => {
    if (fileData || obstacles.length > 0) {
      drawMap();
    }
  }, [fileData, obstacles, drawMap]);

  return (
    <div className={styles.container}>
      <div className={styles.viewerWrapper}>
        <canvas
          ref={canvasRef}
          width="600"
          height="600"
          className={tool === 'eraser' ? styles.canvasEraser : styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
        <div className={styles.toolbox}>
          <h3 className={styles.toolboxTitle}>금지 구역</h3>
          <button className={styles.toolButton} onClick={() => setTool('rectangle')}>
            추가
          </button>
          <button className={styles.toolButton} onClick={() => setTool('eraser')}>
            삭제
          </button>
          <button
            className={`${styles.toolButton} ${styles.saveButton}`}
            onClick={() => alert('맵 저장')}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapViewer;
