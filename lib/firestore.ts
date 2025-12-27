import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    doc,
    deleteDoc,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { LevelConfig } from "./types";

// Types
export interface FirestoreMaze {
    id: string;
    name: string;
    json: string; // Stored as stringified JSON
    userId: string;
    userName: string;
    createdAt: Timestamp;
    plays: number;
}

export interface FirestoreScore {
    id: string;
    levelId: string | number; // Can be string (custom) or number (built-in)
    userId: string;
    userName: string;
    score: number; // Duration in milliseconds (for now, lower is better)
    createdAt: Timestamp;
}

const MAZES_COLLECTION = "mazes";
const SCORES_COLLECTION = "scores";

/**
 * Save a new maze to Firestore
 */
export async function saveMazeToCloud(userId: string, userName: string, mazeName: string, json: string) {
    try {
        const docRef = await addDoc(collection(db, MAZES_COLLECTION), {
            userId,
            userName,
            name: mazeName,
            json,
            createdAt: serverTimestamp(),
            plays: 0
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving maze:", error);
        throw error;
    }
}

/**
 * Get all community mazes (ordered by newest)
 */
export async function getCommunityMazes(limitCount = 20) {
    try {
        const q = query(
            collection(db, MAZES_COLLECTION),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FirestoreMaze[];
    } catch (error) {
        console.error("Error fetching community mazes:", error);
        return [];
    }
}

/**
 * Get mazes created by a specific user
 */
export async function getUserMazes(userId: string) {
    try {
        const q = query(
            collection(db, MAZES_COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FirestoreMaze[];
    } catch (error) {
        console.error("Error fetching user mazes:", error);
        return [];
    }
}

/**
 * Delete a maze
 */
export async function deleteMazeFromCloud(mazeId: string) {
    try {
        await deleteDoc(doc(db, MAZES_COLLECTION, mazeId));
    } catch (error) {
        console.error("Error deleting maze:", error);
        throw error;
    }
}

/**
 * Save a high score
 */
// Firestore'dan updateDoc importunu ekle
import { updateDoc } from "firebase/firestore";

/**
 * Save a high score (Only keeps the best/lowest time)
 */
export async function saveScore(userId: string, userName: string, levelId: string | number, score: number) {
    try {
        const lvlIdStr = String(levelId);

        // Önce kullanıcının bu bölümdeki mevcut skorunu bul
        const q = query(
            collection(db, SCORES_COLLECTION),
            where("userId", "==", userId),
            where("levelId", "==", lvlIdStr),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Mevcut skor var, karşılaştır
            const docRef = querySnapshot.docs[0].ref;
            const existingScore = querySnapshot.docs[0].data().score;

            if (score < existingScore) {
                // Yeni süre daha iyi, güncelle
                await updateDoc(docRef, {
                    score: score,
                    userName: userName, // İsim değişmiş olabilir
                    createdAt: serverTimestamp()
                });
            }
            // Yeni süre daha kötüyse hiçbir şey yapma
        } else {
            // Hiç skor yok, yeni oluştur
            await addDoc(collection(db, SCORES_COLLECTION), {
                userId,
                userName,
                levelId: lvlIdStr,
                score,
                createdAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error saving score:", error);
        throw error;
    }
}

/**
 * Get top scores for a specific level
 */
export async function getLevelLeaderboard(levelId: string | number, limitCount = 10) {
    console.log(`Fetching leaderboard for level: ${levelId}`);
    try {
        // Hata ayıklama: Level ID filtresi olmadan hepsini çekip JS'te filtreleyelim
        // Bu sayede Firestore indeks veya tip sorunlarını ekarte ederiz.
        const q = query(collection(db, SCORES_COLLECTION));
        const querySnapshot = await getDocs(q);

        console.log(`Total scores in DB: ${querySnapshot.size}`);

        let scores = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FirestoreScore[];

        // JS taraflı filtreleme
        scores = scores.filter(s => String(s.levelId) === String(levelId));
        console.log(`Scores after filtering for level ${levelId}: ${scores.length}`);

        scores.sort((a, b) => a.score - b.score);

        return scores.slice(0, limitCount);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
}
