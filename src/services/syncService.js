// API service for syncing data with the server
import { useAuthTokenStore } from '@/stores/authToken'

const getBaseURL = () => {
    const authTokenStore = useAuthTokenStore()
    const token = authTokenStore.token || 'default'
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return `${baseUrl}/${token}/api`
}

class SyncService {
    constructor() {
        this.syncInterval = null;
        this.autoSyncEnabled = true;
        this.syncInProgress = false;
    }

    // Generic fetch wrapper
    async fetchAPI(endpoint, options = {}) {
        try {
            const API_BASE_URL = getBaseURL()
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ==================== User Info APIs ====================
    async getAllUserInfo() {
        return this.fetchAPI('/userinfo');
    }

    async addUserInfo(avatar, uid, name) {
        return this.fetchAPI('/userinfo', {
            method: 'POST',
            body: JSON.stringify({ avatar, uid, name }),
        });
    }

    async updateUserInfo(tokenId, avatar, uid, name) {
        return this.fetchAPI(`/userinfo/${tokenId}`, {
            method: 'PUT',
            body: JSON.stringify({ avatar, uid, name }),
        });
    }

    async deleteUserInfo(tokenId) {
        return this.fetchAPI(`/userinfo/${tokenId}`, {
            method: 'DELETE',
        });
    }

    // ==================== Achievement APIs ====================
    async getAchievement(uid) {
        return this.fetchAPI(`/achievement/${uid}`);
    }

    async saveAchievement(uid, data) {
        return this.fetchAPI(`/achievement/${uid}`, {
            method: 'POST',
            body: JSON.stringify({ data }),
        });
    }

    // ==================== Textjoin APIs ====================
    async getTextjoin(uid) {
        return this.fetchAPI(`/textjoin/${uid}`);
    }

    async saveTextjoin(uid, data) {
        return this.fetchAPI(`/textjoin/${uid}`, {
            method: 'POST',
            body: JSON.stringify({ data }),
        });
    }

    // ==================== Custom Not Achieved APIs ====================
    async getCustomNotAchieved(uid) {
        return this.fetchAPI(`/custom-not-achieved/${uid}`);
    }

    async saveCustomNotAchieved(uid, data) {
        return this.fetchAPI(`/custom-not-achieved/${uid}`, {
            method: 'POST',
            body: JSON.stringify({ data }),
        });
    }

    // ==================== Sync APIs ====================

    // Push local data to server
    async pushToServer(userInfo, achievements, textjoins, customNotAchieved) {
        return this.fetchAPI('/sync', {
            method: 'POST',
            body: JSON.stringify({
                userInfo,
                achievements,
                textjoins,
                customNotAchieved,
            }),
        });
    }

    // Pull data from server
    async pullFromServer() {
        return this.fetchAPI('/sync');
    }

    // Smart sync - merges local and remote data
    async smartSync(localData) {
        try {
            this.syncInProgress = true;

            // Get server data
            const serverResponse = await this.pullFromServer();
            const serverData = serverResponse.data;

            // For now, we'll use a simple last-write-wins strategy
            // In a production app, you might want more sophisticated conflict resolution

            // Merge user info
            const mergedUserInfo = { ...serverData.userInfo };
            if (localData.userInfo && localData.userInfo.list) {
                for (const tokenId in localData.userInfo.list) {
                    mergedUserInfo.list[tokenId] = localData.userInfo.list[tokenId];
                }
            }

            // Merge achievements, textjoins, and custom not achieved
            const mergedAchievements = { ...serverData.achievements, ...localData.achievements };
            const mergedTextjoins = { ...serverData.textjoins, ...localData.textjoins };
            const mergedCustomNotAchieved = { ...serverData.customNotAchieved, ...localData.customNotAchieved };

            // Push merged data back to server
            await this.pushToServer(
                mergedUserInfo,
                mergedAchievements,
                mergedTextjoins,
                mergedCustomNotAchieved
            );

            this.syncInProgress = false;

            return {
                userInfo: mergedUserInfo,
                achievements: mergedAchievements,
                textjoins: mergedTextjoins,
                customNotAchieved: mergedCustomNotAchieved,
            };
        } catch (error) {
            this.syncInProgress = false;
            throw error;
        }
    }

    // Start auto-sync (every 30 seconds)
    startAutoSync(syncCallback, interval = 30000) {
        if (this.syncInterval) {
            this.stopAutoSync();
        }

        this.autoSyncEnabled = true;
        this.syncInterval = setInterval(() => {
            if (this.autoSyncEnabled && !this.syncInProgress) {
                syncCallback();
            }
        }, interval);
    }

    // Stop auto-sync
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.autoSyncEnabled = false;
    }

    // Check if server is available
    async checkServerStatus() {
        try {
            await this.fetchAPI('/sync');
            return true;
        } catch (error) {
            return false;
        }
    }
}

export const syncService = new SyncService();
export default syncService;

