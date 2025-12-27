"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useDrag } from "@use-gesture/react";
import { Door, Enemy, LevelConfig, Vector2, VerificationDoor, Key as KeyType } from "@/lib/types";
import CaptchaModal from "./CaptchaModal";
import SentenceModal from "./SentenceModal";
import { DoorClosed, Ghost, RotateCcw, Key } from "lucide-react";

type Props = {
  level: LevelConfig;
  onComplete: (levelId: number | string, score: number) => void;
  language: "tr" | "en";
};

type DoorClicks = Record<string, number>;

const PLAYER_SPEED = 2.75; // Pixel/frame - karakter hızı yarıya indirildi
const ENEMY_SPEED = 2.5; // Düşman hızı
const PLAYER_RADIUS = 6; // Oyuncu yarıçapı (collision için)
const ACCELERATION = 0.45; // İvme faktörü - daha hızlı tepki, daha az gecikme hissi
const FRICTION = 0.9; // Sürtünme faktörü - daha akıcı duruş

// Pixel pozisyonunu matris indeksine çevir
const pixelToMatrixIndex = (pixelPos: Vector2, tileSize: number): Vector2 => ({
  x: Math.floor(pixelPos.x / tileSize),
  y: Math.floor(pixelPos.y / tileSize)
});

// Matris indeksini pixel pozisyonuna çevir
const matrixIndexToPixel = (index: Vector2, tileSize: number): Vector2 => ({
  x: index.x * tileSize + tileSize / 2,
  y: index.y * tileSize + tileSize / 2
});

// Duvar kontrolü - matris tabanlı
const isWall = (matrix: number[][], pos: Vector2, tileSize: number, radius: number): boolean => {
  const matrixPos = pixelToMatrixIndex(pos, tileSize);
  const matrixWidth = matrix[0]?.length ?? 0;
  const matrixHeight = matrix.length;

  // Grid sınırları dışında mı?
  if (matrixPos.x < 0 || matrixPos.x >= matrixWidth || matrixPos.y < 0 || matrixPos.y >= matrixHeight) {
    return true;
  }

  // Merkez nokta duvar mı? (1 = duvar)
  if (matrix[matrixPos.y]?.[matrixPos.x] === 1) return true;

  // Oyuncunun 4 köşe noktasını kontrol et
  const corners = [
    { x: pos.x - radius, y: pos.y - radius }, // Sol üst
    { x: pos.x + radius, y: pos.y - radius }, // Sağ üst
    { x: pos.x - radius, y: pos.y + radius }, // Sol alt
    { x: pos.x + radius, y: pos.y + radius }  // Sağ alt
  ];

  for (const corner of corners) {
    const cornerMatrix = pixelToMatrixIndex(corner, tileSize);
    if (cornerMatrix.x < 0 || cornerMatrix.x >= matrixWidth || cornerMatrix.y < 0 || cornerMatrix.y >= matrixHeight) {
      return true;
    }
    // 1 = duvar, sadece 0 = yol geçilebilir
    const cellValue = matrix[cornerMatrix.y]?.[cornerMatrix.x] ?? 1;
    if (cellValue === 1) return true; // Duvar
  }

  return false;
};

const distance = (a: Vector2, b: Vector2) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

export default function GameBoard({ level, onComplete, language }: Props) {
  const { matrix, start, exit, doors, enemies, mapWidth, mapHeight, tileSize, verificationDoors, key, lockedExit } = level;

  const [player, setPlayer] = useState<Vector2>(start);
  const [currentDoors, setCurrentDoors] = useState<Door[]>(doors);
  const [currentVerificationDoors, setCurrentVerificationDoors] = useState<VerificationDoor[]>(verificationDoors || []);
  const [doorClicks, setDoorClicks] = useState<DoorClicks>({});
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>(enemies);
  const [hasKey, setHasKey] = useState(false);
  const [activeEnemy, setActiveEnemy] = useState<string | null>(null);
  const [showSentenceModal, setShowSentenceModal] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [activeVerificationDoor, setActiveVerificationDoor] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [gameTime, setGameTime] = useState(0); // Saniye cinsinden oyun süresi
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [playerCharacter, setPlayerCharacter] = useState<string>("👤"); // Varsayılan karakter
  const [retryCount, setRetryCount] = useState(0); // Tekrar sayacı
  const [pathPoints, setPathPoints] = useState<Vector2[]>([]); // Fare ile çizilen rota
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number>();
  const enemyAnimationFrameRef = useRef<number>();
  const velocity = useRef<Vector2>({ x: 0, y: 0 }); // Hız vektörü (ivme için)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pathQueueRef = useRef<Vector2[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);

  // Karakter seçimini localStorage'dan yükle
  useEffect(() => {
    const saved = localStorage.getItem("playerCharacter");
    if (saved) {
      setPlayerCharacter(saved);
    }
  }, []);

  // Gesture desteği (ileride pan/zoom için kullanılabilir)
  const bind = useDrag(
    (state) => {
      if (paused) return;
      // Drag ile haritayı kaydırma (opsiyonel - şimdilik devre dışı)
    },
    {
      filterTaps: true,
      threshold: 10
    }
  );

  // Timer - hareket başladığında başlar, bitene kadar durmaz
  useEffect(() => {
    if (isTimerRunning && !paused) {
      timerIntervalRef.current = setInterval(() => {
        setGameTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, paused]);

  // Tuş basılı tutma için
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (paused) return;
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
        keysPressed.current.add(key);
        // Klavye ile hareket başlarsa çizili rotayı iptal et
        pathQueueRef.current = [];
        setPathPoints([]);
        // İlk hareket tuşuna basıldığında timer'ı başlat
        if (!isTimerRunning && keysPressed.current.size === 1) {
          setIsTimerRunning(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
      // Tüm hareket tuşları bırakıldığında timer durmaz (kullanıcı istediği gibi)
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [paused, isTimerRunning]);

  // Fare konumunu oyun haritası koordinatına çevir
  const getMapPositionFromMouse = (event: React.MouseEvent): Vector2 | null => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) return null;
    return {
      x: (relX / rect.width) * mapWidth,
      y: (relY / rect.height) * mapHeight
    };
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (paused) return;
    const pos = getMapPositionFromMouse(event);
    if (!pos) return;
    setIsDrawingPath(true);
    if (!isTimerRunning) setIsTimerRunning(true);
    pathQueueRef.current = [];
    setPathPoints([pos]);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDrawingPath) return;
    const pos = getMapPositionFromMouse(event);
    if (!pos) return;
    setPathPoints((prev) => [...prev, pos]);
  };

  const finishPathDrawing = () => {
    setIsDrawingPath(false);
    setPathPoints((prev) => {
      pathQueueRef.current = prev.length > 1 ? [...prev] : [];
      return prev;
    });
  };

  const handleMouseUp = () => {
    finishPathDrawing();
  };

  const handleMouseLeave = () => {
    if (isDrawingPath) {
      finishPathDrawing();
    }
  };

  // İyileştirilmiş smooth hareket döngüsü (ivme ve sürtünme ile)
  useEffect(() => {
    if (paused) return;

    const movePlayer = () => {
      setPlayer((prev) => {
        // Hedef hız hesapla
        let targetVx = 0;
        let targetVy = 0;
        const hasKeyboardInput =
          keysPressed.current.has("w") ||
          keysPressed.current.has("arrowup") ||
          keysPressed.current.has("s") ||
          keysPressed.current.has("arrowdown") ||
          keysPressed.current.has("a") ||
          keysPressed.current.has("arrowleft") ||
          keysPressed.current.has("d") ||
          keysPressed.current.has("arrowright");

        if (hasKeyboardInput) {
          if (keysPressed.current.has("w") || keysPressed.current.has("arrowup")) targetVy -= PLAYER_SPEED;
          if (keysPressed.current.has("s") || keysPressed.current.has("arrowdown")) targetVy += PLAYER_SPEED;
          if (keysPressed.current.has("a") || keysPressed.current.has("arrowleft")) targetVx -= PLAYER_SPEED;
          if (keysPressed.current.has("d") || keysPressed.current.has("arrowright")) targetVx += PLAYER_SPEED;
        } else if (pathQueueRef.current.length > 0) {
          // Çizilen rota boyunca ilerle
          const target = pathQueueRef.current[0];
          const dx = target.x - prev.x;
          const dy = target.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < tileSize * 0.3) {
            // Hedef noktasına çok yaklaştı, bir sonraki noktaya geç
            pathQueueRef.current.shift();
          } else if (dist > 0) {
            targetVx = (dx / dist) * PLAYER_SPEED;
            targetVy = (dy / dist) * PLAYER_SPEED;
          }
        }

        // Diyagonal hareketi normalize et
        if (targetVx !== 0 && targetVy !== 0) {
          targetVx *= 0.707;
          targetVy *= 0.707;
        }

        // İvme uygula (smooth acceleration)
        const currentVx = velocity.current.x;
        const currentVy = velocity.current.y;

        velocity.current.x = currentVx + (targetVx - currentVx) * ACCELERATION;
        velocity.current.y = currentVy + (targetVy - currentVy) * ACCELERATION;

        // Sürtünme uygula (tuş basılı değilse)
        if (targetVx === 0) velocity.current.x *= FRICTION;
        if (targetVy === 0) velocity.current.y *= FRICTION;

        // Çok küçük hızları sıfırla (jitter önleme)
        if (Math.abs(velocity.current.x) < 0.1) velocity.current.x = 0;
        if (Math.abs(velocity.current.y) < 0.1) velocity.current.y = 0;

        // Hareket yoksa dur
        if (velocity.current.x === 0 && velocity.current.y === 0) return prev;

        // Yeni pozisyon hesapla
        const next = {
          x: prev.x + velocity.current.x,
          y: prev.y + velocity.current.y
        };

        // Duvar kontrolü (matris tabanlı) - önce X, sonra Y ayrı kontrol et
        let canMoveX = !isWall(matrix, { x: next.x, y: prev.y }, tileSize, PLAYER_RADIUS);
        let canMoveY = !isWall(matrix, { x: prev.x, y: next.y }, tileSize, PLAYER_RADIUS);

        // Eğer çapraz hareket varsa ve bir yönde engel varsa, diğer yöne izin ver
        if (!canMoveX && !canMoveY) {
          // Her iki yönde de engel var, hareket etme
          velocity.current.x = 0;
          velocity.current.y = 0;
          return prev;
        }

        if (!canMoveX) {
          // X yönünde engel var, sadece Y'ye izin ver
          next.x = prev.x;
          velocity.current.x = 0;
        }

        if (!canMoveY) {
          // Y yönünde engel var, sadece X'e izin ver
          next.y = prev.y;
          velocity.current.y = 0;
        }

        // Kapı kontrolü (kapılar kaldırılmadıysa)
        const closedDoor = currentDoors.find((d) => {
          if (d.removed) return false;
          return distance(next, d.position) < tileSize / 2;
        });
        if (closedDoor) {
          velocity.current.x = 0;
          velocity.current.y = 0;
          return prev;
        }

        // Sınır kontrolü
        if (next.x < PLAYER_RADIUS || next.x >= mapWidth - PLAYER_RADIUS) {
          next.x = Math.max(PLAYER_RADIUS, Math.min(mapWidth - PLAYER_RADIUS, next.x));
          velocity.current.x = 0;
        }
        if (next.y < PLAYER_RADIUS || next.y >= mapHeight - PLAYER_RADIUS) {
          next.y = Math.max(PLAYER_RADIUS, Math.min(mapHeight - PLAYER_RADIUS, next.y));
          velocity.current.y = 0;
        }

        return next;
      });
    };

    const animate = () => {
      movePlayer();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [paused, matrix, currentDoors, tileSize, mapWidth, mapHeight]);

  // Reset fonksiyonu
  const resetGame = useCallback(() => {
    setPlayer(start);
    velocity.current = { x: 0, y: 0 };
    setCurrentDoors(doors);
    setCurrentVerificationDoors(verificationDoors || []);
    setDoorClicks({});
    setHasKey(false);
    setCurrentEnemies(
      enemies.map((e) => ({
        ...e,
        pathIndex: e.pathIndex ?? 0,
        position: e.path[0],
        alive: e.alive ?? true
      }))
    );
    setActiveEnemy(null);
    setShowCaptcha(false);
    setActiveVerificationDoor(null);
    setPaused(false);
    setGameTime(0);
    setIsTimerRunning(false);
    keysPressed.current.clear();
    setPathPoints([]);
    pathQueueRef.current = [];
  }, [start, doors, enemies, verificationDoors]);

  // Level değiştiğinde reset
  useEffect(() => {
    resetGame();
    setRetryCount(0);
  }, [level.id, resetGame]);

  // Yanar duvar (9) çarpışma kontrolü
  useEffect(() => {
    const matrixPos = pixelToMatrixIndex(player, tileSize);
    const matrixHeight = matrix.length;
    const matrixWidth = matrix[0]?.length ?? 0;

    if (
      matrixPos.x < 0 ||
      matrixPos.y < 0 ||
      matrixPos.x >= matrixWidth ||
      matrixPos.y >= matrixHeight
    ) {
      return;
    }

    if (matrix[matrixPos.y][matrixPos.x] === 9) {
      // Yanar duvara değdiğinde oyunu başa al ve sayaç arttır
      setRetryCount((prev) => prev + 1);
      resetGame();
    }
  }, [player, matrix, tileSize, resetGame]);

  // Düşman hareketi - optimize edilmiş smooth hareket
  useEffect(() => {
    if (paused) return;

    let lastTime = performance.now();
    const moveEnemies = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2); // Max 2x speed
      lastTime = currentTime;

      setCurrentEnemies((prev) => {
        let hasChanges = false;
        const updated = prev.map((enemy) => {
          if (enemy.alive === false) return enemy;
          const currentIndex = enemy.pathIndex ?? 0;
          const nextIndex = (currentIndex + 1) % enemy.path.length;
          const targetPixel = enemy.path[nextIndex];
          const currentPixel = enemy.position ?? enemy.path[0];

          // Smooth hareket için interpolasyon
          const dx = targetPixel.x - currentPixel.x;
          const dy = targetPixel.y - currentPixel.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 1.5) {
            if (enemy.pathIndex !== nextIndex || enemy.position !== targetPixel) {
              hasChanges = true;
              return { ...enemy, pathIndex: nextIndex, position: targetPixel };
            }
            return enemy;
          }

          const moveX = (dx / dist) * ENEMY_SPEED * deltaTime;
          const moveY = (dy / dist) * ENEMY_SPEED * deltaTime;
          const nextPos = { x: currentPixel.x + moveX, y: currentPixel.y + moveY };

          // Düşman için duvar kontrolü
          if (isWall(matrix, nextPos, tileSize, PLAYER_RADIUS)) {
            if (enemy.pathIndex !== nextIndex) {
              hasChanges = true;
              return { ...enemy, pathIndex: nextIndex, position: targetPixel };
            }
            return enemy;
          }

          hasChanges = true;
          return {
            ...enemy,
            position: nextPos
          };
        });

        return hasChanges ? updated : prev;
      });

      enemyAnimationFrameRef.current = requestAnimationFrame(moveEnemies);
    };

    enemyAnimationFrameRef.current = requestAnimationFrame(moveEnemies);

    return () => {
      if (enemyAnimationFrameRef.current) {
        cancelAnimationFrame(enemyAnimationFrameRef.current);
      }
    };
  }, [paused, matrix, tileSize]);

  // Düşman çarpışma kontrolü - tüm düşmanlar İngilizce cümle sorusu sorar
  useEffect(() => {
    currentEnemies.forEach((enemy) => {
      if (enemy.alive === false) return;
      const enemyPos = enemy.position ?? enemy.path[0];
      if (distance(player, enemyPos) < tileSize * 0.7) {
        setActiveEnemy(enemy.id);
        setShowSentenceModal(true);
        setPaused(true);
      }
    });
  }, [currentEnemies, player, tileSize]);

  // Anahtar toplama kontrolü
  useEffect(() => {
    if (key && !hasKey) {
      const keyPixel = matrixIndexToPixel({ x: key.position.x, y: key.position.y }, tileSize);
      if (distance(player, keyPixel) < tileSize / 2) {
        setHasKey(true);
      }
    }
  }, [player, key, hasKey, tileSize]);

  // Çıkış kontrolü (Orijinal mesafe kontrolüne dönüş)
  // Çıkış kontrolü (Orijinal mesafe kontrolüne dönüş)
  useEffect(() => {
    const targetExit = lockedExit ? matrixIndexToPixel({ x: lockedExit.x, y: lockedExit.y }, tileSize) : exit;

    if (distance(player, targetExit) < tileSize / 2) {
      // Anahtarlı çıkış varsa ve anahtar yoksa çıkışa izin verme
      if (lockedExit && !hasKey) {
        return;
      }
      setPaused(true);
      setIsTimerRunning(false);
      onComplete(level.id, gameTime);
    }
  }, [player, exit, lockedExit, hasKey, level.id, onComplete, tileSize, gameTime]);

  const doorNearPlayer = useMemo(
    () =>
      currentDoors.find((d) => {
        if (d.removed) return false;
        return distance(player, d.position) < tileSize * 1.2;
      }),
    [currentDoors, player, tileSize]
  );

  const verificationDoorNearPlayer = useMemo(
    () =>
      currentVerificationDoors.find((d) => {
        if (d.removed) return false;
        return distance(player, d.position) < tileSize * 1.2;
      }),
    [currentVerificationDoors, player, tileSize]
  );

  // Doğrulama kapısı çarpışma kontrolü
  useEffect(() => {
    if (verificationDoorNearPlayer && !verificationDoorNearPlayer.removed) {
      setActiveVerificationDoor(verificationDoorNearPlayer.id);
      setShowCaptcha(true);
      setPaused(true);
    }
  }, [verificationDoorNearPlayer]);

  const handleDoorClick = (doorId: string) => {
    setDoorClicks((prev) => {
      const nextVal = (prev[doorId] ?? 0) + 1;
      const shouldRemove =
        (prev[doorId] ?? 0) + 1 >=
        (currentDoors.find((d) => d.id === doorId)?.requiredClicks ?? Infinity);
      if (shouldRemove) {
        setCurrentDoors((ds) =>
          ds.map((d) => (d.id === doorId ? { ...d, removed: true } : d))
        );
      }
      return { ...prev, [doorId]: nextVal };
    });
  };

  const handleSentenceResult = (correct: boolean) => {
    if (correct && activeEnemy) {
      setCurrentEnemies((prev) =>
        prev.map((e) => (e.id === activeEnemy ? { ...e, alive: false } : e))
      );
      setActiveEnemy(null);
      setShowSentenceModal(false);
      setPaused(false);
    } else {
      setRetryCount((prev) => prev + 1);
      setShowSentenceModal(false);
      resetGame();
    }
  };

  const handleCaptchaResult = (correct: boolean) => {
    if (correct && activeVerificationDoor) {
      setCurrentVerificationDoors((prev) =>
        prev.map((d) => (d.id === activeVerificationDoor ? { ...d, removed: true } : d))
      );
    } else {
      setPlayer(start);
    }
    setActiveVerificationDoor(null);
    setShowCaptcha(false);
    setPaused(false);
  };

  // Matrisi render et - responsive
  const renderMatrix = () => {
    const cells = [];
    const cellWidth = 100 / (matrix[0]?.length ?? 1);
    const cellHeight = 100 / matrix.length;

    // Açılmış tıklama kapısı hücrelerini (4 → yol) bul
    const openedDoorCells = new Set<string>();
    currentDoors.forEach((door) => {
      if (door.removed) {
        const grid = pixelToMatrixIndex(door.position, tileSize);
        openedDoorCells.add(`${grid.x},${grid.y}`);
      }
    });

    // Açılmış doğrulama kapısı hücrelerini (6 → yol) bul
    const openedVerificationCells = new Set<string>();
    currentVerificationDoors.forEach((door) => {
      if (door.removed) {
        const grid = pixelToMatrixIndex(door.position, tileSize);
        openedVerificationCells.add(`${grid.x},${grid.y}`);
      }
    });

    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        const value = matrix[y][x];
        const key = `${x},${y}`;

        let bgColor = "";
        if (value === 1) bgColor = "bg-surface-raised"; // Duvar
        else if (value === 2) bgColor = "bg-yellow-500/30"; // Başlangıç - Sarı
        else if (value === 3) bgColor = "bg-blue-500/30"; // Çıkış - Mavi
        else if (value === 4 && !openedDoorCells.has(key)) bgColor = "bg-surface-raised"; // Kapı - Duvar rengi (sadece sembol renkli)
        // Düşman hücreleri oyunda yol gibi görünsün (kırmızı kare sadece düzenleyicide var)
        else if (value === 5) bgColor = "bg-surface-base/50"; // Düşman - yol rengi
        else if (value === 6 && !openedVerificationCells.has(key)) bgColor = "bg-surface-raised"; // Doğrulama Kapısı - Duvar rengi (sadece sembol renkli)
        else if (value === 7) bgColor = "bg-yellow-500/30"; // Anahtar - Sarı
        else if (value === 8) bgColor = "bg-blue-500/30"; // Anahtarlı Çıkış - Mavi
        else if (value === 9) bgColor = "bg-red-700/80"; // Yanar Duvar - Kırmızı
        else bgColor = "bg-surface-base/50"; // Yol (0) veya açılmış kapı

        cells.push(
          <div
            key={`${x}-${y}`}
            className={`absolute ${bgColor}`}
            style={{
              left: `${x * cellWidth}%`,
              top: `${y * cellHeight}%`,
              width: `${cellWidth}%`,
              height: `${cellHeight}%`
            }}
          />
        );
      }
    }
    return cells;
  };

  // Zamanı formatla (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const instructionText =
    language === "en"
      ? "Move with WASD / Arrow keys, or draw a white path with the mouse. Stand near a door and click."
      : "WASD / Ok tuşları ile hareket et veya fareyle beyaz bir rota çiz. Kapının yanına gel ve tıkla.";

  const restartLabel = language === "en" ? "Restart" : "Yeniden Başlat";
  const retryLabel = language === "en" ? "Retry" : "Tekrar";
  const keyCollectedLabel =
    language === "en" ? "Key Collected" : "Anahtar Toplandı";
  const doorClickLabel =
    language === "en" ? "Door Click" : "Kapı Tıklama";
  const clickLabel = language === "en" ? "CLICK" : "TIKLA";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/70">
          {instructionText}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRetryCount((prev) => prev + 1);
              resetGame();
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition text-xs text-white/70"
            title="Yeniden Başlat"
          >
            <RotateCcw size={12} />
            <span>{restartLabel}</span>
          </button>
          <div className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-xs text-white/80">
            {retryLabel}: <span className="font-semibold">{retryCount}</span>
          </div>
          <div className="font-mono text-2xl font-bold text-neon-blue">
            {formatTime(gameTime)}
          </div>
        </div>
      </div>

      <div
        className="relative inline-block overflow-hidden rounded-lg border border-neon-blue/30 bg-surface-raised max-w-full touch-none"
        style={{
          width: "min(800px, 100vw - 2rem)",
          height: "min(800px, 100vw - 2rem)",
          aspectRatio: "1 / 1"
        }}
        ref={boardRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        {...bind()}
      >
        {/* Fare ile çizilen rota */}
        {pathPoints.length > 1 && (
          <svg
            className="absolute inset-0 z-5 pointer-events-none"
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          >
            <polyline
              points={pathPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {/* Matris Render */}
        {renderMatrix()}

        {/* Başlangıç - Sarı */}
        <div
          className="absolute rounded-full bg-yellow-500/80 shadow-lg border-2 border-yellow-300 z-10"
          style={{
            left: `${(start.x / mapWidth) * 100}%`,
            top: `${(start.y / mapHeight) * 100}%`,
            width: `${100 / (matrix[0]?.length ?? 1)}%`,
            height: `${100 / matrix.length}%`,
            transform: "translate(-50%, -50%)"
          }}
        />

        {/* Çıkış - Mavi */}
        {!lockedExit && (
          <div
            className="absolute rounded-full bg-blue-500/80 shadow-lg border-2 border-blue-300 z-10"
            style={{
              left: `${(exit.x / mapWidth) * 100}%`,
              top: `${(exit.y / mapHeight) * 100}%`,
              width: `${100 / (matrix[0]?.length ?? 1)}%`,
              height: `${100 / matrix.length}%`,
              transform: "translate(-50%, -50%)"
            }}
          />
        )}

        {/* Anahtarlı Çıkış - Mavi (kilitli) */}
        {lockedExit && (
          <div
            className={`absolute rounded-full shadow-lg border-2 z-10 ${hasKey ? "bg-blue-500/80 border-blue-300" : "bg-gray-500/80 border-gray-400"
              }`}
            style={{
              left: `${(matrixIndexToPixel({ x: lockedExit.x, y: lockedExit.y }, tileSize).x / mapWidth) * 100}%`,
              top: `${(matrixIndexToPixel({ x: lockedExit.x, y: lockedExit.y }, tileSize).y / mapHeight) * 100}%`,
              width: `${100 / (matrix[0]?.length ?? 1)}%`,
              height: `${100 / matrix.length}%`,
              transform: "translate(-50%, -50%)"
            }}
          >
            {!hasKey && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                🔒
              </div>
            )}
          </div>
        )}

        {/* Anahtar */}
        {key && !hasKey && (
          <motion.div
            className="absolute flex items-center justify-center text-yellow-400 z-10"
            style={{
              left: `${(matrixIndexToPixel({ x: key.position.x, y: key.position.y }, tileSize).x / mapWidth) * 100}%`,
              top: `${(matrixIndexToPixel({ x: key.position.x, y: key.position.y }, tileSize).y / mapHeight) * 100}%`,
              width: `${100 / (matrix[0]?.length ?? 1)}%`,
              height: `${100 / matrix.length}%`,
              transform: "translate(-50%, -50%)"
            }}
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Key size={20} />
          </motion.div>
        )}

        {/* Anahtar toplandığında göster */}
        {hasKey && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-400/50 rounded-lg">
            <Key size={16} className="text-yellow-400" />
            <span className="text-xs text-yellow-400 font-semibold">
              {keyCollectedLabel}
            </span>
          </div>
        )}

        {/* Kapılar - Mor sembol, duvar rengi arka plan */}
        {currentDoors
          .filter((d) => !d.removed)
          .map((door) => (
            <motion.div
              key={door.id}
              className="absolute flex items-center justify-center text-purple-400 z-10"
              style={{
                left: `${(door.position.x / mapWidth) * 100}%`,
                top: `${(door.position.y / mapHeight) * 100}%`,
                width: `${100 / (matrix[0]?.length ?? 1)}%`,
                height: `${100 / matrix.length}%`,
                transform: "translate(-50%, -50%)"
              }}
            >
              <DoorClosed size={20} className="text-purple-400" />
            </motion.div>
          ))}

        {/* Doğrulama Kapıları - Pembe sembol, duvar rengi arka plan */}
        {currentVerificationDoors
          .filter((d) => !d.removed)
          .map((door) => (
            <motion.div
              key={door.id}
              className="absolute flex items-center justify-center text-pink-400 z-10"
              style={{
                left: `${(door.position.x / mapWidth) * 100}%`,
                top: `${(door.position.y / mapHeight) * 100}%`,
                width: `${100 / (matrix[0]?.length ?? 1)}%`,
                height: `${100 / matrix.length}%`,
                transform: "translate(-50%, -50%)"
              }}
            >
              <DoorClosed size={20} className="text-pink-400" />
            </motion.div>
          ))}

        {/* Düşmanlar - Kırmızı ikon, zemin yol rengi */}
        {currentEnemies
          .filter((e) => e.alive !== false)
          .map((enemy) => {
            const enemyPos = enemy.position ?? enemy.path[0];
            return (
              <motion.div
                key={enemy.id}
                className="absolute flex items-center justify-center text-red-500 z-10"
                style={{
                  left: `${(enemyPos.x / mapWidth) * 100}%`,
                  top: `${(enemyPos.y / mapHeight) * 100}%`,
                  width: `${100 / (matrix[0]?.length ?? 1)}%`,
                  height: `${100 / matrix.length}%`,
                  transform: "translate(-50%, -50%)"
                }}
              >
                <Ghost size={20} />
              </motion.div>
            );
          })}

        {/* Oyuncu */}
        <motion.div
          className="absolute flex items-center justify-center z-20"
          style={{
            left: `${(player.x / mapWidth) * 100}%`,
            top: `${(player.y / mapHeight) * 100}%`,
            width: `${100 / (matrix[0]?.length ?? 1)}%`,
            height: `${100 / matrix.length}%`,
            transform: "translate(-50%, -50%)"
          }}
        >
          <div className="text-xl select-none" style={{ filter: "drop-shadow(0 0 4px rgba(34, 197, 94, 0.8))" }}>
            {playerCharacter}
          </div>
        </motion.div>

        {/* Kapı Tıklama Paneli */}
        {doorNearPlayer && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 rounded-xl border border-purple-400/60 bg-surface-raised/95 px-6 py-4 text-sm shadow-neon backdrop-blur-md w-72 max-w-full text-center"
            >
              <div className="flex items-center justify-center gap-2 text-purple-300">
                <DoorClosed size={18} />
                <span className="font-medium">
                  {doorClickLabel}: {doorClicks[doorNearPlayer.id] ?? 0} / {doorNearPlayer.requiredClicks}
                </span>
              </div>
              <button
                className="rounded-lg bg-purple-500/50 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500/70"
                onClick={() => handleDoorClick(doorNearPlayer.id)}
              >
                {clickLabel}
              </button>
            </motion.div>
          </div>
        )}
      </div>

      <SentenceModal
        open={showSentenceModal}
        onResult={handleSentenceResult}
        language={language}
      />
      <CaptchaModal
        open={showCaptcha}
        onResult={handleCaptchaResult}
        language={language}
      />
    </div>
  );
}
