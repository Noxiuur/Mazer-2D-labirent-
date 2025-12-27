🎮 Mazer - 2D Eğitici Labirent Oyunu
Modern web teknolojileri ile geliştirilmiş, eğitici içerikli tam özellikli labirent oyunu. Quiz soruları, İngilizce cümle tamamlama ve CAPTCHA doğrulama içerir.

🔗 Canlı Demo: [Vercel linkini buraya ekle]

🛠️ Teknolojiler
Frontend
Next.js 14 (App Router) - React framework
TypeScript - Tip güvenli geliştirme
Tailwind CSS - Styling
Framer Motion - Animasyonlar
Backend
Firebase Firestore - NoSQL veritabanı
Firebase Auth - Google OAuth
Firebase Storage - Bulut senkronizasyonu
✨ Özellikler
Oyun Mekanikleri
3 Zorluk Seviyesi + Sınırsız kullanıcı labirenti
Pixel-Perfect Collision Detection - Matris tabanlı çarpışma sistemi
Smooth Movement - İvme ve sürtünme tabanlı fizik motoru
Düşman AI - Patrol algoritması ile waypoint takibi
Eğitici İçerik - Quiz, İngilizce cümle, CAPTCHA
Gerçek Zamanlı Liderlik Tablosu - Firebase entegrasyonu
Kontrol Sistemleri
⌨️ Klavye (WASD / Ok tuşları)
🖱️ Fare ile rota çizme
📱 Touch gesture desteği
Kullanıcı Özellikleri
Google OAuth ile giriş
Karakter özelleştirme (30+ seçenek)
Labirent editörü (drag-and-drop)
Topluluk labirentleri
Çift dil (TR/EN) ve tema desteği
🎯 Teknik Özellikler
Oyun Motoru
typescript
// Fizik tabanlı smooth hareket
velocity.x = currentVx + (targetVx - currentVx) * ACCELERATION;
velocity.y = currentVy + (targetVy - currentVy) * ACCELERATION;
// 4 köşe noktası ile pixel-perfect collision
const corners = [
  { x: pos.x - radius, y: pos.y - radius },
  { x: pos.x + radius, y: pos.y - radius },
  { x: pos.x - radius, y: pos.y + radius },
  { x: pos.x + radius, y: pos.y + radius }
];
Labirent Formatı (JSON)
json
{
  "width": 40,
  "height": 40,
  "matrix": [[1,0,0,...], [1,2,0,...]],
  "doors": [{"position": {"x": 10, "y": 5}, "requiredClicks": 8}],
  "enemies": [{"path": [{"x": 5, "y": 5}, {"x": 7, "y": 5}]}]
}
Hücre Değerleri:

0 = Yol, 1 = Duvar, 2 = Başlangıç, 3 = Çıkış
4 = Tıklama Kapısı, 5 = Düşman, 6 = CAPTCHA
7 = Anahtar, 8 = Kilitli Çıkış, 9 = Yanar Duvar
