import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { useSetAtom } from 'jotai';
import { authAtom } from '../atoms/authAtom';
import { ReactComponent as HomeIcon } from '../assets/home.svg';
import { ReactComponent as MapIcon } from '../assets/map.svg';
import { ReactComponent as DataAnalysisIcon } from '../assets/dataanalysis.svg';
import { ReactComponent as SettingsIcon } from '../assets/settings.svg';
import { ReactComponent as LogoutIcon } from '../assets/logout.svg';
import { ReactComponent as ListIcon } from '../assets/list.svg';
import imroboticsLogo from '../assets/imrobotics_logo.png';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const [textVisible, setTextVisible] = useState(isOpen);
  const setAuth = useSetAtom(authAtom);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setTextVisible(true), 200);
    } else {
      setTextVisible(false);
    }
  }, [isOpen]);

  const menuItems = [
    { text: '메인 모니터링', icon: <HomeIcon />, path: '/' },
    { text: '맵 편집하기', icon: <MapIcon />, path: '/map-editor' },
    { text: '데이터 분석', icon: <DataAnalysisIcon />, path: '/data-analysis' },
    { text: '설정', icon: <SettingsIcon />, path: '/settings' },
    { text: '작업 목록', icon: <ListIcon />, path: '/tasks-and-robots' },
  ];

  const handleLogout = () => {
    const confirmLogout = window.confirm('로그아웃 하시겠습니까?');
    if (confirmLogout) {
      setAuth(false);
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
  };

  return (
    <div
      style={{
        width: isOpen ? '320px' : '60px',
        height: '100vh',
        backgroundColor: '#4D4B50',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '10px',
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 0,
        boxShadow: '2px 0 5px rgba(0, 0, 0, 0.5)',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
      onClick={toggleSidebar} // 빈 영역 클릭 시 접기/열기
    >
      {/* 빈 영역 클릭 시 접기/열기를 위해 stopPropagation 추가 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60px',
        }}
        onClick={(e) => e.stopPropagation()} // 이벤트 전파 방지
      >
        <img
          src={imroboticsLogo}
          alt="IMRobotics Logo"
          style={{
            height: '30px',
            transition: 'opacity 0.2s ease',
            opacity: isOpen ? 1 : 0,
          }}
        />
      </div>

      {/* 메뉴 아이템 */}
      <List>
  {menuItems.map((item) => (
    <ListItem
      button
      key={item.text}
      component={Link}
      to={item.path}
      style={{
        backgroundColor: location.pathname === item.path ? '#2B2633' : 'transparent',
        color: 'white',
        marginBottom: '10px',
        borderRadius: '10px',
        padding: '10px 5px',
        fontWeight: 400,
        letterSpacing: '-0.25px',
        display: 'flex',
        alignItems: 'center',
      }}
      onClick={(e) => e.stopPropagation()} // 이벤트 전파 방지
    >
      <ListItemIcon
        style={{
          color: 'inherit',
          minWidth: '40px',
        }}
      >
        {item.icon}
      </ListItemIcon>
      {/* 텍스트 컨테이너 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexGrow: 1,
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {item.text}
      </div>
    </ListItem>
  ))}
</List>


      {/* 로그아웃 버튼 */}
      <div onClick={(e) => e.stopPropagation()}> {/* 이벤트 전파 방지 */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleLogout();
    }}
    style={{
      padding: '10px',
      width: '100%',
      height: '40px',
      cursor: 'pointer',
      backgroundColor: '#2B2633',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: isOpen ? 'center' : 'flex-start', // 확장 시 가운데 정렬
      fontFamily: 'Pretendard, sans-serif',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
    }}
  >
    {/* 아이콘 */}
    <LogoutIcon
      style={{
        transition: 'all 0s ease',
      }}
    />

    {/* 텍스트 */}
    <span
      style={{
        marginLeft: '10px',
        display: isOpen? 'block':'none',
        opacity: isOpen ? 1 : 0, // 텍스트 투명도 조절
        visibility: isOpen ? 'visible' : 'hidden', // 텍스트가 보이지 않도록 설정
        transition: 'opacity 0.3s ease, visibility 0.3s ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      로그아웃
    </span>
  </button>
</div>





    </div>
  );
};

export default Sidebar;
