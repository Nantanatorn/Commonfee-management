// ข้อมูลผังหมู่บ้าน (พิกัด SVG) — แปลงบ้านถูกคำนวณจากแนวถนน เพื่อให้หันหน้าเข้าถนนเสมอ

export interface Box { x: number; y: number; w: number; h: number; }

export interface VillageLot {
  n: number;                 // เลขบ้าน (House_No)
  transform: string;         // ย้ายและหมุนไปตามแนวถนน
  plot: Box;                 // ที่ดินทั้งแปลง
  home: Box;                 // ตัวบ้าน (ระบายสีตามสถานะ)
  drive: Box;                // ทางเข้าบ้าน
  ridge: { x1: number; y1: number; x2: number; y2: number };
  labelTransform: string;    // หมุนกลับให้เลขบ้านตั้งตรงเสมอ
  fontSize: number;
}

export interface VillageArea extends Box {
  fill: string;
  label?: string;
  color?: string;
  rx?: number;
}

export interface VillageLayout {
  width: number;
  height: number;
  roads: string[];                                   // path ของถนน
  culdesac: { cx: number; cy: number; r: number }[];
  areas: VillageArea[];
  ponds: { cx: number; cy: number; rx: number; ry: number }[];
  trees: { x: number; y: number; r: number }[];
  lots: VillageLot[];
}

const ROAD_HALF = 12;   // ครึ่งหนึ่งของความกว้างถนน
const VERGE = 4;        // ทางเท้าระหว่างถนนกับแปลงบ้าน

type Pt = [number, number];

function lane(p1: Pt, p2: Pt, side: 1 | -1, start: number, nums: number[],
              w: number, d: number, pitch: number, fontSize: number): VillageLot[] {
  const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  const ux = (p2[0] - p1[0]) / len;
  const uy = (p2[1] - p1[1]) / len;
  // เวกเตอร์ตั้งฉากชี้ออกจากถนน (side=1 คือซ้ายมือของทิศทางเดินทาง)
  const nx = side * uy;
  const ny = -side * ux;
  const off = ROAD_HALF + VERGE + d / 2;
  // แกน y ของแปลงชี้เข้าหาถนนเสมอ
  const angle = Math.atan2(uy, ux) * 180 / Math.PI + (side < 0 ? 180 : 0);

  const front = Math.min(14, d * 0.28);
  const home: Box = { x: -w / 2 + 3, y: -d / 2 + 3, w: w - 6, h: d - 6 - front };
  const round = (v: number) => Math.round(v * 100) / 100;

  return nums.map((n, i) => {
    const a = start + i * pitch + w / 2;
    const cx = round(p1[0] + ux * a + nx * off);
    const cy = round(p1[1] + uy * a + ny * off);
    const midY = home.y + home.h / 2;
    return {
      n,
      transform: `translate(${cx} ${cy}) rotate(${round(angle)})`,
      plot: { x: -w / 2, y: -d / 2, w, h: d },
      home,
      drive: { x: -4, y: d / 2 - front, w: 8, h: front },
      ridge: { x1: home.x, y1: midY, x2: home.x + home.w, y2: midY },
      labelTransform: `translate(0 ${midY}) rotate(${round(-angle)})`,
      fontSize
    };
  });
}

function treeLine(x1: number, y1: number, x2: number, y2: number, step: number, r = 7) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const count = Math.max(1, Math.floor(len / step));
  const out: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    out.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, r: r + (i % 3) - 1 });
  }
  return out;
}

export function buildVillage(): VillageLayout {
  const W = 34, LW = 32, D = 44;          // แปลงมาตรฐาน: ระยะห่าง / กว้าง / ลึก
  const BW = 68, BLW = 66, BD = 56;       // แปลงใหญ่ (ถนน B)

  const mainRoad: Pt[] = [[120, 44], [120, 380]];
  const roadA: Pt[] = [[120, 380], [680, 380]];
  const roadB: Pt[] = [[200, 480], [680, 480]];

  const lots: VillageLot[] = [
    // ถนนหลัก: 1-6 ฝั่งตะวันตก, 7-12 ฝั่งตะวันออก
    ...lane(mainRoad[0], mainRoad[1], -1, 68, [1, 2, 3, 4, 5, 6], LW, D, W, 11),
    ...lane(mainRoad[0], mainRoad[1], 1, 68, [7, 8, 9, 10, 11, 12], LW, D, W, 11),
    // ถนน A: ฝั่งเหนือ 13-24, ฝั่งใต้ 25-36 (ซอยกลางคั่นระหว่างกลาง)
    ...lane(roadA[0], roadA[1], 1, 80, [13, 14, 15, 16, 17, 18], LW, D, W, 11),
    ...lane(roadA[0], roadA[1], 1, 316, [19, 20, 21, 22, 23, 24], LW, D, W, 11),
    ...lane(roadA[0], roadA[1], -1, 80, [25, 26, 27, 28, 29, 30], LW, D, W, 11),
    ...lane(roadA[0], roadA[1], -1, 316, [31, 32, 33, 34, 35, 36], LW, D, W, 11),
    // ถนน B: บ้านแปลงใหญ่ 37-42
    ...lane(roadB[0], roadB[1], -1, 0, [37, 38, 39], BLW, BD, BW, 13),
    ...lane(roadB[0], roadB[1], -1, 236, [40, 41, 42], BLW, BD, BW, 13),
  ];

  const areas: VillageArea[] = [
    { x: 196, y: 110, w: 208, h: 202, fill: '#bfe0b4', rx: 8 },                       // สวนหย่อมด้านซ้าย
    { x: 206, y: 118, w: 92, h: 58, fill: '#b08968', rx: 4, label: 'คลับเฮาส์', color: '#fff' },
    { x: 306, y: 118, w: 90, h: 58, fill: '#4fc3f7', rx: 6, label: 'สระว่ายน้ำ', color: '#073b5c' },
    { x: 436, y: 110, w: 360, h: 202, fill: '#bfe0b4', rx: 8 },                        // สวนสาธารณะ
    { x: 452, y: 124, w: 96, h: 50, fill: '#ffb74d', rx: 4, label: 'สนามเด็กเล่น', color: '#4a2c00' },
    { x: 686, y: 124, w: 92, h: 66, fill: '#81c784', rx: 4, label: 'สนามกีฬา', color: '#12351a' },
    { x: 150, y: 52, w: 112, h: 20, fill: '#ffb300', rx: 10, label: 'ทางเข้า / ป้อมยาม', color: '#222' },
  ];

  const trees = [
    ...treeLine(300, 64, 820, 64, 22),               // แนวต้นไม้เหนือซอยหลัก
    ...treeLine(44, 120, 44, 330, 24),               // ขอบตะวันตก
    ...treeLine(206, 262, 394, 262, 24),             // สวนหย่อมซ้าย
    ...treeLine(206, 292, 394, 292, 24),
    ...treeLine(214, 214, 214, 244, 15),
    ...treeLine(444, 292, 788, 292, 26),             // ขอบสวนสาธารณะ
    ...treeLine(204, 456, 404, 456, 20),             // แนวกันชนก่อนถึงถนน B
    ...treeLine(440, 456, 664, 456, 20),
    ...treeLine(706, 400, 706, 560, 24),             // ขอบตะวันออก
    ...treeLine(742, 420, 742, 540, 28, 8),
    ...treeLine(780, 400, 780, 560, 24),
    { x: 566, y: 190, r: 8 }, { x: 650, y: 140, r: 7 }, { x: 664, y: 262, r: 8 },
    { x: 470, y: 250, r: 8 }, { x: 520, y: 270, r: 7 },
  ];

  return {
    width: 840,
    height: 570,
    roads: [
      'M120 44 L120 380 L680 380 L680 480',  // ถนนหลัก + ถนน A + ถนนวงแหวนฝั่งตะวันออก
      'M120 90 L420 90 L420 480',            // ซอยกลาง
      'M200 480 L680 480',                   // ถนน B
    ],
    culdesac: [{ cx: 196, cy: 480, r: 20 }],
    areas,
    ponds: [{ cx: 600, cy: 212, rx: 82, ry: 44 }],
    trees,
    lots,
  };
}
