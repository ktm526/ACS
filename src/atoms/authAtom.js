import { atom } from 'jotai';

// 초기값: 로컬 스토리지에서 읽기
const authAtom = atom(
  localStorage.getItem('auth') === 'true', // 초기값 설정
  (get, set, newValue) => {
    // 상태 업데이트 및 로컬 스토리지 동기화
    localStorage.setItem('auth', newValue ? 'true' : 'false');
    set(authAtom, newValue);
  }
);

export { authAtom };
