/**
 * 40x40 Orta Zorlukta Labirent Oluşturucu
 * Format: [{x, y, type}] - type: 0=yol, 1=duvar
 */

type Cell = { x: number; y: number; type: number };

export const generateMediumMaze = (): Cell[] => {
  const size = 40;
  const cells: Cell[] = [];
  
  // Önce tüm hücreleri yol olarak başlat
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      cells.push({ x, y, type: 0 });
    }
  }
  
  // Dış duvarlar
  for (let i = 0; i < size; i++) {
    setCell(cells, 0, i, 1); // Sol duvar
    setCell(cells, size - 1, i, 1); // Sağ duvar
    setCell(cells, i, 0, 1); // Üst duvar
    setCell(cells, i, size - 1, 1); // Alt duvar
  }
  
  // Başlangıç ve çıkış noktalarını yol yap
  setCell(cells, 0, 0, 0); // Başlangıç
  setCell(cells, 1, 0, 0);
  setCell(cells, 0, 1, 0);
  setCell(cells, size - 1, size - 1, 0); // Çıkış
  setCell(cells, size - 2, size - 1, 0);
  setCell(cells, size - 1, size - 2, 0);
  
  // İç labirent yapısı - orta zorlukta
  // Dikey duvarlar (çıkmaz sokaklar oluşturmak için)
  for (let y = 2; y < 12; y++) {
    setCell(cells, 5, y, 1);
    setCell(cells, 8, y, 1);
    setCell(cells, 12, y, 1);
    setCell(cells, 15, y, 1);
  }
  
  for (let y = 15; y < 25; y++) {
    setCell(cells, 3, y, 1);
    setCell(cells, 7, y, 1);
    setCell(cells, 11, y, 1);
    setCell(cells, 18, y, 1);
    setCell(cells, 22, y, 1);
  }
  
  for (let y = 8; y < 18; y++) {
    setCell(cells, 20, y, 1);
    setCell(cells, 25, y, 1);
    setCell(cells, 30, y, 1);
  }
  
  for (let y = 20; y < 30; y++) {
    setCell(cells, 10, y, 1);
    setCell(cells, 14, y, 1);
    setCell(cells, 28, y, 1);
    setCell(cells, 32, y, 1);
  }
  
  for (let y = 25; y < 35; y++) {
    setCell(cells, 6, y, 1);
    setCell(cells, 17, y, 1);
    setCell(cells, 24, y, 1);
    setCell(cells, 35, y, 1);
  }
  
  // Yatay duvarlar (çıkmaz sokaklar ve alternatif yollar)
  for (let x = 2; x < 10; x++) {
    setCell(cells, x, 5, 1);
    setCell(cells, x, 9, 1);
  }
  
  for (let x = 10; x < 20; x++) {
    setCell(cells, x, 3, 1);
    setCell(cells, x, 7, 1);
    setCell(cells, x, 14, 1);
  }
  
  for (let x = 5; x < 15; x++) {
    setCell(cells, x, 12, 1);
    setCell(cells, x, 16, 1);
    setCell(cells, x, 20, 1);
  }
  
  for (let x = 15; x < 25; x++) {
    setCell(cells, x, 10, 1);
    setCell(cells, x, 18, 1);
    setCell(cells, x, 22, 1);
  }
  
  for (let x = 20; x < 30; x++) {
    setCell(cells, x, 5, 1);
    setCell(cells, x, 12, 1);
    setCell(cells, x, 25, 1);
  }
  
  for (let x = 25; x < 35; x++) {
    setCell(cells, x, 8, 1);
    setCell(cells, x, 15, 1);
    setCell(cells, x, 28, 1);
  }
  
  for (let x = 30; x < 38; x++) {
    setCell(cells, x, 11, 1);
    setCell(cells, x, 20, 1);
    setCell(cells, x, 32, 1);
  }
  
  // Çıkmaz sokaklar ekle (dead ends)
  // Sol üst bölge
  setCell(cells, 2, 2, 1);
  setCell(cells, 2, 3, 1);
  setCell(cells, 3, 2, 1);
  
  setCell(cells, 4, 3, 1);
  setCell(cells, 4, 4, 1);
  
  // Orta sol
  setCell(cells, 2, 8, 1);
  setCell(cells, 2, 9, 1);
  setCell(cells, 3, 8, 1);
  
  setCell(cells, 4, 15, 1);
  setCell(cells, 4, 16, 1);
  
  // Alt sol
  setCell(cells, 2, 22, 1);
  setCell(cells, 2, 23, 1);
  
  setCell(cells, 5, 28, 1);
  setCell(cells, 5, 29, 1);
  
  // Üst orta
  setCell(cells, 13, 2, 1);
  setCell(cells, 13, 3, 1);
  
  setCell(cells, 17, 4, 1);
  setCell(cells, 17, 5, 1);
  
  // Orta
  setCell(cells, 9, 9, 1);
  setCell(cells, 9, 10, 1);
  
  setCell(cells, 13, 13, 1);
  setCell(cells, 13, 14, 1);
  
  setCell(cells, 19, 19, 1);
  setCell(cells, 19, 20, 1);
  
  // Sağ üst
  setCell(cells, 28, 2, 1);
  setCell(cells, 28, 3, 1);
  
  setCell(cells, 32, 4, 1);
  setCell(cells, 32, 5, 1);
  
  // Sağ orta
  setCell(cells, 27, 12, 1);
  setCell(cells, 27, 13, 1);
  
  setCell(cells, 33, 18, 1);
  setCell(cells, 33, 19, 1);
  
  // Alt orta
  setCell(cells, 12, 28, 1);
  setCell(cells, 12, 29, 1);
  
  setCell(cells, 21, 32, 1);
  setCell(cells, 21, 33, 1);
  
  // Sağ alt
  setCell(cells, 30, 30, 1);
  setCell(cells, 30, 31, 1);
  
  setCell(cells, 34, 33, 1);
  setCell(cells, 34, 34, 1);
  
  // Alternatif yollar için bazı duvarları kaldır (geçişler)
  setCell(cells, 5, 4, 0); // Geçiş
  setCell(cells, 8, 6, 0); // Geçiş
  setCell(cells, 12, 8, 0); // Geçiş
  setCell(cells, 15, 11, 0); // Geçiş
  setCell(cells, 20, 15, 0); // Geçiş
  setCell(cells, 25, 19, 0); // Geçiş
  setCell(cells, 30, 23, 0); // Geçiş
  setCell(cells, 10, 17, 0); // Geçiş
  setCell(cells, 14, 21, 0); // Geçiş
  setCell(cells, 28, 26, 0); // Geçiş
  setCell(cells, 32, 29, 0); // Geçiş
  
  return cells;
};

const setCell = (cells: Cell[], x: number, y: number, type: number) => {
  const index = cells.findIndex(c => c.x === x && c.y === y);
  if (index !== -1) {
    cells[index].type = type;
  }
};

// JSON string olarak döndür
export const getMazeJSON = (): string => {
  const maze = generateMediumMaze();
  return JSON.stringify(maze, null, 2);
};



