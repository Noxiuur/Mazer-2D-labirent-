# 🎮 Mazer - 2D Eğitici Labirent Oyunu

Modern web teknolojileri ile geliştirilmiş, eğitici içerikli tam özellikli bir labirent oyunudur. Quiz soruları, İngilizce cümle tamamlama ve CAPTCHA doğrulama gibi interaktif öğelerle öğrenmeyi oyunlaştırmayı hedefler.

🔗 **Canlı Demo:** [mazer-gules.vercel.app]

---

## 🛠️ Teknolojiler

### **Frontend**
- **Next.js 14 (App Router)** - React framework
- **TypeScript** - Tip güvenli geliştirme
- **Tailwind CSS** - Modern ve responsive arayüz
- **Framer Motion** - Akıcı animasyonlar

### **Backend**
- **Firebase Firestore** - NoSQL veritabanı (Veri yönetimi)
- **Firebase Auth** - Google OAuth (Giriş sistemleri)
- **Firebase Storage** - Bulut senkronizasyonu

---

## ✨ Özellikler

### **Oyun Mekanikleri**
- **3 Zorluk Seviyesi:** Kolay, orta ve zor modlar + sınırsız kullanıcı labirenti.
- **Pixel-Perfect Collision Detection:** Matris tabanlı hassas çarpışma sistemi.
- **Smooth Movement:** İvme ve sürtünme tabanlı fizik motoru ile akıcı karakter kontrolü.
- **Düşman AI:** Patrol algoritması ile belirli yolları izleyen (waypoint) yapay zeka.
- **Eğitici İçerik:** Oyun içine entegre edilmiş Quiz, İngilizce cümle ve CAPTCHA bölümleri.
- **Gerçek Zamanlı Liderlik Tablosu:** Firebase ile anlık güncellenen skorboard.

### **Kontrol Sistemleri**
- ⌨️ **Klavye:** WASD veya Ok tuşları ile kontrol.
- 🖱️ **Fare:** Sürükleyerek rota çizme.
- 📱 **Dokunmatik:** Mobil cihazlar için touch gesture desteği.

### **Kullanıcı Özellikleri**
- **Google OAuth:** Hızlı ve güvenli giriş.
- **Karakter Özelleştirme:** 30'dan fazla farklı seçenek.
- **Labirent Editörü:** Sürükle-bırak (drag-and-drop) ile kendi bölümünü tasarlama.
- **Topluluk Labirentleri:** Diğer kullanıcıların tasarladığı bölümleri oynama.
- **Dil & Tema:** Çift dil (TR/EN) desteği ve koyu/açık mod.

---
🧩 Hücre Değerleri Referans Tablosu
Labirent matrisindeki her bir rakam farklı bir objeyi temsil eder:
<img width="512" height="242" alt="image" src="https://github.com/user-attachments/assets/ace3054b-f45e-4c55-a99e-2de8e0f12f13" />
---
🎨 Labirent Oluşturucu (Maze Editor)
Kullanıcıların kendi labirentlerini oluşturması için tam özellikli editör:

Özellikler:

40x40 Grid Sistemi - Drag-and-drop ile hücre düzenleme
9 Farklı Hücre Tipi:
Duvar, Yol, Başlangıç, Çıkış
Tıklama Kapısı, Düşman, CAPTCHA Kapısı
Anahtar, Kilitli Çıkış, Yanar Duvar
Düşman Rota Editörü - Waypoint ekleme/silme ile patrol rotası oluşturma
Canlı Önizleme - Değişiklikleri anında görme
Kaydetme Seçenekleri:
💾 LocalStorage - Tarayıcıda yerel kayıt
☁️ Firebase Cloud - Buluta yükleme ve toplulukla paylaşma
📥 JSON Export - Dosya olarak indirme
📤 JSON Import - Dışarıdan labirent yükleme
Doğrulama Sistemi - Başlangıç/çıkış kontrolü, geçerlilik testi
Çift Dil Desteği - Türkçe/İngilizce arayüz

<img width="1488" height="787" alt="image" src="https://github.com/user-attachments/assets/19bc8112-5495-460d-8473-ae6074ad5047" />

Teknik Detaylar:

typescript
// Hücre tıklama ile tip değiştirme
const handleCellClick = (x: number, y: number) => {
  const currentValue = matrix[y][x];
  const nextValue = (currentValue + 1) % 10; // 0-9 arası döngü
  updateMatrix(x, y, nextValue);
};
// Düşman rotası oluşturma
const addEnemyWaypoint = (x: number, y: number) => {
  setEnemies(prev => [...prev, {
    id: `enemy-${Date.now()}`,
    path: [{ x, y }]
  }]);
};
// Firebase'e kaydetme
const saveToCloud = async () => {
  const mazeData = {
    name: mazeName,
    json: JSON.stringify({ width, height, matrix, doors, enemies }),
    userId: user.uid,
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, 'mazes'), mazeData);
};

## 🎯 Teknik Detaylar

### **Oyun Motoru Mantığı**
Karakter hareketi, fizik tabanlı bir ivmelenme sistemi ile yönetilir:

```typescript
// Fizik tabanlı smooth hareket örneği
velocity.x = currentVx + (targetVx - currentVx) * ACCELERATION;
velocity.y = currentVy + (targetVy - currentVy) * ACCELERATION;

// 4 köşe noktası ile pixel-perfect collision
const corners = [
  { x: pos.x - radius, y: pos.y - radius },
  { x: pos.x + radius, y: pos.y - radius },
  { x: pos.x - radius, y: pos.y + radius },
  { x: pos.x + radius, y: pos.y + radius }
];
