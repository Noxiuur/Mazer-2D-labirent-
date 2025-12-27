import { Door, Enemy, LevelConfig, MapMatrix, Question, Vector2, VerificationDoor, Key as KeyType } from "./types";
import { createMazeFromConfig, loadMazeFromJSON, type MazeConfig } from "./mazeGenerator";
import kolayJSON from "../public/kolay.json";
import ortaJSON from "../public/orta.json";

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "Türkiye'nin başkenti neresidir?",
    options: ["Ankara", "İstanbul", "İzmir"],
    answer: "Ankara"
  },
  {
    id: "q2",
    prompt: "Işık yılı hangi büyüklüğü ölçer?",
    options: ["Zaman", "Mesafe", "Kütle"],
    answer: "Mesafe"
  },
  {
    id: "q3",
    prompt: "Dünyanın en büyük okyanusu hangisidir?",
    options: ["Atlantik", "Hint", "Pasifik"],
    answer: "Pasifik"
  },
  {
    id: "q4",
    prompt: "Hangi gezegen Güneş'e en yakındır?",
    options: ["Venüs", "Merkür", "Mars"],
    answer: "Merkür"
  },
  {
    id: "q5",
    prompt: "İnsan vücudunda kaç kemik vardır?",
    options: ["206", "300", "150"],
    answer: "206"
  },
  {
    id: "q6",
    prompt: "Hangi element periyodik tabloda H sembolü ile gösterilir?",
    options: ["Helyum", "Hidrojen", "Hafniyum"],
    answer: "Hidrojen"
  },
  {
    id: "q7",
    prompt: "Dünyanın en uzun nehri hangisidir?",
    options: ["Nil", "Amazon", "Mississippi"],
    answer: "Nil"
  },
  {
    id: "q8",
    prompt: "Hangi yıl İstanbul fethedilmiştir?",
    options: ["1453", "1451", "1455"],
    answer: "1453"
  },
  {
    id: "q9",
    prompt: "Hangi gezegen 'Kırmızı Gezegen' olarak bilinir?",
    options: ["Venüs", "Mars", "Jüpiter"],
    answer: "Mars"
  },
  {
    id: "q10",
    prompt: "Hangi dil dünyada en çok konuşulan dildir?",
    options: ["İngilizce", "Çince", "İspanyolca"],
    answer: "Çince"
  },
  {
    id: "q11",
    prompt: "Hangi ülke en fazla nüfusa sahiptir?",
    options: ["Hindistan", "Çin", "ABD"],
    answer: "Çin"
  },
  {
    id: "q12",
    prompt: "Hangi element periyodik tabloda O sembolü ile gösterilir?",
    options: ["Oksijen", "Osmiyum", "Oganesson"],
    answer: "Oksijen"
  },
  {
    id: "q13",
    prompt: "Hangi yıl Türkiye Cumhuriyeti kurulmuştur?",
    options: ["1923", "1920", "1925"],
    answer: "1923"
  },
  {
    id: "q14",
    prompt: "Hangi gezegen en büyük gezegendir?",
    options: ["Satürn", "Jüpiter", "Neptün"],
    answer: "Jüpiter"
  },
  {
    id: "q15",
    prompt: "Hangi okyanus en küçüktür?",
    options: ["Arktik", "Hint", "Atlantik"],
    answer: "Arktik"
  },
  {
    id: "q16",
    prompt: "Hangi element periyodik tabloda Fe sembolü ile gösterilir?",
    options: ["Flor", "Demir", "Fermiyum"],
    answer: "Demir"
  },
  {
    id: "q17",
    prompt: "Hangi kıta en küçüktür?",
    options: ["Avustralya", "Antarktika", "Avrupa"],
    answer: "Avustralya"
  },
  {
    id: "q18",
    prompt: "Hangi yıl 1. Dünya Savaşı başlamıştır?",
    options: ["1914", "1915", "1913"],
    answer: "1914"
  },
  {
    id: "q19",
    prompt: "Hangi element periyodik tabloda Au sembolü ile gösterilir?",
    options: ["Altın", "Gümüş", "Alüminyum"],
    answer: "Altın"
  },
  {
    id: "q20",
    prompt: "Hangi gezegen en sıcaktır?",
    options: ["Venüs", "Merkür", "Mars"],
    answer: "Venüs"
  },
  {
    id: "q21",
    prompt: "Aşağıdakilerden hangisi bir programlama dilidir?",
    options: ["Python", "HTML", "Photoshop"],
    answer: "Python"
  },
  {
    id: "q22",
    prompt: "İkili (binary) sistemde hangi iki rakam kullanılır?",
    options: ["0 ve 1", "1 ve 2", "2 ve 3"],
    answer: "0 ve 1"
  },
  {
    id: "q23",
    prompt: "CPU aşağıdakilerden hangisinin kısaltmasıdır?",
    options: ["Central Process Unit", "Central Processing Unit", "Central Power Unit"],
    answer: "Central Processing Unit"
  },
  {
    id: "q24",
    prompt: "Internet üzerinde adresleri tanımlamak için kullanılan sistem hangisidir?",
    options: ["DNS", "USB", "HDMI"],
    answer: "DNS"
  },
  {
    id: "q25",
    prompt: "Bir web sayfasını görüntülemek için hangi yazılım kullanılır?",
    options: ["Tarayıcı (Browser)", "Editör", "Derleyici"],
    answer: "Tarayıcı (Browser)"
  }
];

// 800x800 grid için 40x40 matris (her hücre 20x20 pixel)
const MAP_SIZE = 800;
const MATRIX_SIZE = 40; // 800 / 20 = 40
const TILE_SIZE = MAP_SIZE / MATRIX_SIZE; // 20 pixel

// Grid koordinatlarını pixel koordinatlarına çevir
const gridToPixel = (gridPos: Vector2, tileSize: number): Vector2 => ({
  x: gridPos.x * tileSize + tileSize / 2,
  y: gridPos.y * tileSize + tileSize / 2
});

// Karmaşık labirent oluştur
const createLevel1Matrix = (): MapMatrix => {
  const matrixConfig: MazeConfig = {
    width: MATRIX_SIZE,
    height: MATRIX_SIZE,
    start: { x: 1, y: 1 },
    exit: { x: MATRIX_SIZE - 2, y: MATRIX_SIZE - 2 },
    doors: [
      { position: { x: 9, y: 5 }, requiredClicks: 8 },
      { position: { x: 11, y: 13 }, requiredClicks: 10 },
      { position: { x: 19, y: 13 }, requiredClicks: 12 },
      { position: { x: 29, y: 13 }, requiredClicks: 14 }
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
          { x: 19, y: 17 },
          { x: 19, y: 15 },
          { x: 17, y: 15 },
          { x: 15, y: 15 }
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

  let matrix = createMazeFromConfig(matrixConfig);

  // İç duvarları manuel ekle (karmaşık labirent)
  // Sol üst bölge
  for (let x = 2; x < 8; x++) matrix[x][2] = 1;
  for (let x = 2; x < 6; x++) matrix[x][6] = 1;
  for (let y = 2; y < 7; y++) matrix[8][y] = 1;
  for (let y = 2; y < 5; y++) matrix[6][y] = 1;

  // Orta sol bölge
  for (let x = 2; x < 10; x++) matrix[x][10] = 1;
  for (let x = 2; x < 8; x++) matrix[x][14] = 1;
  for (let y = 10; y < 15; y++) matrix[10][y] = 1;
  for (let y = 10; y < 13; y++) matrix[6][y] = 1;

  // Alt sol bölge
  for (let x = 2; x < 12; x++) matrix[x][18] = 1;
  for (let x = 2; x < 10; x++) matrix[x][22] = 1;
  for (let y = 18; y < 23; y++) matrix[12][y] = 1;
  for (let y = 18; y < 21; y++) matrix[8][y] = 1;

  // Üst orta bölge
  for (let x = 12; x < 20; x++) matrix[x][2] = 1;
  for (let x = 14; x < 22; x++) matrix[x][6] = 1;
  for (let y = 2; y < 7; y++) matrix[14][y] = 1;
  for (let y = 2; y < 5; y++) matrix[18][y] = 1;

  // Orta bölge
  for (let x = 12; x < 24; x++) matrix[x][10] = 1;
  for (let x = 14; x < 22; x++) matrix[x][14] = 1;
  for (let y = 10; y < 15; y++) {
    matrix[16][y] = 1;
    matrix[20][y] = 1;
  }
  for (let y = 10; y < 13; y++) matrix[12][y] = 1;

  // Alt orta bölge
  for (let x = 12; x < 26; x++) matrix[x][18] = 1;
  for (let x = 14; x < 24; x++) matrix[x][22] = 1;
  for (let y = 18; y < 23; y++) {
    matrix[18][y] = 1;
    matrix[22][y] = 1;
  }

  // Sağ üst bölge
  for (let x = 24; x < 32; x++) matrix[x][2] = 1;
  for (let x = 26; x < 34; x++) matrix[x][6] = 1;
  for (let y = 2; y < 7; y++) {
    matrix[26][y] = 1;
    matrix[30][y] = 1;
  }

  // Sağ orta bölge
  for (let x = 24; x < 36; x++) matrix[x][10] = 1;
  for (let x = 26; x < 34; x++) matrix[x][14] = 1;
  for (let y = 10; y < 15; y++) {
    matrix[28][y] = 1;
    matrix[32][y] = 1;
  }

  // Sağ alt bölge
  for (let x = 24; x < 36; x++) matrix[x][18] = 1;
  for (let x = 26; x < 34; x++) matrix[x][22] = 1;
  for (let x = 28; x < 36; x++) matrix[x][26] = 1;
  for (let y = 18; y < 27; y++) {
    matrix[30][y] = 1;
    matrix[34][y] = 1;
  }

  // Ekstra karmaşık bölgeler
  for (let x = 16; x < 20; x++) matrix[x][26] = 1;
  for (let y = 26; y < 30; y++) matrix[18][y] = 1;
  for (let x = 20; x < 28; x++) matrix[x][30] = 1;
  for (let y = 30; y < 34; y++) {
    matrix[24][y] = 1;
    matrix[28][y] = 1;
  }

  return matrix;
};

// Kapılar - matristeki 4 değerlerine göre otomatik oluşturulacak
const getDoorsFromMatrix = (matrix: MapMatrix, tileSize: number): Door[] => {
  const doors: Door[] = [];
  let doorIndex = 1;

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] === 4) {
        doors.push({
          id: `d${doorIndex}`,
          position: gridToPixel({ x, y }, tileSize),
          requiredClicks: 6 + doorIndex * 2
        });
        doorIndex++;
      }
    }
  }

  return doors;
};

// Doğrulama kapıları - matristeki 6 değerlerine göre otomatik oluşturulacak
const getVerificationDoorsFromMatrix = (matrix: MapMatrix, tileSize: number): VerificationDoor[] => {
  const doors: VerificationDoor[] = [];
  let doorIndex = 1;

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] === 6) {
        doors.push({
          id: `vd${doorIndex}`,
          position: gridToPixel({ x, y }, tileSize)
        });
        doorIndex++;
      }
    }
  }

  return doors;
};

// Başlangıç ve çıkış pozisyonlarını matristen bul
const getStartFromMatrix = (matrix: MapMatrix, tileSize: number): Vector2 => {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] === 2) {
        return gridToPixel({ x, y }, tileSize);
      }
    }
  }
  return gridToPixel({ x: 1, y: 1 }, tileSize);
};

const getExitFromMatrix = (matrix: MapMatrix, tileSize: number): Vector2 => {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] === 3) {
        return gridToPixel({ x, y }, tileSize);
      }
    }
  }
  return gridToPixel({ x: MATRIX_SIZE - 2, y: MATRIX_SIZE - 2 }, tileSize);
};

const getKeyFromMatrix = (matrix: MapMatrix, tileSize: number): KeyType | undefined => {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] === 7) {
        return {
          id: "key-1",
          position: { x, y }
        };
      }
    }
  }
  return undefined;
};

const getLockedExitFromMatrix = (matrix: MapMatrix, tileSize: number): Vector2 | undefined => {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] === 8) {
        return { x, y };
      }
    }
  }
  return undefined;
};

// Düşmanlar - matristeki 5 değerlerine göre otomatik oluşturulacak
const getEnemiesFromMatrix = (matrix: MapMatrix, tileSize: number, mazeConfig?: MazeConfig): Enemy[] => {
  const enemies: Enemy[] = [];
  let enemyIndex = 1;

  // Önce JSON config'den düşmanları al
  if (mazeConfig?.enemies) {
    mazeConfig.enemies.forEach((enemyConfig) => {
      const path = enemyConfig.path.map((p) => gridToPixel(p, tileSize));
      enemies.push({
        id: `e${enemyIndex}`,
        path,
        questionId: "sentence" // Artık tüm düşmanlar İngilizce cümle sorusu için kullanılıyor
      });
      enemyIndex++;
    });
    return enemies;
  }

  // Yoksa matristen bul
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      const cell = matrix[y][x];
      if (cell === 5) {
        // Basit bir patrol yolu
        const path = [
          gridToPixel({ x, y }, tileSize),
          gridToPixel({ x: x + 2, y }, tileSize),
          gridToPixel({ x: x + 2, y: y + 2 }, tileSize),
          gridToPixel({ x, y: y + 2 }, tileSize)
        ];

        enemies.push({
          id: `e${enemyIndex}`,
          path,
          questionId: "sentence"
        });
        enemyIndex++;
      }
    }
  }

  return enemies;
};

// JSON'dan level oluştur
export const createLevelFromJSON = (
  id: number | string,
  name: string,
  jsonData: string | object
): LevelConfig => {
  const mazeConfig = loadMazeFromJSON(jsonData);
  const matrix = createMazeFromConfig(mazeConfig);
  const tileSize = MAP_SIZE / (mazeConfig.width ?? MATRIX_SIZE);
  const mapWidth = MAP_SIZE;
  const mapHeight = MAP_SIZE;

  const key = getKeyFromMatrix(matrix, tileSize);
  const lockedExit = getLockedExitFromMatrix(matrix, tileSize);

  return {
    id,
    name,
    matrix,
    start: getStartFromMatrix(matrix, tileSize),
    exit: getExitFromMatrix(matrix, tileSize),
    doors: getDoorsFromMatrix(matrix, tileSize),
    verificationDoors: getVerificationDoorsFromMatrix(matrix, tileSize),
    enemies: getEnemiesFromMatrix(matrix, tileSize, mazeConfig),
    key,
    lockedExit,
    mapWidth,
    mapHeight,
    tileSize
  };
};

const level1Matrix = createLevel1Matrix();
const level1Start = getStartFromMatrix(level1Matrix, TILE_SIZE);
const level1Exit = getExitFromMatrix(level1Matrix, TILE_SIZE);
const level1Doors = getDoorsFromMatrix(level1Matrix, TILE_SIZE);
const level1Enemies = getEnemiesFromMatrix(level1Matrix, TILE_SIZE);

// public klasöründeki JSON'lardan seviyeleri oluştur
const kolayLevel = createLevelFromJSON(1, "Kolay", kolayJSON);
const ortaLevel = createLevelFromJSON(2, "Orta", ortaJSON);

export const LEVELS: LevelConfig[] = [
  {
    id: kolayLevel.id,
    name: kolayLevel.name,
    matrix: kolayLevel.matrix,
    start: kolayLevel.start,
    exit: kolayLevel.exit,
    doors: kolayLevel.doors,
    verificationDoors: kolayLevel.verificationDoors,
    enemies: kolayLevel.enemies,
    mapWidth: kolayLevel.mapWidth,
    mapHeight: kolayLevel.mapHeight,
    tileSize: kolayLevel.tileSize,
  },
  {
    id: ortaLevel.id,
    name: ortaLevel.name,
    matrix: ortaLevel.matrix,
    start: ortaLevel.start,
    exit: ortaLevel.exit,
    doors: ortaLevel.doors,
    verificationDoors: ortaLevel.verificationDoors,
    enemies: ortaLevel.enemies,
    mapWidth: ortaLevel.mapWidth,
    mapHeight: ortaLevel.mapHeight,
    tileSize: ortaLevel.tileSize,
  },
  {
    id: 3,
    name: "Zor",
    matrix: level1Matrix,
    start: level1Start,
    exit: level1Exit,
    doors: level1Doors,
    verificationDoors: getVerificationDoorsFromMatrix(level1Matrix, TILE_SIZE),
    enemies: level1Enemies,
    mapWidth: MAP_SIZE,
    mapHeight: MAP_SIZE,
    tileSize: TILE_SIZE,
  },
];

// JSON'dan labirent eklemek için createLevelFromJSON fonksiyonunu dışa aktar
