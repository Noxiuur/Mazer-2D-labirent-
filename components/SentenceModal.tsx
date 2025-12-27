"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type SentenceQuestion = {
  id: number;
  mode: "fill" | "order";
  text: string; // cümle veya doğru cümle
  options: string[];
  answer: string;
  words?: string[]; // order modunda gösterilecek kelimeler
};

const SENTENCES: SentenceQuestion[] = [
  // Boşluk doldurma
  {
    id: 1,
    mode: "fill",
    text: "I ____ to school every day.",
    options: ["go", "goes", "going"],
    answer: "go"
  },
  {
    id: 2,
    mode: "fill",
    text: "She ____ coffee in the morning.",
    options: ["drink", "drinks", "drinking"],
    answer: "drinks"
  },
  {
    id: 3,
    mode: "fill",
    text: "They are ____ a movie now.",
    options: ["watch", "watched", "watching"],
    answer: "watching"
  },
  {
    id: 4,
    mode: "fill",
    text: "He ____ not like cold weather.",
    options: ["do", "does", "is"],
    answer: "does"
  },
  {
    id: 5,
    mode: "fill",
    text: "We ____ English every day.",
    options: ["study", "studies", "studying"],
    answer: "study"
  },
  {
    id: 6,
    mode: "fill",
    text: "It is ____ today.",
    options: ["rain", "raining", "rainy"],
    answer: "rainy"
  },
  {
    id: 7,
    mode: "fill",
    text: "I have ____ apples in my bag.",
    options: ["any", "some", "much"],
    answer: "some"
  },
  // Kelimelerle cümle kurma (doğru cümleyi seç)
  {
    id: 8,
    mode: "order",
    text: "I usually get up at seven o'clock.",
    words: ["up", "o'clock", "usually", "get", "I", "seven", "at"],
    options: [
      "I usually get up at seven o'clock.",
      "Usually I up get at seven o'clock.",
      "I get usually up seven at o'clock."
    ],
    answer: "I usually get up at seven o'clock."
  },
  {
    id: 9,
    mode: "order",
    text: "My brother plays football every weekend.",
    words: ["brother", "plays", "weekend", "every", "My", "football"],
    options: [
      "My brother plays football every weekend.",
      "My brother every weekend plays football.",
      "Football my brother plays every weekend."
    ],
    answer: "My brother plays football every weekend."
  },
  {
    id: 10,
    mode: "order",
    text: "We are studying English now.",
    words: ["studying", "We", "are", "English", "now"],
    options: [
      "We are studying English now.",
      "We studying are English now.",
      "We are English studying now."
    ],
    answer: "We are studying English now."
  }
];

type Props = {
  open: boolean;
  onResult: (correct: boolean) => void;
  language: "tr" | "en";
};

export default function SentenceModal({ open, onResult, language }: Props) {
  const [question, setQuestion] = useState<SentenceQuestion | null>(null);

  useEffect(() => {
    if (open) {
      const random =
        SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
      setQuestion(random);
    } else {
      setQuestion(null);
    }
  }, [open]);

  if (!open || !question) {
    return (
      <AnimatePresence>
        {false && <></>}
      </AnimatePresence>
    );
  }

  const isOrder = question.mode === "order";

  const title =
    language === "en"
      ? isOrder
        ? "Build the Sentence"
        : "Complete the Sentence"
      : isOrder
      ? "Cümle Kur"
      : "Cümleyi Tamamla";

  const subtitle =
    language === "en"
      ? isOrder
        ? "Choose the correct sentence using the given words."
        : "Choose the correct word to complete the sentence."
      : isOrder
      ? "Verilen kelimelerle kurulmuş doğru cümleyi seç."
      : "Cümleyi tamamlamak için doğru kelimeyi seç.";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[380px] rounded-xl border border-neon-green/50 bg-surface-raised p-6 shadow-neon"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="text-lg font-semibold text-neon-green mb-1">
              {title}
            </div>
            <div className="text-xs text-white/60 mb-3">{subtitle}</div>

            {isOrder && question.words ? (
              <div className="mb-3 text-[11px] text-white/70">
                {language === "en" ? "Words:" : "Kelimeler:"}{" "}
                <span className="font-mono">
                  {question.words.join("  •  ")}
                </span>
              </div>
            ) : null}

            <div className="mt-2 text-sm text-white/90 mb-4">
              {question.mode === "fill" ? question.text : ""}
            </div>
            <div className="space-y-2">
              {question.options.map((opt) => (
                <button
                  key={opt}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-white hover:border-neon-green/60 hover:bg-neon-green/10 text-xs"
                  onClick={() => onResult(opt === question.answer)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

