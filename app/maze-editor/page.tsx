"use client";

import { useState, useEffect, useRef } from "react";
import { MapMatrix, Vector2 } from "@/lib/types";
import {
  createEmptyMatrix,
  addOuterWalls,
  createMazeFromConfig,
  loadMazeFromJSON,
  type MazeConfig
} from "@/lib/mazeGenerator";
import { Save, Download, Upload, Trash2, FileText, X, Key, Cloud } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { saveMazeToCloud } from "@/lib/firestore";

type CellType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const CELL_NAMES: Record<CellType, string> = {
  0: "Yol",
  1: "Duvar",
  2: "Başlangıç",
  3: "Çıkış",
  4: "Kapı",
  5: "Düşman",
  6: "Doğrulama Kapısı",
  7: "Anahtar",
  8: "Anahtarlı Çıkış",
  9: "Yanar Duvar"
};

const CELL_COLORS: Record<CellType, string> = {
  0: "bg-surface-base/50",
  1: "bg-surface-raised",
  2: "bg-yellow-500/60",
  3: "bg-blue-500/60",
  4: "bg-purple-500/60",
  5: "bg-red-500/60",
  6: "bg-pink-500/60",
  7: "bg-yellow-500/60",
  8: "bg-blue-500/60",
  9: "bg-red-700/80"
};

export default function MazeEditor() {
  const [width, setWidth] = useState(40);
  const [height, setHeight] = useState(40);
  const [matrix, setMatrix] = useState<MapMatrix>(createEmptyMatrix(40, 40));
  const [selectedTool, setSelectedTool] = useState<CellType>(1);
  const [zoom, setZoom] = useState(1);
  const [jsonData, setJsonData] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [enemyPaths, setEnemyPaths] = useState<Map<string, Vector2[]>>(new Map());
  const [selectedEnemy, setSelectedEnemy] = useState<Vector2 | null>(null);
  const [isPathEditing, setIsPathEditing] = useState(false);
  const [selectedDoor, setSelectedDoor] = useState<Vector2 | null>(null);
  const [doorClicks, setDoorClicks] = useState<Map<string, number>>(new Map());
  const [showDoorModal, setShowDoorModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, signInWithGoogle } = useAuth();

  // Matrisi yeniden oluştur
  useEffect(() => {
    const newMatrix = createEmptyMatrix(width, height);
    addOuterWalls(newMatrix);
    setMatrix(newMatrix);
  }, [width, height]);

  // Hücreye tıkla veya üzerine gel (çizim modunda)
  const handleMouseDown = (x: number, y: number) => {
    setIsDrawing(true);
    paintCell(x, y);
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isDrawing) {
      paintCell(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const paintCell = (x: number, y: number) => {
    // Path düzenleme modunda - sadece path noktaları ekle/kaldır
    if (isPathEditing && selectedEnemy) {
      const key = `${selectedEnemy.x},${selectedEnemy.y}`;
      const currentPath = enemyPaths.get(key) || [];

      // Eğer path'te zaten varsa, kaldır
      const exists = currentPath.some(p => p.x === x && p.y === y);
      if (exists) {
        setEnemyPaths(prev => {
          const newPaths = new Map(prev);
          const filtered = currentPath.filter(p => !(p.x === x && p.y === y));
          // En az bir nokta kalmalı (düşmanın kendisi)
          if (filtered.length === 0) {
            newPaths.set(key, [{ x: selectedEnemy.x, y: selectedEnemy.y }]);
          } else {
            newPaths.set(key, filtered);
          }
          return newPaths;
        });
      } else {
        // Yeni nokta ekle
        setEnemyPaths(prev => {
          const newPaths = new Map(prev);
          newPaths.set(key, [...currentPath, { x, y }]);
          return newPaths;
        });
      }
      return; // Path düzenleme modunda matrisi değiştirme
    }

    setMatrix((prev) => {
      const newMatrix = prev.map((row) => row.slice());
      const currentValue = newMatrix[y][x];

      // Eğer aynı değere tıklanırsa, yol yap (sil)
      if (currentValue === selectedTool) {
        newMatrix[y][x] = 0;
        // Düşman silinirse path'ini de sil
        if (currentValue === 5) {
          const key = `${x},${y}`;
          setEnemyPaths(prev => {
            const newPaths = new Map(prev);
            newPaths.delete(key);
            return newPaths;
          });
        }
      } else {
        // Özel durumlar: Başlangıç ve çıkış tek olmalı
        if (selectedTool === 2) {
          // Eski başlangıcı sil
          for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
              if (newMatrix[i][j] === 2) newMatrix[i][j] = 0;
            }
          }
        }
        if (selectedTool === 3) {
          // Eski çıkışı sil
          for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
              if (newMatrix[i][j] === 3) newMatrix[i][j] = 0;
            }
          }
        }
        if (selectedTool === 7) {
          // Eski anahtarı sil
          for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
              if (newMatrix[i][j] === 7) newMatrix[i][j] = 0;
            }
          }
        }
        if (selectedTool === 8) {
          // Eski anahtarlı çıkışı sil
          for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
              if (newMatrix[i][j] === 8) newMatrix[i][j] = 0;
            }
          }
        }
        // Eski düşmanı sil (path'ini de sil)
        if (currentValue === 5) {
          const key = `${x},${y}`;
          setEnemyPaths(prev => {
            const newPaths = new Map(prev);
            newPaths.delete(key);
            return newPaths;
          });
        }
        // Eski kapıyı sil (tıklama sayısını da sil)
        if (currentValue === 4) {
          const key = `${x},${y}`;
          setDoorClicks(prev => {
            const newClicks = new Map(prev);
            newClicks.delete(key);
            return newClicks;
          });
        }
        newMatrix[y][x] = selectedTool;

        // Yeni düşman eklendiğinde varsayılan path oluştur
        if (selectedTool === 5) {
          const key = `${x},${y}`;
          setEnemyPaths(prev => {
            const newPaths = new Map(prev);
            if (!newPaths.has(key)) {
              newPaths.set(key, [{ x, y }]);
            }
            return newPaths;
          });
        }
        // Yeni kapı eklendiğinde varsayılan tıklama sayısı
        if (selectedTool === 4) {
          const key = `${x},${y}`;
          setDoorClicks(prev => {
            const newClicks = new Map(prev);
            if (!newClicks.has(key)) {
              newClicks.set(key, 10);
            }
            return newClicks;
          });
        }
      }
      return newMatrix;
    });
  };

  // Düşman seçildiğinde path düzenleme modunu aç
  const handleEnemyClick = (x: number, y: number) => {
    if (matrix[y][x] === 5) {
      if (selectedEnemy && selectedEnemy.x === x && selectedEnemy.y === y) {
        // Aynı düşmana tekrar tıklanırsa modu kapat
        setSelectedEnemy(null);
        setIsPathEditing(false);
      } else {
        setSelectedEnemy({ x, y });
        setIsPathEditing(true);
      }
    }
  };

  // Kapı seçildiğinde tıklama sayısı modalını aç
  const handleDoorClick = (x: number, y: number) => {
    if (matrix[y][x] === 4) {
      setSelectedDoor({ x, y });
      setShowDoorModal(true);
    }
  };

  // JSON'dan yükle
  const loadFromJSON = () => {
    try {
      if (!jsonData.trim()) {
        alert("Lütfen JSON verisi girin!");
        return;
      }
      const config = loadMazeFromJSON(jsonData);
      setWidth(config.width);
      setHeight(config.height);
      const newMatrix = createMazeFromConfig(config);
      setMatrix(newMatrix);

      // Düşman path'lerini yükle
      if (config.enemies) {
        const paths = new Map<string, Vector2[]>();
        config.enemies.forEach((enemy) => {
          const key = `${enemy.position.x},${enemy.position.y}`;
          paths.set(key, enemy.path || [enemy.position]);
        });
        setEnemyPaths(paths);
      }

      alert("Labirent yüklendi!");
    } catch (error) {
      alert("JSON yüklenirken hata: " + (error as Error).message);
      console.error("Yükleme hatası:", error);
    }
  };

  // Dosyadan yükle
  const loadFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setJsonData(text);
      // Otomatik yükle
      const config = loadMazeFromJSON(text);
      setWidth(config.width);
      setHeight(config.height);
      const newMatrix = createMazeFromConfig(config);
      setMatrix(newMatrix);

      // Düşman path'lerini yükle
      if (config.enemies) {
        const paths = new Map<string, Vector2[]>();
        config.enemies.forEach((enemy) => {
          const key = `${enemy.position.x},${enemy.position.y}`;
          paths.set(key, enemy.path || [enemy.position]);
        });
        setEnemyPaths(paths);
      }

      // Kapı tıklama sayılarını yükle
      if (config.doors) {
        const clicks = new Map<string, number>();
        config.doors.forEach((door) => {
          const key = `${door.position.x},${door.position.y}`;
          clicks.set(key, door.requiredClicks || 10);
        });
        setDoorClicks(clicks);
      }

      alert("Dosya yüklendi!");
    } catch (error) {
      alert("Dosya yüklenirken hata: " + (error as Error).message);
      console.error("Dosya yükleme hatası:", error);
    }

    // Input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // JSON'a çevir ve göster (matris verisi ile birlikte)
  const buildConfig = () => {
    const config: any = {
      width,
      height,
      matrix: matrix.map((row) => row.slice()),
    };

    // Başlangıç, çıkış, anahtar ve anahtarlı çıkış bul
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = matrix[y][x];
        if (value === 2) config.start = { x, y };
        if (value === 3) config.exit = { x, y };
        if (value === 7) config.key = { id: "key-1", position: { x, y } };
        if (value === 8) config.lockedExit = { x, y };
      }
    }

    // Kapılar, doğrulama kapıları ve düşmanlar
    const doors: Array<{ position: Vector2; requiredClicks: number }> = [];
    const verificationDoors: Array<{ position: Vector2 }> = [];
    const enemies: Array<{ position: Vector2; path: Vector2[] }> = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = matrix[y][x];
        if (value === 4) {
          const key = `${x},${y}`;
          const clicks = doorClicks.get(key) || 10;
          doors.push({
            position: { x, y },
            requiredClicks: clicks,
          });
        }
        if (value === 6) {
          verificationDoors.push({
            position: { x, y },
          });
        }
        if (value === 5) {
          const key = `${x},${y}`;
          const path = enemyPaths.get(key) || [{ x, y }];
          enemies.push({
            position: { x, y },
            path: path,
          });
        }
      }
    }

    if (doors.length > 0) config.doors = doors;
    if (verificationDoors.length > 0) config.verificationDoors = verificationDoors;
    if (enemies.length > 0) config.enemies = enemies;

    return config;
  };
  const exportToJSON = () => {
    const config = buildConfig();
    const json = JSON.stringify(config, null, 2);
    setJsonData(json);

    // Kopyala
    navigator.clipboard.writeText(json);
    alert("JSON kopyalandı! Matris verisi (duvarlar) dahil. Aşağıdaki textarea'da görüntüleniyor.");
  };

  // JSON'u indir
  const downloadJSON = () => {
    if (!jsonData) {
      exportToJSON();
      return;
    }
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "maze.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Temizle
  const clearMaze = () => {
    if (confirm("Tüm labirenti temizlemek istediğinize emin misiniz?")) {
      const newMatrix = createEmptyMatrix(width, height);
      addOuterWalls(newMatrix);
      setMatrix(newMatrix);
    }
  };
  const saveForGame = () => {
    const name = prompt("Labirent ismi:");
    if (!name) return;

    const config = buildConfig();
    const entry = {
      id: Date.now().toString(),
      name,
      json: JSON.stringify(config),
    };

    try {
      const raw = localStorage.getItem("createdMazes");
      const list = raw ? JSON.parse(raw) : [];
      list.push(entry);
      localStorage.setItem("createdMazes", JSON.stringify(list));
      alert("Labirent oyun ekranına kaydedildi! Ana ekrandaki 'Oluşturulanlar' kısmından oynayabilirsin.");
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      alert("Labirent kaydedilirken bir hata oluştu.");
    }
  };

  // Cloud'a kaydet
  const handleCloudSave = async () => {
    if (!user) {
      if (confirm("Buluta kaydetmek için giriş yapmalısınız. Giriş yapmak ister misiniz?")) {
        try {
          await signInWithGoogle();
        } catch (err) {
          alert("Giriş yapılamadı.");
          return;
        }
      }
      return;
    }

    const name = prompt("Labirent ismi (Bulut):");
    if (!name) return;

    const config = buildConfig();
    const json = JSON.stringify(config);

    try {
      await saveMazeToCloud(user.uid, user.displayName || "Anonim", name, json);
      alert("Labirent buluta kaydedildi! Ana sayfada 'Topluluk' sekmesinde görebilirsiniz.");
    } catch (err) {
      console.error("Bulut kayıt hatası:", err);
      alert("Kaydedilirken bir hata oluştu: " + (err as Error).message);
    }
  };

  const cellSize = Math.max(8, Math.min(20, 600 / Math.max(width, height))) * zoom;

  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neon-blue">Labirent Düzenleyici</h1>
          <div className="flex gap-2">
            <button
              onClick={exportToJSON}
              className="flex items-center gap-2 px-4 py-2 bg-neon-blue/20 text-neon-blue rounded-lg hover:bg-neon-blue/30 transition"
            >
              <Save size={18} />
              JSON&apos;a Çevir
            </button>
            <button
              onClick={saveForGame}
              className="flex items-center gap-2 px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition"
            >
              <Save size={18} />
              Oyunda Kaydet
            </button>
            <button
              onClick={handleCloudSave}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition"
            >
              <Cloud size={18} />
              Buluta Kaydet
            </button>
            <button
              onClick={downloadJSON}
              className="flex items-center gap-2 px-4 py-2 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition"
            >
              <Download size={18} />
              İndir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sol Panel - Araçlar */}
          <div className="space-y-4">
            <div className="bg-surface-raised rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-white">Araçlar</h2>
              <div className="grid grid-cols-2 gap-2">
                {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as CellType[]).map((tool) => (
                  <button
                    key={tool}
                    onClick={() => setSelectedTool(tool)}
                    className={`p-3 rounded-lg border-2 transition ${selectedTool === tool
                      ? "border-neon-blue bg-neon-blue/20"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                  >
                    {tool === 7 ? (
                      <div className="flex items-center justify-center mb-2">
                        <Key size={24} className="text-yellow-400" />
                      </div>
                    ) : tool === 8 ? (
                      <div className={`w-full h-8 rounded ${CELL_COLORS[tool]} mb-2 flex items-center justify-center`}>
                        <span className="text-blue-400 text-xs">🔒</span>
                      </div>
                    ) : (
                      <div className={`w-full h-8 rounded ${CELL_COLORS[tool]} mb-2`} />
                    )}
                    <div className="text-xs text-white/70">{CELL_NAMES[tool]}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-raised rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-white">Ayarlar</h2>
              {selectedEnemy && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-yellow-400 font-semibold">
                      Düşman Path Düzenleme
                    </span>
                    <button
                      onClick={() => {
                        setSelectedEnemy(null);
                        setIsPathEditing(false);
                      }}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-yellow-300/70 mb-2">
                    Labirent üzerinde tıklayarak path noktaları ekleyin/kaldırın
                  </p>
                  <button
                    onClick={() => {
                      const key = `${selectedEnemy.x},${selectedEnemy.y}`;
                      setEnemyPaths(prev => {
                        const newPaths = new Map(prev);
                        newPaths.set(key, [{ x: selectedEnemy.x, y: selectedEnemy.y }]);
                        return newPaths;
                      });
                    }}
                    className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                  >
                    Path&apos;i Temizle
                  </button>
                </div>
              )}
              <div>
                <label className="text-sm text-white/70">Genişlik</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Math.max(10, Math.min(100, Number(e.target.value))))}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/70">Yükseklik</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.max(10, Math.min(100, Number(e.target.value))))}
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/70">Zoom: {zoom.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
              <button
                onClick={clearMaze}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
              >
                <Trash2 size={18} />
                Temizle
              </button>
            </div>
          </div>

          {/* Orta Panel - Labirent */}
          <div className="lg:col-span-2">
            <div className="bg-surface-raised rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Labirent</h2>
                <div className="text-sm text-white/70">
                  {width} x {height}
                </div>
              </div>
              <div
                className="overflow-auto border border-white/10 rounded bg-surface-base p-2 relative"
                onMouseLeave={handleMouseUp}
              >
                {/* Path çizgileri için SVG overlay */}
                {isPathEditing && selectedEnemy && (() => {
                  const enemyKey = `${selectedEnemy.x},${selectedEnemy.y}`;
                  const path = enemyPaths.get(enemyKey) || [];
                  if (path.length < 2) return null;

                  const gap = 2; // gap-0.5 = 2px
                  const totalCellSize = cellSize + gap;

                  return (
                    <svg
                      className="absolute top-2 left-2 pointer-events-none z-0"
                      style={{
                        width: `${width * totalCellSize}px`,
                        height: `${height * totalCellSize}px`
                      }}
                    >
                      {path.map((point, idx) => {
                        if (idx === 0) return null;
                        const prevPoint = path[idx - 1];
                        const x1 = prevPoint.x * totalCellSize + cellSize / 2;
                        const y1 = prevPoint.y * totalCellSize + cellSize / 2;
                        const x2 = point.x * totalCellSize + cellSize / 2;
                        const y2 = point.y * totalCellSize + cellSize / 2;
                        return (
                          <line
                            key={`line-${idx}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#06b6d4"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            opacity="0.7"
                          />
                        );
                      })}
                    </svg>
                  );
                })()}
                <div
                  className="inline-grid gap-0.5 relative z-10"
                  style={{
                    gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${height}, ${cellSize}px)`
                  }}
                >
                  {matrix.map((row, y) =>
                    row.map((cell, x) => {
                      const isSelectedEnemy = selectedEnemy && selectedEnemy.x === x && selectedEnemy.y === y;
                      const enemyKey = `${x},${y}`;
                      const path = enemyPaths.get(enemyKey) || [];
                      const isPathPoint = isPathEditing && selectedEnemy && path.some(p => p.x === x && p.y === y);

                      return (
                        <div key={`${x}-${y}`} className="relative">
                          <button
                            onMouseDown={(e) => {
                              if (cell === 5 && !isPathEditing) {
                                e.stopPropagation();
                                handleEnemyClick(x, y);
                              } else if (cell === 4 && !isPathEditing) {
                                e.stopPropagation();
                                handleDoorClick(x, y);
                              } else if (isPathEditing) {
                                // Path düzenleme modunda sadece path ekle/kaldır
                                paintCell(x, y);
                              } else {
                                handleMouseDown(x, y);
                              }
                            }}
                            onMouseEnter={() => {
                              if (!isPathEditing) {
                                handleMouseEnter(x, y);
                              }
                            }}
                            onMouseUp={handleMouseUp}
                            className={`${CELL_COLORS[cell as CellType]} border-2 transition cursor-pointer ${isSelectedEnemy
                              ? "border-yellow-400 shadow-lg shadow-yellow-400/50"
                              : isPathPoint
                                ? "border-cyan-400 shadow-lg shadow-cyan-400/50"
                                : "border-white/5 hover:border-neon-blue/50"
                              }`}
                            style={{ width: cellSize, height: cellSize }}
                            title={`${x}, ${y} - ${CELL_NAMES[cell as CellType]}`}
                          />
                          {/* Path noktalarını göster */}
                          {isPathEditing && selectedEnemy && path.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none z-10">
                              {path.map((point, idx) => {
                                if (point.x === x && point.y === y) {
                                  const isStart = idx === 0 && point.x === selectedEnemy.x && point.y === selectedEnemy.y;
                                  return (
                                    <div
                                      key={idx}
                                      className="absolute inset-0 flex items-center justify-center"
                                    >
                                      <div className={`${isStart ? 'w-3 h-3 bg-yellow-400' : 'w-2 h-2 bg-cyan-400'} rounded-full border-2 border-white shadow-lg`} />
                                      {idx > 0 && (
                                        <div className="absolute text-[8px] text-white font-bold bg-black/50 px-1 rounded">
                                          {idx}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              })}
                              {/* Path çizgilerini göster */}
                              {path.length > 1 && path.map((point, idx) => {
                                if (idx === 0) return null;
                                const prevPoint = path[idx - 1];
                                // Sadece komşu hücreler arasında çizgi çiz
                                if (Math.abs(point.x - prevPoint.x) <= 1 && Math.abs(point.y - prevPoint.y) <= 1) {
                                  return null; // Çizgi rendering için SVG kullanılabilir ama şimdilik basit tutuyoruz
                                }
                                return null;
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Panel - JSON */}
          <div className="space-y-4">
            <div className="bg-surface-raised rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">JSON</h2>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={loadFromFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-neon-green/20 text-neon-green rounded hover:bg-neon-green/30 transition text-sm"
                    title="Dosyadan yükle"
                  >
                    <FileText size={16} />
                  </button>
                  <button
                    onClick={loadFromJSON}
                    className="flex items-center gap-2 px-3 py-1.5 bg-neon-purple/20 text-neon-purple rounded hover:bg-neon-purple/30 transition text-sm"
                    title="Textarea'dan yükle"
                  >
                    <Upload size={16} />
                    Yükle
                  </button>
                </div>
              </div>
              <textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                className="w-full h-96 px-3 py-2 bg-surface-base border border-white/10 rounded text-white text-xs font-mono"
                placeholder="JSON verisi buraya yapıştırın..."
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-raised rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Kullanım</h3>
          <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
            <li>Araçlardan birini seç ve labirent üzerinde tıkla</li>
            <li>Başlangıç (sarı) ve çıkış (mavi) tek olmalı</li>
            <li>Düşman (kırmızı) üzerine tıklayarak path düzenleme modunu aç</li>
            <li>Path düzenleme modunda labirent üzerinde tıklayarak düşman yolu oluştur</li>
            <li>JSON&apos;a Çevir butonuna tıklayarak JSON formatına çevir</li>
            <li>JSON&apos;u kopyala veya indir</li>
            <li>Dosyadan yüklemek için dosya ikonuna tıkla veya textarea&apos;ya yapıştır ve Yükle butonuna tıkla</li>
          </ul>
        </div>

        {/* Kapı Tıklama Sayısı Modal */}
        {showDoorModal && selectedDoor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
            <div className="bg-surface-raised rounded-lg p-6 border border-neon-purple/40 w-80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neon-purple">Kapı Tıklama Sayısı</h3>
                <button
                  onClick={() => {
                    setShowDoorModal(false);
                    setSelectedDoor(null);
                  }}
                  className="text-white/70 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/70 mb-2 block">
                    Kaç tıklamayla açılsın?
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={doorClicks.get(`${selectedDoor.x},${selectedDoor.y}`) || 10}
                    onChange={(e) => {
                      const key = `${selectedDoor.x},${selectedDoor.y}`;
                      setDoorClicks(prev => {
                        const newClicks = new Map(prev);
                        newClicks.set(key, Math.max(1, Math.min(100, Number(e.target.value))));
                        return newClicks;
                      });
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowDoorModal(false);
                    setSelectedDoor(null);
                  }}
                  className="w-full px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

