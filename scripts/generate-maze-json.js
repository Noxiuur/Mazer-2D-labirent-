// 40x40 Orta Zorlukta Labirent JSON Oluşturucu
const size = 40;
const cells = [];

// Önce tüm hücreleri yol olarak başlat
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    cells.push({ x, y, type: 0 });
  }
}

const setCell = (x, y, type) => {
  const index = cells.findIndex(c => c.x === x && c.y === y);
  if (index !== -1) {
    cells[index].type = type;
  }
};

// Dış duvarlar
for (let i = 0; i < size; i++) {
  setCell(0, i, 1); // Sol duvar
  setCell(size - 1, i, 1); // Sağ duvar
  setCell(i, 0, 1); // Üst duvar
  setCell(i, size - 1, 1); // Alt duvar
}

// Başlangıç ve çıkış noktalarını yol yap
setCell(0, 0, 0); // Başlangıç
setCell(1, 0, 0);
setCell(0, 1, 0);
setCell(size - 1, size - 1, 0); // Çıkış
setCell(size - 2, size - 1, 0);
setCell(size - 1, size - 2, 0);

// İç labirent yapısı - orta zorlukta, çıkmaz sokaklar ve alternatif yollar
// Dikey duvarlar
for (let y = 2; y < 12; y++) {
  setCell(5, y, 1);
  setCell(8, y, 1);
  setCell(12, y, 1);
  setCell(15, y, 1);
}

for (let y = 15; y < 25; y++) {
  setCell(3, y, 1);
  setCell(7, y, 1);
  setCell(11, y, 1);
  setCell(18, y, 1);
  setCell(22, y, 1);
}

for (let y = 8; y < 18; y++) {
  setCell(20, y, 1);
  setCell(25, y, 1);
  setCell(30, y, 1);
}

for (let y = 20; y < 30; y++) {
  setCell(10, y, 1);
  setCell(14, y, 1);
  setCell(28, y, 1);
  setCell(32, y, 1);
}

for (let y = 25; y < 35; y++) {
  setCell(6, y, 1);
  setCell(17, y, 1);
  setCell(24, y, 1);
  setCell(35, y, 1);
}

// Yatay duvarlar
for (let x = 2; x < 10; x++) {
  setCell(x, 5, 1);
  setCell(x, 9, 1);
}

for (let x = 10; x < 20; x++) {
  setCell(x, 3, 1);
  setCell(x, 7, 1);
  setCell(x, 14, 1);
}

for (let x = 5; x < 15; x++) {
  setCell(x, 12, 1);
  setCell(x, 16, 1);
  setCell(x, 20, 1);
}

for (let x = 15; x < 25; x++) {
  setCell(x, 10, 1);
  setCell(x, 18, 1);
  setCell(x, 22, 1);
}

for (let x = 20; x < 30; x++) {
  setCell(x, 5, 1);
  setCell(x, 12, 1);
  setCell(x, 25, 1);
}

for (let x = 25; x < 35; x++) {
  setCell(x, 8, 1);
  setCell(x, 15, 1);
  setCell(x, 28, 1);
}

for (let x = 30; x < 38; x++) {
  setCell(x, 11, 1);
  setCell(x, 20, 1);
  setCell(x, 32, 1);
}

// Çıkmaz sokaklar (dead ends)
setCell(2, 2, 1); setCell(2, 3, 1); setCell(3, 2, 1);
setCell(4, 3, 1); setCell(4, 4, 1);
setCell(2, 8, 1); setCell(2, 9, 1); setCell(3, 8, 1);
setCell(4, 15, 1); setCell(4, 16, 1);
setCell(2, 22, 1); setCell(2, 23, 1);
setCell(5, 28, 1); setCell(5, 29, 1);
setCell(13, 2, 1); setCell(13, 3, 1);
setCell(17, 4, 1); setCell(17, 5, 1);
setCell(9, 9, 1); setCell(9, 10, 1);
setCell(13, 13, 1); setCell(13, 14, 1);
setCell(19, 19, 1); setCell(19, 20, 1);
setCell(28, 2, 1); setCell(28, 3, 1);
setCell(32, 4, 1); setCell(32, 5, 1);
setCell(27, 12, 1); setCell(27, 13, 1);
setCell(33, 18, 1); setCell(33, 19, 1);
setCell(12, 28, 1); setCell(12, 29, 1);
setCell(21, 32, 1); setCell(21, 33, 1);
setCell(30, 30, 1); setCell(30, 31, 1);
setCell(34, 33, 1); setCell(34, 34, 1);

// Alternatif yollar için geçişler
setCell(5, 4, 0); setCell(8, 6, 0); setCell(12, 8, 0);
setCell(15, 11, 0); setCell(20, 15, 0); setCell(25, 19, 0);
setCell(30, 23, 0); setCell(10, 17, 0); setCell(14, 21, 0);
setCell(28, 26, 0); setCell(32, 29, 0);

// JSON'u dosyaya yaz
const fs = require('fs');
const json = JSON.stringify(cells, null, 2);
fs.writeFileSync('public/maze-40x40.json', json);
console.log('Labirent JSON oluşturuldu: public/maze-40x40.json');



