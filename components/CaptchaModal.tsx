"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

type CaptchaItem = {
  id: number;
  emoji: string;
  category: string;
};

const CATEGORIES = [
  { name: "Trafik Işıkları", emoji: "🚦", items: ["🚦", "🚥", "🛑"] },
  { name: "Bisiklet", emoji: "🚲", items: ["🚲", "🚴", "🚴‍♂️", "🚴‍♀️"] },
  { name: "Dağ", emoji: "⛰️", items: ["⛰️", "🏔️", "🗻"] },
  { name: "Otobüs", emoji: "🚌", items: ["🚌", "🚍"] },
  { name: "Yaya Geçidi", emoji: "🚶", items: ["🚶", "🚶‍♂️", "🚶‍♀️", "🚸"] },
  { name: "Araba", emoji: "🚗", items: ["🚗", "🚙", "🚕", "🚐"] },
  { name: "Ağaç", emoji: "🌲", items: ["🌲", "🌳", "🌴", "🌵"] },
  { name: "Bina", emoji: "🏢", items: ["🏢", "🏬", "🏛️", "🏗️"] },
];

type Props = {
  open: boolean;
  onResult: (correct: boolean) => void;
  language: "tr" | "en";
};

export default function CaptchaModal({ open, onResult, language }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [items, setItems] = useState<CaptchaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      generateCaptcha();
      setSelectedItems(new Set());
      setError("");
    }
  }, [open]);

  const generateCaptcha = () => {
    // Rastgele bir kategori seç
    const targetCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    setSelectedCategory(targetCategory.name);

    // 9 resim oluştur (3x3 grid)
    const newItems: CaptchaItem[] = [];
    const targetCount = 3 + Math.floor(Math.random() * 3); // 3-5 arası hedef resim

    // Hedef kategoriden emoji'ler ekle
    for (let i = 0; i < targetCount; i++) {
      const emoji = targetCategory.items[i % targetCategory.items.length];
      newItems.push({
        id: i,
        emoji,
        category: targetCategory.name,
      });
    }

    // Diğer kategorilerden rastgele emoji'ler ekle
    const otherCategories = CATEGORIES.filter((c) => c.name !== targetCategory.name);
    for (let i = targetCount; i < 9; i++) {
      const randomCat = otherCategories[Math.floor(Math.random() * otherCategories.length)];
      const emoji = randomCat.items[Math.floor(Math.random() * randomCat.items.length)];
      newItems.push({
        id: i,
        emoji,
        category: randomCat.name,
      });
    }

    // Karıştır
    for (let i = newItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newItems[i], newItems[j]] = [newItems[j], newItems[i]];
    }

    // ID'leri yeniden ata
    newItems.forEach((item, idx) => {
      item.id = idx;
    });

    setItems(newItems);
    // Cevabı sakla
    (window as any).__captchaAnswer = new Set(
      newItems
        .map((item, idx) => (item.category === targetCategory.name ? idx : -1))
        .filter((idx) => idx !== -1)
    );
  };

  const toggleItem = (id: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setError("");
  };

  const handleSubmit = () => {
    const correctAnswer = (window as any).__captchaAnswer as Set<number>;
    
    // Seçilenlerin sayısı doğru mu?
    if (selectedItems.size !== correctAnswer.size) {
      setError("Lütfen tüm doğru resimleri seçin!");
      return;
    }

    // Tüm seçilenler doğru mu?
    let allCorrect = true;
    selectedItems.forEach((id) => {
      if (!correctAnswer.has(id)) {
        allCorrect = false;
      }
    });

    if (allCorrect && selectedItems.size === correctAnswer.size) {
      onResult(true);
    } else {
      setError("Yanlış seçim! Tekrar deneyin.");
      generateCaptcha();
      setSelectedItems(new Set());
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[420px] rounded-xl border border-pink-500/40 bg-surface-raised p-6 shadow-neon"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="text-lg font-semibold text-pink-400 mb-1">
              {language === "en" ? "Are you a robot? Verify" : "Robot musunuz? Doğrulayın"}
            </div>
            <div className="text-sm text-white/60 mb-4">
              {language === "en" ? (
                <>
                  Select all images that contain{" "}
                  <span className="font-semibold text-pink-300">
                    {selectedCategory}
                  </span>
                  .
                </>
              ) : (
                <>
                  <span className="font-semibold text-pink-300">
                    {selectedCategory}
                  </span>{" "}
                  içeren tüm resimleri seçin
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {items.map((item) => {
                const isSelected = selectedItems.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`aspect-square rounded-lg border-2 flex items-center justify-center text-4xl transition-all ${
                      isSelected
                        ? "border-pink-500 bg-pink-500/20 scale-95"
                        : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                    }`}
                  >
                    {item.emoji}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mb-3 text-sm text-red-400 text-center">{error}</div>
            )}

            <div className="flex gap-2">
              <button
                onClick={generateCaptcha}
                className="flex-1 px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition text-sm"
              >
                Yeni Soru
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition"
              >
                Doğrula
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
