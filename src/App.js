import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import Sidebar from './components/Sidebar';
import Main from './pages/Main/Main';
import MapEditor from './pages/MapEditor/MapEditor';
import Simulation from './pages/Simulation/Simulation';
import StreamingOverview from './pages/StreamingOverview';
import DataAnalysis from './pages/DataAnalysis/DataAnalysis';
import Settings from './pages/Settings/SettingsPage';
import Login from './pages/Login';
import InitTest from './pages/InitTest/InitTest';
import TaskRobotPage from './pages/TaskRobotPage/TaskRobotPage';
import { authAtom } from './atoms/authAtom';

const App = () => {
  const [isAuthenticated, setAuth] = useAtom(authAtom); // 상태 및 업데이트 함수
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 로그아웃 상태에서도 localStorage를 읽어 상태 복원
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('auth') === 'true';
    setAuth(isLoggedIn); // 상태 복원
  }, [setAuth]);

  // 스타일 상수
  const sidebarWidth = isSidebarOpen ? '320px' : '60px';
  const mainContainerStyle = {
    flexGrow: 1,
    backgroundColor: '#2B2633',
    color: 'white',
    padding: '16px',
    marginLeft: sidebarWidth,
    transition: 'margin-left 0.3s ease',
  };

  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 */}
        <Route
          path="/login"
          element={
            <div className="login-container">
              <Login />
            </div>
          }
        />

        {/* 인증된 사용자 라우트 */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <div style={{ display: 'flex' }}>
                {/* 사이드바 */}
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

                {/* 메인 컨텐츠 */}
                <main style={mainContainerStyle}>
                  <Routes>
                    <Route path="/" element={<Main />} />
                    <Route path="/map-editor" element={<MapEditor />} />
                    <Route path="/simulation" element={<Simulation />} />
                    <Route path="/streaming-overview" element={<StreamingOverview />} />
                    <Route path="/data-analysis" element={<DataAnalysis />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/init-test" element={<InitTest />} />
                    <Route path="/tasks-and-robots" element={<TaskRobotPage />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
