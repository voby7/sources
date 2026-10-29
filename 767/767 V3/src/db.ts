import Datastore from "nedb-promises";
import { join } from "path";
import type {
  UserId,
  PresetName,
  DatabaseRecord,
  AsyncResult,
  QueryResult,
} from "./types.js";

const userPresetsDb = Datastore.create({
  filename: join(process.cwd(), "data", "user_presets.db"),
  autoload: true,
});
const storedFilesDb = Datastore.create({
  filename: join(process.cwd(), "data", "stored_files.db"),
  autoload: true,
});
const thugSelectionsDb = Datastore.create({
  filename: join(process.cwd(), "data", "thug_selections.db"),
  autoload: true,
});
const floodDb = Datastore.create({
  filename: join(process.cwd(), "data", "flood.db"),
  autoload: true,
});
const cacheDb = Datastore.create({
  filename: join(process.cwd(), "data", "cache.db"),
  autoload: true,
});

export { storedFilesDb };

export const saveUserPreset = async (
  userId: UserId,
  presetName: PresetName,
  messageContent: string,
): Promise<any> => {
  try {
    const existing = await userPresetsDb.findOne({
      user_id: userId,
      preset_name: presetName,
    });

    if (existing) {
      return await userPresetsDb.update(
        { user_id: userId, preset_name: presetName },
        {
          $set: {
            message_content: messageContent,
            updated_at: new Date(),
          },
        },
      );
    } else {
      return await userPresetsDb.insert({
        user_id: userId,
        preset_name: presetName,
        message_content: messageContent,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  } catch (error) {
    console.error("Error in saveUserPreset:", error);
    throw error;
  }
};

export const getUserPresetNames = async (userId: UserId): Promise<string[]> => {
  try {
    const results = await userPresetsDb.find({ user_id: userId });
    return results
      .sort(
        (a: any, b: any) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      .map((row: any) => row.preset_name);
  } catch (error) {
    console.error("Error in getUserPresetNames:", error);
    return [];
  }
};

export const getUserPresets = async (
  userId: UserId,
): Promise<{ name: string; value: string }[]> => {
  try {
    const results = await userPresetsDb.find({ user_id: userId });
    return results
      .sort(
        (a: any, b: any) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      .map((row: any) => ({
        name: row.preset_name,
        value: row.preset_name,
      }));
  } catch (error) {
    console.error("Error in getUserPresets:", error);
    return [];
  }
};

export const getPresetContent = async (
  userId: UserId,
  presetName: string,
): Promise<QueryResult<string>> => {
  try {
    const result: any = await userPresetsDb.findOne({
      user_id: userId,
      preset_name: presetName,
    });
    return result ? result.message_content : null;
  } catch (error) {
    console.error("Error in getPresetContent:", error);
    return null;
  }
};

export const deleteUserPreset = async (
  userId: UserId,
  presetName: PresetName,
): Promise<number> => {
  try {
    return await userPresetsDb.remove(
      { user_id: userId, preset_name: presetName },
      {},
    );
  } catch (error) {
    console.error("Error in deleteUserPreset:", error);
    throw error;
  }
};

export const checkPresetLimit = async (userId: UserId): Promise<boolean> => {
  try {
    const count = await userPresetsDb.count({ user_id: userId });
    return count >= 10;
  } catch (error) {
    console.error("Error in checkPresetLimit:", error);
    return false;
  }
};

export const storeFile = async (
  userId: UserId,
  fileData: { url: string; filename: string; message?: string },
): Promise<any> => {
  try {
    const existing: any = await storedFilesDb.findOne({ user_id: userId });

    if (existing) {
      return await storedFilesDb.update(
        { user_id: userId },
        {
          $set: {
            url: fileData.url,
            filename: fileData.filename,
            message: fileData.message,
            updated_at: new Date(),
            created_at: existing.created_at,
          },
        },
      );
    } else {
      return await storedFilesDb.insert({
        user_id: userId,
        url: fileData.url,
        filename: fileData.filename,
        message: fileData.message,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  } catch (error) {
    console.error("Error in storeFile:", error);
    throw error;
  }
};

export const getStoredFile = async (
  userId: UserId,
): Promise<QueryResult<any>> => {
  try {
    const storedFile: any = await storedFilesDb.findOne({ user_id: userId });

    if (storedFile) {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const fileCreated = new Date(storedFile.created_at);

      if (fileCreated < oneHourAgo) {
        await clearStoredFile(userId);
        return null;
      }

      return storedFile;
    }

    return null;
  } catch (error) {
    console.error("Error in getStoredFile:", error);
    return null;
  }
};

export const clearStoredFile = async (userId: UserId): Promise<number> => {
  try {
    return await storedFilesDb.remove({ user_id: userId }, {});
  } catch (error) {
    console.error("Error in clearStoredFile:", error);
    throw error;
  }
};

export const migrateFromSQLite = async () => {
  console.log(
    "Migration function placeholder - no migration needed for fresh NeDB setup",
  );
};

export const setThugSelection = async (
  thugId: string,
  gifs: string[],
): Promise<any> => {
  try {
    return await thugSelectionsDb.insert({
      thug_id: thugId,
      gifs: gifs,
      created_at: new Date(),
    });
  } catch (error) {
    console.error("Error in setThugSelection:", error);
    throw error;
  }
};

export const getThugSelection = async (
  thugId: string,
): Promise<QueryResult<string[]>> => {
  try {
    const selection: any = await thugSelectionsDb.findOne({ thug_id: thugId });

    if (selection) {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const selectionCreated = new Date(selection.created_at);

      if (selectionCreated < oneHourAgo) {
        await clearThugSelection(thugId);
        return null;
      }

      return selection.gifs;
    }

    return null;
  } catch (error) {
    console.error("Error in getThugSelection:", error);
    return null;
  }
};

export const clearThugSelection = async (thugId: string): Promise<number> => {
  try {
    return await thugSelectionsDb.remove({ thug_id: thugId }, {});
  } catch (error) {
    console.error("Error in clearThugSelection:", error);
    throw error;
  }
};

export const saveFloodMessage = async (
  floodId: string,
  message: string,
): Promise<any> => {
  try {
    return await floodDb.insert({
      flood_id: floodId,
      message: message,
      created_at: new Date(),
    });
  } catch (error) {
    console.error("Error in saveFloodMessage:", error);
    throw error;
  }
};

export const getFloodMessage = async (
  floodId: string,
): Promise<QueryResult<string>> => {
  try {
    const result: any = await floodDb.findOne({ flood_id: floodId });

    if (result) {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const created = new Date(result.created_at);

      if (created < oneHourAgo) {
        await floodDb.remove({ flood_id: floodId }, {});
        return null;
      }

      return result.message;
    }

    return null;
  } catch (error) {
    console.error("Error in getFloodMessage:", error);
    return null;
  }
};

export const saveCachedMember = async (
  userId: string,
  memberData: any,
): Promise<any> => {
  try {
    return await cacheDb.insert({
      user_id: userId,
      member: memberData,
      cached_at: new Date(),
    });
  } catch (error) {
    console.error("Error in saveCachedMember:", error);
    throw error;
  }
};

interface CacheDocument {
  _id: string;
  user_id: string;
  member: any;
  cached_at: Date;
}

export const getCachedMember = async (userId: string): Promise<any> => {
  try {
    const result = (await cacheDb.findOne({
      user_id: userId,
    })) as CacheDocument | null;

    if (result) {
      const cachedAt = new Date(result.cached_at);
      const now = new Date();
      const diff = now.getTime() - cachedAt.getTime();
      const thirtyMins = 30 * 60 * 1000;

      if (diff > thirtyMins) {
        await cacheDb.remove({ user_id: userId }, {});
        return null;
      }

      return result.member;
    }

    return null;
  } catch (error) {
    console.error("Error in getCachedMember:", error);
    return null;
  }
};
