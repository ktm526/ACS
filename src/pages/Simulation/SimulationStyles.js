const styles = {
  container: {
    backgroundColor: '#2B2633',
    minHeight: '100vh',
    color: 'white',
    padding: '20px 40px',
    boxSizing: 'border-box',
    zIndex: '-100',
  },
  title: {
    fontSize: '21px',
    fontWeight: '600',
    fontFamily: 'Pretendard, sans-serif',
    textAlign: 'left',
    marginBottom: '20px',
  },
  canvasContainer: {
    position: 'relative',
    border: '1px solid #59575E',
    borderRadius: '6pt',
    overflow: 'hidden',
    width: '1200px', // 기본적으로 사이드바 접힘 상태의 너비
    height: '800px',
    backgroundColor: '#2B2633',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'width 0.3s ease',
  },
  canvas: {
    width: '1200', // Simulation 너비보다 약간 작게 설정
    height: '800', // 컨테이너의 높이를 가득 채움
    //display: 'block',
  },
  
  controlsContainer: {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '10pt',
    backgroundColor: 'rgba(77,75,80,0.7)',
    borderRadius: '10pt',
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)',
    zIndex: 2,
    height: '30px'
  },
  iconButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  iconButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    marginLeft: '4px',
    marginRight: '-6px'
  },
  iconImage: {
    width: '16px',
    height: '16px',
  },
  speedControl: {
    width: '12px',
    height: '12px',
  },
  divider: {
    height: '30px',
    width: '1px',
    backgroundColor: '#707070',
    margin: '0 10px',
  },
  speedControlContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginRight: '10px'
  },
  speedDisplay: {
    color: 'white',
    fontSize: '14px',
    textAlign: 'middle',
    marginLeft: '10px'
  },
  speedButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
  },
  speedIcon: {
    width: '12pt',
    height: '12pt',
  },
  speedDropdown: {
    backgroundColor: 'rgba(43, 38, 51, 0.8)',
    color: 'white',
    border: '1px solid #59575E',
    borderRadius: '4px',
    fontSize: '12px',
    padding: '5px',
    cursor: 'pointer',
  },
  dropdownMenu: {
    position: 'absolute',
    right: '20px',
    top: '20px',
    width: '120px',
    //margin: '10px 0', // 간격 조정
    backgroundColor: 'rgba(89, 87, 94, 0.7)',
    color: 'white',
    padding: '5px',
    borderRadius: '4px',
    border: '1px solid #59575E',
    fontSize: '14px',
  },
  settingsContainer: {
    position: 'absolute',
    top: '10px',
    right: '20px',
    zIndex: 1,
    width: '220px', // 패널 전체 폭 설정
  },
  settingsToggle: {
    width: '100%',
    backgroundColor: 'rgba(89, 87, 94, 0.7)',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #59575E',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  settingsPanel: {
    backgroundColor: 'rgba(43, 38, 51, 0.8)',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #59575E',
    marginTop: '10px',
    height: 'calc(100% - 40px)', // 캔버스 높이와 맞추어 패널 높이를 설정
    maxHeight: '800px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between', // 버튼을 하단에 배치
    overflowY: 'auto',
    transition: 'max-height 0.3s ease',
  },
  createSimulationButton: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    alignSelf: 'center',
  },
  
};

export default styles;
