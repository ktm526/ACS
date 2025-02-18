import { atom } from 'jotai';
import { io } from 'socket.io-client';

const serverIp = process.env.REACT_APP_NODE_SERVER_IP;

// Socket.IO 클라이언트 인스턴스 아톰
export const socketAtom = atom(() => {
  const socket = io(serverIp);
  return socket;
});

// 서버로부터 받은 데이터를 관리하는 아톰
export const dataAtom = atom([]);
export const modeAtom = atom('');
export const batteryLevelAtom = atom(50);

// 클라이언트 목록을 전역 상태로 관리하는 아톰
export const clientsAtom = atom({});
