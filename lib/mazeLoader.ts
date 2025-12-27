import { LevelConfig } from "./types";
import { createLevelFromJSON } from "./levels";

/**
 * JSON dosyasından labirent yükle
 */
export const loadMazeFromFile = async (
  filePath: string,
  levelId: number,
  levelName: string
): Promise<LevelConfig> => {
  try {
    const response = await fetch(filePath);
    const jsonData = await response.json();
    return createLevelFromJSON(levelId, levelName, jsonData);
  } catch (error) {
    console.error("Labirent yüklenirken hata:", error);
    throw error;
  }
};

/**
 * JSON string'den labirent yükle
 */
export const loadMazeFromString = (
  jsonString: string,
  levelId: number,
  levelName: string
): LevelConfig => {
  try {
    return createLevelFromJSON(levelId, levelName, jsonString);
  } catch (error) {
    console.error("Labirent parse edilirken hata:", error);
    throw error;
  }
};

/**
 * Kullanım örneği:
 * 
 * import { loadMazeFromFile } from "@/lib/mazeLoader";
 * 
 * const level = await loadMazeFromFile("/example-maze.json", 1, "Kolay");
 */



