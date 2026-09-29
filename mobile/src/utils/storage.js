import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe wrapper for React Native persistent storage
export const storage = {
  async getItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Error getting ${key}:`, e);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {
      console.warn(`[Storage] Error setting ${key}:`, e);
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Error removing ${key}:`, e);
    }
  },

  async getJson(key, defaultValue = null) {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }
};

export default storage;
