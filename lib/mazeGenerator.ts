import { MapMatrix, Vector2 } from "./types";

/**
 * Maze Generator - Array Matrix Generator
 * Labirent oluşturmak için kullanılan fonksiyonlar
 */

export type MazeConfig = {
  width: number;
  height: number;
  start?: Vector2; // Grid koordinatları (x, y)
  exit?: Vector2; // Grid koordinatları (x, y)
  doors?: Array<{ position: Vector2; requiredClicks: number }>;
  verificationDoors?: Array<{ position: Vector2 }>;
  enemies?: Array<{ position: Vector2; path: Vector2[] }>;
  matrix?: MapMatrix; // Matris verisi (duvarlar için)
};

/**
 * Boş bir matris oluştur (0 = yol)
 */
export const createEmptyMatrix = (width: number, height: number): MapMatrix => {
  return Array(height).fill(null).map(() => Array(width).fill(0));
};

/**
 * Dış duvarları oluştur
 */
export const addOuterWalls = (matrix: MapMatrix): MapMatrix => {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  
  // Üst ve alt duvarlar
  for (let x = 0; x < width; x++) {
    matrix[0][x] = 1; // Üst
    matrix[height - 1][x] = 1; // Alt
  }
  
  // Sol ve sağ duvarlar
  for (let y = 0; y < height; y++) {
    matrix[y][0] = 1; // Sol
    matrix[y][width - 1] = 1; // Sağ
  }
  
  return matrix;
};

/**
 * Rastgele labirent oluştur (Recursive Backtracking algoritması)
 */
export const generateRandomMaze = (
  width: number,
  height: number,
  complexity: number = 0.5
): MapMatrix => {
  const matrix = createEmptyMatrix(width, height);
  addOuterWalls(matrix);
  
  // İç duvarları rastgele yerleştir
  const wallCount = Math.floor((width - 2) * (height - 2) * complexity);
  
  for (let i = 0; i < wallCount; i++) {
    const x = Math.floor(Math.random() * (width - 2)) + 1;
    const y = Math.floor(Math.random() * (height - 2)) + 1;
    
    // Başlangıç ve bitiş noktalarını boş bırak
    if (matrix[y][x] !== 2 && matrix[y][x] !== 3) {
      matrix[y][x] = 1;
    }
  }
  
  return matrix;
};

/**
 * Manuel labirent oluştur (JSON'dan yüklenecek)
 */
export const createMazeFromConfig = (config: MazeConfig): MapMatrix => {
  const { width, height, start, exit, doors, enemies, matrix: providedMatrix } = config;
  
  let matrix: MapMatrix;
  
  // Eğer matris verisi varsa, onu kullan
  if (providedMatrix) {
    matrix = providedMatrix.map(row => row.slice()); // Deep copy
  } else {
    // Yoksa yeni matris oluştur
    matrix = createEmptyMatrix(width, height);
    // Dış duvarlar
    addOuterWalls(matrix);
  }
  
  // Başlangıç noktası (2) - matris verisi varsa bile üzerine yaz
  if (start) {
    matrix[start.y][start.x] = 2;
  }
  
  // Çıkış noktası (3) - matris verisi varsa bile üzerine yaz
  if (exit) {
    matrix[exit.y][exit.x] = 3;
  }
  
  // Kapılar (4) - matris verisi varsa bile üzerine yaz
  if (doors) {
    doors.forEach((door) => {
      matrix[door.position.y][door.position.x] = 4;
    });
  }
  
  // Düşmanlar (5) - matris verisi varsa bile üzerine yaz
  if (enemies) {
    enemies.forEach((enemy) => {
      matrix[enemy.position.y][enemy.position.x] = 5;
    });
  }
  
  // Doğrulama kapıları (6) - matris verisi varsa bile üzerine yaz
  if (config.verificationDoors) {
    config.verificationDoors.forEach((door) => {
      matrix[door.position.y][door.position.x] = 6;
    });
  }
  
  return matrix;
};

/**
 * JSON'dan labirent yükle
 */
export const loadMazeFromJSON = (jsonData: string | object): MazeConfig => {
  const data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
  
  const config: MazeConfig = {
    width: data.width ?? 40,
    height: data.height ?? 40,
    start: data.start ? { x: data.start.x, y: data.start.y } : undefined,
    exit: data.exit ? { x: data.exit.x, y: data.exit.y } : undefined,
    doors: data.doors?.map((d: any) => ({
      position: { x: d.position.x, y: d.position.y },
      requiredClicks: d.requiredClicks ?? 10
    })),
    enemies: data.enemies?.map((e: any) => ({
      position: { x: e.position.x, y: e.position.y },
      path: e.path?.map((p: any) => ({ x: p.x, y: p.y })) ?? []
    }))
  };
  
  // Matris verisi varsa ekle
  if (data.matrix && Array.isArray(data.matrix)) {
    config.matrix = data.matrix.map((row: any[]) => row.slice());
  }
  
  return config;
};

/**
 * Matrisi JSON formatına çevir
 */
export const matrixToJSON = (matrix: MapMatrix, config: Partial<MazeConfig>): string => {
  const width = matrix[0]?.length ?? 0;
  const height = matrix.length;
  
  const doors: Array<{ position: Vector2; requiredClicks: number }> = [];
  const enemies: Array<{ position: Vector2; path: Vector2[] }> = [];
  let start: Vector2 | undefined;
  let exit: Vector2 | undefined;
  
  // Matristen bilgileri çıkar
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = matrix[y][x];
      if (value === 2) start = { x, y };
      if (value === 3) exit = { x, y };
      if (value === 4) {
        doors.push({
          position: { x, y },
          requiredClicks: 10
        });
      }
      if (value === 5) {
        enemies.push({
          position: { x, y },
          path: [{ x, y }, { x: x + 2, y }, { x: x + 2, y: y + 2 }, { x, y: y + 2 }]
        });
      }
    }
  }
  
  return JSON.stringify({
    width,
    height,
    start,
    exit,
    doors,
    enemies,
    ...config
  }, null, 2);
};

/**
 * Örnek JSON formatı
 */
export const exampleMazeJSON = {
  width: 40,
  height: 40,
  start: { x: 1, y: 1 },
  exit: { x: 38, y: 38 },
  doors: [
    { position: { x: 10, y: 10 }, requiredClicks: 8 },
    { position: { x: 20, y: 15 }, requiredClicks: 10 },
    { position: { x: 30, y: 20 }, requiredClicks: 12 },
    { position: { x: 15, y: 25 }, requiredClicks: 14 }
  ],
  enemies: [
    {
      position: { x: 5, y: 5 },
      path: [
        { x: 5, y: 5 },
        { x: 7, y: 5 },
        { x: 7, y: 7 },
        { x: 5, y: 7 }
      ]
    },
    {
      position: { x: 15, y: 15 },
      path: [
        { x: 15, y: 15 },
        { x: 17, y: 15 },
        { x: 17, y: 17 },
        { x: 15, y: 17 }
      ]
    },
    {
      position: { x: 25, y: 25 },
      path: [
        { x: 25, y: 25 },
        { x: 27, y: 25 },
        { x: 27, y: 27 },
        { x: 25, y: 27 }
      ]
    }
  ]
};

