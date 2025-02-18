import React, { useState } from 'react';
import { TextField, Button, IconButton, Dialog } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MapViewer from './MapViewer';
import styles from './MapUploadModal.module.css';

const MapUploadModal = ({ onClose }) => {
  const [mapName, setMapName] = useState('');
  const [fileData, setFileData] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.smap')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileData(JSON.parse(e.target.result));
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid .smap file.');
    }
  };

  const handleSubmit = () => {
    if (!mapName || !fileData) {
      alert('Please enter a map name and upload a valid file.');
      return;
    }
    setViewerOpen(true);
  };

  return (
    <div>
      <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} maxWidth="md">
        {/* mapName과 fileData를 MapViewer로 전달 */}
        <MapViewer fileData={fileData} mapName={mapName} />
      </Dialog>
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.titleBox}>
            <h3 className={styles.modalTitle}>.smap 파일 업로드</h3>
            <IconButton className={styles.closeButton} onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <TextField
            label="맵 이름 입력"
            variant="outlined"
            fullWidth
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            className={styles.textInput}
          />
          <div className={styles.fileInputContainer}>
            <label htmlFor="file-upload" className={styles.fileInputLabel}>
              파일 선택
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".smap"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            <span className={styles.fileName}>{fileData ? '파일 업로드 완료' : '선택된 파일 없음'}</span>
          </div>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            className={styles.submitButton}
          >
            업로드
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapUploadModal;
