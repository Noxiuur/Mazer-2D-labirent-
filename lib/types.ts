export type Vector2 = { x: number; y: number };

export type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
};

export type Door = {
  id: string;
  position: Vector2;
  requiredClicks: number;
  removed?: boolean;
};

export type Enemy = {
  id: string;
  path: Vector2[];
  pathIndex?: number;
  position?: Vector2;
  questionId: string;
  alive?: boolean;
};

// Matris değerleri: 0=boş yol, 1=duvar, 2=başlangıç, 3=çıkış,
// 4=tıklama kapısı, 5=düşman, 6=doğrulama kapısı,
// 7=anahtar, 8=anahtarlı çıkış, 9=yanar duvar
export type MapMatrix = number[][];

export type VerificationDoor = {
  id: string;
  position: Vector2;
  removed?: boolean;
};

export type Key = {
  id: string;
  position: Vector2;
  collected?: boolean;
};

export type LevelConfig = {
  id: number | string;
  name: string;
  matrix: MapMatrix; // 2D Array: 0=yol, 1=duvar, 2=başlangıç, 3=çıkış, 4=kapı, 5=düşman, 6=doğrulama kapısı, 7=anahtar, 8=anahtarlı çıkış, 9=yanar duvar
  start: Vector2; // Pixel koordinatları
  exit: Vector2; // Pixel koordinatları
  doors: Door[]; // Kapılar (4 değerine sahip hücreler)
  verificationDoors?: VerificationDoor[]; // Doğrulama kapıları (6 değerine sahip hücreler)
  enemies: Enemy[]; // Düşmanlar (5 değerine sahip hücreler)
  key?: Key; // Anahtar (7 değerine sahip hücreler)
  lockedExit?: Vector2; // Anahtarlı çıkış (8 değerine sahip hücreler)
  mapWidth: number; // Harita genişliği (pixel) - 800
  mapHeight: number; // Harita yüksekliği (pixel) - 800
  tileSize: number; // Her hücrenin pixel boyutu (800 / matrix genişliği)
};

