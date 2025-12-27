# 🎮 Mazer - 2D Eğitici Labirent Oyunu

Modern web teknolojileri ile geliştirilmiş, eğitici içerikli tam özellikli bir labirent oyunudur. Quiz soruları, İngilizce cümle tamamlama ve CAPTCHA doğrulama gibi interaktif öğelerle öğrenmeyi oyunlaştırmayı hedefler.

🔗 **Canlı Demo:** [Vercel linkini buraya ekle]

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
