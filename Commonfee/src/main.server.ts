// ฝั่ง SSR บางเวอร์ชันของ Node (22+) ไม่มี localStorage ให้ใช้ ทำให้โค้ดที่เรียก localStorage.getItem ตอนเรนเดอร์พัง
// จึงใส่ตัวแทนที่ไม่เก็บค่าอะไรไว้ (ฝั่งเบราว์เซอร์ไม่ได้ผ่านไฟล์นี้ จึงใช้ localStorage จริงตามปกติ)
const g = globalThis as any;
let hasStorage = false;
try {
  hasStorage = typeof g.localStorage !== 'undefined' && typeof g.localStorage.getItem === 'function';
} catch {
  hasStorage = false;
}
if (!hasStorage) {
  Object.defineProperty(g, 'localStorage', {
    configurable: true,
    value: { getItem: (): string | null => null, setItem: (): void => {}, removeItem: (): void => {}, clear: (): void => {}, key: (): string | null => null, length: 0 },
  });
}

export { AppServerModule as default } from './app/app.module.server';
