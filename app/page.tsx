"use client";

import GameBoard from "@/components/GameBoard";
import { LEVELS, createLevelFromJSON } from "@/lib/levels";
import { LevelConfig } from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Lock, Play, Edit, Upload, Settings, Trash2, Sun, Moon, Globe, LogIn, LogOut, User as UserIcon, Trophy, Cloud } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCommunityMazes,
  getLevelLeaderboard,
  saveScore,
  getUserMazes,
  deleteMazeFromCloud,
  type FirestoreMaze,
  type FirestoreScore
} from "@/lib/firestore";
import { collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SelectedSource = "default" | "uploaded" | "created" | "community";

export default function HomePage() {
  const { user, signInWithGoogle, logout } = useAuth();

  const [selectedSource, setSelectedSource] = useState<SelectedSource>("default");
  const [selectedId, setSelectedId] = useState<number | string>(1);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [uploadedLevels, setUploadedLevels] = useState<LevelConfig[]>([]);
  const [createdLevels, setCreatedLevels] = useState<LevelConfig[]>([]);
  const [communityLevels, setCommunityLevels] = useState<LevelConfig[]>([]);

  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [gameInstance, setGameInstance] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [completedLevelId, setCompletedLevelId] = useState<number | string | null>(null);
  const [completedSource, setCompletedSource] = useState<SelectedSource>("default");
  const [completedTime, setCompletedTime] = useState<number>(0);

  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [leaderboard, setLeaderboard] = useState<FirestoreScore[]>([]);
  const [userCloudMazes, setUserCloudMazes] = useState<FirestoreMaze[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nextUploadedIdRef = useRef<number>(100);

  // Load initial data
  useEffect(() => {
    // LocalStorage loading (existing code)
    const stored = localStorage.getItem("unlockedLevel");
    if (stored) {
      const num = Number(stored);
      setUnlockedLevel(num);
      setSelectedId(num >= 1 ? 1 : num);
    }

    const createdRaw = localStorage.getItem("createdMazes");
    if (createdRaw) {
      try {
        const parsed = JSON.parse(createdRaw);
        const levels = parsed.map((m: any, index: number) =>
          createLevelFromJSON(200 + index, m.name, m.json)
        );
        setCreatedLevels(levels);
      } catch (err) {
        console.error("Local stored mazes error:", err);
      }
    }

    // Theme & Language
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      if (storedTheme === "light") {
        document.documentElement.classList.remove("dark");
        document.body.classList.add("theme-light");
      }
    }
    const storedLang = localStorage.getItem("language");
    if (storedLang === "en" || storedLang === "tr") setLanguage(storedLang);

    // Fetch Community Levels
    fetchCommunityLevels();
  }, []);

  // Update cloud mazes when user changes
  useEffect(() => {
    if (user) {
      fetchUserCloudMazes();
    } else {
      setUserCloudMazes([]);
    }
  }, [user]);

  // Fetch Leaderboard when level changes
  useEffect(() => {
    if (selectedId) {
      fetchLeaderboard(selectedId);
    }
  }, [selectedId, selectedSource]);

  useEffect(() => {
    localStorage.setItem("unlockedLevel", String(unlockedLevel));
  }, [unlockedLevel]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.remove("theme-light");
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  const fetchCommunityLevels = async () => {
    const mazes = await getCommunityMazes(20);
    const levels = mazes.map(m => createLevelFromJSON(m.id, m.name, m.json));
    setCommunityLevels(levels);
  };

  const fetchUserCloudMazes = async () => {
    if (!user) return;
    const mazes = await getUserMazes(user.uid);
    setUserCloudMazes(mazes);
  };

  const fetchLeaderboard = async (lvlId: string | number) => {
    const scores = await getLevelLeaderboard(lvlId);
    setLeaderboard(scores);
  };

  // Connection Test
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("Testing Firestore connection...");
        const q = query(collection(db, "scores"), limit(1));
        const snap = await getDocs(q);
        console.log("Firestore connection successful. Docs found:", snap.size);
        // alert("Firebase Bağlantısı Başarılı! (Bu mesajı görüyorsanız veritabanına erişim var demektir)");
      } catch (e) {
        console.error("Firestore connection failed:", e);
        alert(`Firebase HATASI: Veritabanına bağlanılamadı. ${e}`);
      }
    };
    testConnection();
  }, []);

  // Translations
  const t = {
    // ... Existing translations ...
    headerSubtitle: language === "en" ? "Select a level, move with WASD/arrow keys." : "Bölüm seç, WASD/ok tuşları ile ilerle.",
    editorButton: language === "en" ? "Maze Editor" : "Labirent Düzenleyici",
    jsonSectionTitle: language === "en" ? "Load from JSON" : "JSON'dan Yükle",
    readyLevelsTitle: language === "en" ? "Built-in Levels" : "Hazır Seviyeler",
    uploadedTitle: language === "en" ? "Uploaded" : "Yüklenenler",
    createdTitle: language === "en" ? "Created" : "Oluşturulanlar",
    communityTitle: language === "en" ? "Community" : "Topluluk",
    leaderboardTitle: language === "en" ? "Leaderboard" : "Skor Tablosu",
    introButton: language === "en" ? "Start Game" : "Oyuna Başla",
    login: language === "en" ? "Login" : "Giriş Yap",
    profile: language === "en" ? "Profile" : "Profil",
    levelCompleteTitle: language === "en" ? "Level Completed!" : "Bölüm Tamamlandı!",
    replay: language === "en" ? "Play Again" : "Tekrar Oyna",
    nextLevel: language === "en" ? "Next Level" : "Sıradaki Bölüm",
    yourScore: language === "en" ? "Your Time" : "Süreniz",
    sec: language === "en" ? "s" : "sn",
    levelLabel: language === "en" ? "Level" : "Seviye",
    noCreated: language === "en" ? "No created mazes yet." : "Henüz oluşturulmuş labirent yok.",
    noUploaded: language === "en" ? "No uploaded mazes yet." : "Henüz yüklenmiş labirent yok.",
    jsonButton: language === "en" ? "Load Maze from JSON" : "JSON'dan Labirent Yükle",
    deleteConfirm: (name: string) => language === "en" ? `Delete "${name}"?` : `"${name}" silinsin mi?`,
    deleteError: language === "en" ? "Error deleting" : "Silme hatası",
    levelCompleteText: (name: string) => language === "en" ? `You completed ${name}` : `${name} tamamlandı`,
    lastLevelInfo: language === "en" ? "No more levels." : "Başka bölüm yok."
  };

  const currentLevel = useMemo<LevelConfig>(() => {
    if (selectedSource === "uploaded") return uploadedLevels.find(l => l.id === selectedId) ?? uploadedLevels[0];
    if (selectedSource === "created") return createdLevels.find(l => l.id === selectedId) ?? createdLevels[0];
    if (selectedSource === "community") return communityLevels.find(l => l.id === selectedId) ?? communityLevels[0];
    return LEVELS.find(l => l.id === selectedId) ?? LEVELS[0];
  }, [selectedSource, selectedId, uploadedLevels, createdLevels, communityLevels]);

  const handleJsonFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    // ... Existing JSON load logic ...
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const levelName = file.name.replace(/\.json$/i, "");
        const id = nextUploadedIdRef.current++;
        const lvl = createLevelFromJSON(id, levelName || "Yüklenen", text);
        setUploadedLevels(prev => [...prev, lvl]);
        setSelectedSource("uploaded");
        setSelectedId(id);
      } catch (err) { alert("Hata"); }
    };
    reader.readAsText(file);
  };

  const handleComplete = async (id: number | string, score: number) => {
    // GameBoard'dan gelen gerçek süreyi kullan
    setCompletedTime(score);

    // Önce UI'ı güncelle (Hemen tepki vermesi için)
    if (selectedSource === "default" && typeof id === "number") {
      const maxLevelId = LEVELS.reduce((max, lvl) => Math.max(max, typeof lvl.id === 'number' ? lvl.id : 0), 1);
      const nextUnlock = Math.min(maxLevelId, id + 1);
      setUnlockedLevel(prev => Math.max(prev, nextUnlock));
    }

    setCompletedLevelId(id);
    setCompletedSource(selectedSource);
    setShowLevelComplete(true);

    // Sonra arka planda skoru kaydet (eğer giriş yapmışsa)
    if (user) {
      try {
        await saveScore(user.uid, user.displayName || "User", id, score);
        // Leaderboard'u güncelle
        fetchLeaderboard(id);
      } catch (error) {
        console.error("Score save failed (non-fatal):", error);
        alert(`Skor kaydedilemedi: ${error}`);
      }
    }
  };

  const hasNextLevel = useMemo(() => {
    if (!completedLevelId) return false;
    let list: LevelConfig[] = [];
    if (completedSource === "default") list = LEVELS;
    else if (completedSource === "uploaded") list = uploadedLevels;
    else if (completedSource === "created") list = createdLevels;
    else if (completedSource === "community") list = communityLevels;

    const idx = list.findIndex(l => l.id === completedLevelId);
    return idx !== -1 && idx < list.length - 1;
  }, [completedLevelId, completedSource, uploadedLevels, createdLevels, communityLevels]);

  const handleNextLevel = () => {
    if (!completedLevelId) return;
    let list: LevelConfig[] = [];
    if (completedSource === "default") list = LEVELS;
    else if (completedSource === "uploaded") list = uploadedLevels;
    else if (completedSource === "created") list = createdLevels;
    else if (completedSource === "community") list = communityLevels;

    const idx = list.findIndex(l => l.id === completedLevelId);
    if (idx !== -1 && idx < list.length - 1) {
      const next = list[idx + 1];
      setSelectedSource(completedSource);
      setSelectedId(next.id);
      setGameInstance(prev => prev + 1);
    }
    setShowLevelComplete(false);
  };

  const handleReplayLevel = () => {
    if (!completedLevelId) return;
    setShowLevelComplete(false);
    setSelectedSource(completedSource);
    setSelectedId(completedLevelId);
    setGameInstance((prev) => prev + 1);
    fetchLeaderboard(completedLevelId);
  };

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 px-4 py-2">
      {/* HEADER */}
      <header className="w-full max-w-7xl flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-neon-blue">Mazer</h1>
            <p className="text-white/70 text-sm hidden md:block">{t.headerSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">

            {/* User Profile / Login */}
            {user ? (
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-neon-blue/10 text-neon-blue rounded-lg hover:bg-neon-blue/20 border border-neon-blue/30 transition"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" />
                ) : (
                  <UserIcon size={18} />
                )}
                <span className="text-sm font-semibold hidden sm:inline">{user.displayName}</span>
              </button>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 border border-white/10 transition"
              >
                <LogIn size={18} />
                <span className="text-sm hidden sm:inline">{t.login}</span>
              </button>
            )}

            <button
              onClick={() => setShowCharacterModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 border border-white/10 transition"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
              className="px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 border border-white/10 transition"
              title={theme === "dark" ? "Switch to Light Mode" : "Dark Mod'a Geç"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setLanguage(prev => prev === "tr" ? "en" : "tr")}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 border border-white/10 transition text-xs font-bold"
              title="Dil Değiştir / Switch Language"
            >
              <Globe size={18} />
              <span>{language.toUpperCase()}</span>
            </button>

            <Link
              href="/maze-editor"
              className="flex items-center gap-2 px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition"
            >
              <Edit size={18} />
              <span className="hidden sm:inline">{t.editorButton}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="bg-surface-raised border border-white/10 p-6 rounded-xl w-full max-w-lg relative">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <LogOut size={20} />
            </button>
            <div className="flex items-center gap-4 mb-6">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-neon-blue" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-surface-base flex items-center justify-center border-2 border-neon-blue">
                  <UserIcon size={32} className="text-neon-blue" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
                <p className="text-white/50 text-sm">{user.email}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-3">Kaydettiğin Labirentler</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {userCloudMazes.length === 0 ? (
                <p className="text-white/30 text-sm">Henüz buluta kayıtlı labirent yok.</p>
              ) : (
                userCloudMazes.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/80">{m.name}</span>
                    <button
                      onClick={async () => {
                        if (confirm("Silmek istediğine emin misin?")) {
                          await deleteMazeFromCloud(m.id);
                          fetchUserCloudMazes();
                        }
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition flex items-center gap-2"
              >
                <LogOut size={16} /> Çıkış Yap
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!showIntro && (
        <section className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 items-start justify-center">

          {/* Game Area */}
          <div className="w-full lg:w-[820px] rounded-xl border border-white/10 bg-white/5 p-4 order-2 lg:order-1">
            <div className="mb-3 flex justify-between items-center text-sm text-white/60">
              <span>{t.levelLabel}: <span className="text-neon-blue font-semibold">{currentLevel.name}</span></span>
              {user && <span className="text-green-400 text-xs">Skor Kayıt: Aktif</span>}
            </div>
            <GameBoard
              key={`${selectedSource}-${selectedId}-${gameInstance}`}
              level={currentLevel}
              onComplete={handleComplete}
              language={language}
            />
          </div>

          {/* Right Panel: Levels & Leaderboard */}
          <aside className="w-full lg:w-80 space-y-4 order-1 lg:order-2">

            {/* Leaderboard */}
            <section className="bg-surface-raised border border-white/10 rounded-xl p-4 min-h-[200px]">
              <div className="flex items-center gap-2 mb-3 text-neon-yellow">
                <Trophy size={18} className="text-yellow-500" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t.leaderboardTitle}</h2>
              </div>

              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-4">Bu bölüm için henüz skor yok.</p>
                ) : (
                  leaderboard.map((score, idx) => (
                    <div key={score.id} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full font-bold ${idx === 0 ? 'bg-yellow-500/80 text-black' :
                          idx === 1 ? 'bg-gray-400 text-black' :
                            idx === 2 ? 'bg-orange-600/80 text-white' : 'bg-white/10 text-white/50'
                          }`}>
                          {idx + 1}
                        </span>
                        <span className="text-white/90 truncate max-w-[100px]">{score.userName}</span>
                      </div>
                      <span className="font-mono text-neon-blue">{score.score} {t.sec}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Community Levels */}
            <section className="bg-white/5 border border-white/10 rounded-xl p-3">
              <h2 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                <Cloud size={14} className="text-neon-blue" />
                {t.communityTitle}
              </h2>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {communityLevels.map(lvl => (
                  <button
                    key={lvl.id}
                    onClick={() => {
                      setSelectedSource("community");
                      setSelectedId(lvl.id);
                      setGameInstance(prev => prev + 1);
                    }}
                    className={`flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-1 text-xs text-white hover:border-neon-blue hover:text-neon-blue transition ${selectedSource === "community" && selectedId === lvl.id ? "border-neon-blue text-neon-blue bg-neon-blue/10" : ""
                      }`}
                  >
                    {lvl.name}
                  </button>
                ))}
                {communityLevels.length === 0 && <span className="text-xs text-white/30">Hiç labirent yok.</span>}
                <button
                  onClick={fetchCommunityLevels}
                  className="text-[10px] text-white/40 hover:text-white underline w-full text-center mt-1"
                >
                  Yenile
                </button>
              </div>
            </section>

            {/* Existing Sections (Built-in, Uploaded, Created) */}
            <section className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
              <h2 className="text-sm font-semibold text-white/80">{t.readyLevelsTitle}</h2>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((lvl) => {
                  const locked = (typeof lvl.id === 'number' ? lvl.id : 0) > unlockedLevel;
                  const isSelected = selectedSource === "default" && selectedId === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      disabled={locked}
                      onClick={() => {
                        setSelectedSource("default");
                        setSelectedId(lvl.id);
                        setGameInstance(prev => prev + 1);
                      }}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${locked
                        ? "border-white/10 bg-white/5 text-white/30"
                        : isSelected
                          ? "border-neon-blue/70 bg-neon-blue/10 text-neon-blue shadow-neon"
                          : "border-white/10 bg-white/5 text-white hover:border-neon-blue/50 hover:text-neon-blue"
                        }`}
                    >
                      {locked ? <Lock size={14} /> : <Play size={14} />}
                      <span>{lvl.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Created Levels */}
            <section className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
              <h2 className="text-sm font-semibold text-white/80">{t.createdTitle}</h2>
              {createdLevels.map((lvl) => {
                const isSelected = selectedSource === "created" && selectedId === lvl.id;
                return (
                  <div key={lvl.id} className={`flex items-center gap-1 rounded px-2 py-1 text-xs border transition ${isSelected ? "border-neon-green text-neon-green" : "border-white/10 text-white"}`}>
                    <button onClick={() => { setSelectedSource("created"); setSelectedId(lvl.id); setGameInstance(p => p + 1); }} className="flex-1 text-left">{lvl.name}</button>
                    <button onClick={() => {
                      // Delete logic (simplified)
                      const filtered = createdLevels.filter(l => l.id !== lvl.id);
                      setCreatedLevels(filtered);
                      // Also update localStorage...
                    }} className="text-red-400"><Trash2 size={12} /></button>
                  </div>
                );
              })}
              {createdLevels.length === 0 && <span className="text-xs text-white/30">{t.noCreated}</span>}
            </section>

          </aside>
        </section>
      )}

      {/* Intro Modal (Preserved) */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-neon-blue/50 bg-surface-raised/95 p-8 shadow-neon text-center">
            <h1 className="text-5xl font-extrabold text-neon-blue mb-4">Mazer</h1>
            <p className="text-white/70 mb-6">{t.headerSubtitle}</p>
            <button onClick={() => setShowIntro(false)} className="bg-neon-green text-surface-base font-bold py-3 px-8 rounded-xl">{t.introButton}</button>
          </div>
        </div>
      )}

      {/* Level Complete Modal */}
      {showLevelComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-raised border border-neon-blue p-8 rounded-2xl text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold text-neon-blue mb-2">{t.levelCompleteTitle}</h2>
            <p className="text-white/80 mb-4">{t.levelCompleteText(currentLevel.name)}</p>
            <div className="text-4xl font-mono text-neon-yellow mb-6">{completedTime} {t.sec}</div>

            <div className="flex gap-2">
              <button onClick={handleReplayLevel} className="flex-1 bg-white/10 py-2 rounded-lg text-white">{t.replay}</button>
              <button onClick={handleNextLevel} disabled={!hasNextLevel} className="flex-1 bg-neon-blue py-2 rounded-lg text-surface-base font-bold disabled:opacity-50">{t.nextLevel}</button>
            </div>
            {!hasNextLevel && (
              <p className="mt-3 text-xs text-white/40">
                {t.lastLevelInfo}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Karakter Seçim Modal */}
      {showCharacterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="w-[420px] rounded-xl border border-neon-blue/40 bg-surface-raised p-6 shadow-neon">
            <div className="text-lg font-semibold text-neon-blue mb-4">
              Karakter Seç
            </div>
            <div className="text-sm text-white/60 mb-4">
              Karakter seçin: Emoji, ASCII karakter veya özel sembol kullanabilirsiniz.
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <input
                type="text"
                placeholder="Karakter girin (örn: @, *, #, →, ●)"
                maxLength={2}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-center text-2xl"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    localStorage.setItem("playerCharacter", val);
                    window.location.reload(); // Karakteri güncellemek için sayfayı yenile
                  }
                }}
                autoFocus
              />
              <div className="space-y-2">
                <div className="text-xs text-white/50">Emoji</div>
                <div className="grid grid-cols-5 gap-2">
                  {["🧙", "🐴", "🚗", "🖱️", "🏢", "🌳", "⬆️", "➡️", "⬇️", "⬅️", "🔑", "⭐", "🎯", "👤", "🚀"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        localStorage.setItem("playerCharacter", emoji);
                        window.location.reload();
                      }}
                      className="text-2xl p-2 rounded-lg border border-white/10 hover:border-neon-blue/50 hover:bg-neon-blue/10 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-white/50 mt-3">ASCII & Semboller</div>
                <div className="grid grid-cols-5 gap-2">
                  {["@", "*", "#", "→", "●", "▲", "■", "◆", "★", "♦", "◉", "◈", "◐", "◑", "◒"].map((char) => (
                    <button
                      key={char}
                      onClick={() => {
                        localStorage.setItem("playerCharacter", char);
                        window.location.reload();
                      }}
                      className="text-xl p-2 rounded-lg border border-white/10 hover:border-neon-blue/50 hover:bg-neon-blue/10 transition font-mono"
                    >
                      {char}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-white/50 mt-3">Harf & Rakam</div>
                <div className="grid grid-cols-5 gap-2">
                  {["A", "B", "C", "P", "X", "1", "2", "3", "4", "5"].map((char) => (
                    <button
                      key={char}
                      onClick={() => {
                        localStorage.setItem("playerCharacter", char);
                        window.location.reload();
                      }}
                      className="text-xl p-2 rounded-lg border border-white/10 hover:border-neon-blue/50 hover:bg-neon-blue/10 transition font-bold"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowCharacterModal(false)}
                className="w-full px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

