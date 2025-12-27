"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Question } from "@/lib/types";

type Props = {
  open: boolean;
  question: Question | null;
  onResult: (correct: boolean) => void;
  language: "tr" | "en";
};

export default function QuestionModal({ open, question, onResult, language }: Props) {
  const title =
    language === "en" ? "General Knowledge Question" : "Genel Kültür Sorusu";

  return (
    <AnimatePresence>
      {open && question ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[360px] rounded-xl border border-neon-blue/40 bg-surface-raised p-6 shadow-neon"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            >
            <div className="text-lg font-semibold text-neon-blue">
              {title}
            </div>
            <div className="mt-3 text-sm text-white/80">{question.prompt}</div>
            <div className="mt-4 space-y-2">
              {question.options.map((opt) => (
                <button
                  key={opt}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-white hover:border-neon-blue/60 hover:bg-neon-blue/10"
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



