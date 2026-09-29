import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

// 打开数据库连接
const sqLiteDatabase = openDatabaseSync("playlist");

export const db = drizzle(sqLiteDatabase, {
  logger: true,
});
