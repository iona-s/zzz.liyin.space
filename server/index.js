import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const VALID_TOKEN = process.env.AUTH_TOKEN || 'default';

console.log(`Server will only accept requests with token: ${VALID_TOKEN}`);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper function to get current timestamp
const now = () => Math.floor(Date.now() / 1000);

// Middleware to extract and validate token
const validateToken = (req, res, next) => {
    const token = req.params.token;

    if (!token || token.trim() === '') {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Validate token against configured token
    if (token !== VALID_TOKEN) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Invalid token' });
    }

    // Store token in request for later use if needed
    req.authToken = token;
    next();
};

// ==================== User Info APIs ====================

// Get all user info
app.get('/:token/api/userinfo', validateToken, (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM user_info ORDER BY token_id').all();
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new user
app.post('/:token/api/userinfo', validateToken, (req, res) => {
    try {
        const { avatar, uid, name } = req.body;

        // Check if UID already exists
        const existing = db.prepare('SELECT uid FROM user_info WHERE uid = ?').get(uid);
        if (existing) {
            return res.status(400).json({ success: false, error: 'UID already exists' });
        }

        // Get max token_id
        const maxTokenId = db.prepare('SELECT MAX(token_id) as max FROM user_info').get();
        const newTokenId = (maxTokenId.max || 0) + 1;

        const stmt = db.prepare(`
            INSERT INTO user_info (token_id, avatar, uid, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(newTokenId, avatar, uid, name, now(), now());

        res.json({ success: true, data: { token_id: newTokenId, avatar, uid, name } });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update user info
app.put('/:token/api/userinfo/:tokenId', validateToken, (req, res) => {
    try {
        const { tokenId } = req.params;
        const { avatar, uid, name } = req.body;

        // Check if new UID conflicts with other users
        const conflict = db.prepare('SELECT uid FROM user_info WHERE uid = ? AND token_id != ?').get(uid, tokenId);
        if (conflict) {
            return res.status(400).json({ success: false, error: 'UID already exists' });
        }

        const stmt = db.prepare(`
            UPDATE user_info 
            SET avatar = ?, uid = ?, name = ?, updated_at = ?
            WHERE token_id = ?
        `);

        const result = stmt.run(avatar, uid, name, now(), tokenId);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete user
app.delete('/:token/api/userinfo/:tokenId', validateToken, (req, res) => {
    try {
        const { tokenId } = req.params;

        // Get UID first
        const user = db.prepare('SELECT uid FROM user_info WHERE token_id = ?').get(tokenId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Delete user and related data (CASCADE will handle related tables)
        const stmt = db.prepare('DELETE FROM user_info WHERE token_id = ?');
        stmt.run(tokenId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== Achievement Data APIs ====================

// Get achievement data for a user
app.get('/:token/api/achievement/:uid', validateToken, (req, res) => {
    try {
        const { uid } = req.params;
        const result = db.prepare('SELECT data, updated_at FROM user_achievement WHERE uid = ?').get(uid);

        if (!result) {
            return res.json({ success: true, data: null });
        }

        res.json({
            success: true,
            data: JSON.parse(result.data),
            updated_at: result.updated_at
        });
    } catch (error) {
        console.error('Error fetching achievement data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save achievement data for a user
app.post('/:token/api/achievement/:uid', validateToken, (req, res) => {
    try {
        const { uid } = req.params;
        const { data } = req.body;

        const stmt = db.prepare(`
            INSERT INTO user_achievement (uid, data, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(uid) DO UPDATE SET
                data = excluded.data,
                updated_at = excluded.updated_at
        `);

        stmt.run(uid, JSON.stringify(data), now());

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving achievement data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== Textjoin Data APIs ====================

// Get textjoin data for a user
app.get('/:token/api/textjoin/:uid', validateToken, (req, res) => {
    try {
        const { uid } = req.params;
        const result = db.prepare('SELECT data, updated_at FROM user_textjoin WHERE uid = ?').get(uid);

        if (!result) {
            return res.json({ success: true, data: null });
        }

        res.json({
            success: true,
            data: JSON.parse(result.data),
            updated_at: result.updated_at
        });
    } catch (error) {
        console.error('Error fetching textjoin data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save textjoin data for a user
app.post('/:token/api/textjoin/:uid', validateToken, (req, res) => {
    try {
        const { uid } = req.params;
        const { data } = req.body;

        const stmt = db.prepare(`
            INSERT INTO user_textjoin (uid, data, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(uid) DO UPDATE SET
                data = excluded.data,
                updated_at = excluded.updated_at
        `);

        stmt.run(uid, JSON.stringify(data), now());

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving textjoin data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== Custom Not Achieved Data APIs ====================

// Get custom not achieved data for a user
app.get('/:token/api/custom-not-achieved/:uid', validateToken, (req, res) => {
    try {
        const { uid } = req.params;
        const result = db.prepare('SELECT data, updated_at FROM user_custom_not_achieved WHERE uid = ?').get(uid);

        if (!result) {
            return res.json({ success: true, data: null });
        }

        res.json({
            success: true,
            data: JSON.parse(result.data),
            updated_at: result.updated_at
        });
    } catch (error) {
        console.error('Error fetching custom not achieved data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save custom not achieved data for a user
app.post('/:token/api/custom-not-achieved/:uid', validateToken, (req, res) => {
    try {
        const { uid } = req.params;
        const { data } = req.body;

        const stmt = db.prepare(`
            INSERT INTO user_custom_not_achieved (uid, data, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(uid) DO UPDATE SET
                data = excluded.data,
                updated_at = excluded.updated_at
        `);

        stmt.run(uid, JSON.stringify(data), now());

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving custom not achieved data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== Sync APIs ====================

// Sync all data for all users
app.post('/:token/api/sync', validateToken, (req, res) => {
    try {
        const { userInfo, achievements, textjoins, customNotAchieved } = req.body;

        const transaction = db.transaction(() => {
            // Sync user info
            if (userInfo && userInfo.list) {
                for (const tokenId in userInfo.list) {
                    const user = userInfo.list[tokenId];
                    const existing = db.prepare('SELECT token_id FROM user_info WHERE token_id = ?').get(user.tokenID);

                    if (existing) {
                        db.prepare(`
                            UPDATE user_info 
                            SET avatar = ?, uid = ?, name = ?, updated_at = ?
                            WHERE token_id = ?
                        `).run(user.avatar, user.uid, user.name, now(), user.tokenID);
                    } else {
                        db.prepare(`
                            INSERT INTO user_info (token_id, avatar, uid, name, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `).run(user.tokenID, user.avatar, user.uid, user.name, now(), now());
                    }
                }
            }

            // Sync achievements
            if (achievements) {
                for (const tokenId in achievements) {
                    const user = userInfo?.list?.[tokenId];
                    if (user) {
                        db.prepare(`
                            INSERT INTO user_achievement (uid, data, updated_at)
                            VALUES (?, ?, ?)
                            ON CONFLICT(uid) DO UPDATE SET
                                data = excluded.data,
                                updated_at = excluded.updated_at
                        `).run(user.uid, JSON.stringify(achievements[tokenId]), now());
                    }
                }
            }

            // Sync textjoins
            if (textjoins) {
                for (const tokenId in textjoins) {
                    const user = userInfo?.list?.[tokenId];
                    if (user) {
                        db.prepare(`
                            INSERT INTO user_textjoin (uid, data, updated_at)
                            VALUES (?, ?, ?)
                            ON CONFLICT(uid) DO UPDATE SET
                                data = excluded.data,
                                updated_at = excluded.updated_at
                        `).run(user.uid, JSON.stringify(textjoins[tokenId]), now());
                    }
                }
            }

            // Sync custom not achieved
            if (customNotAchieved) {
                for (const tokenId in customNotAchieved) {
                    const user = userInfo?.list?.[tokenId];
                    if (user) {
                        db.prepare(`
                            INSERT INTO user_custom_not_achieved (uid, data, updated_at)
                            VALUES (?, ?, ?)
                            ON CONFLICT(uid) DO UPDATE SET
                                data = excluded.data,
                                updated_at = excluded.updated_at
                        `).run(user.uid, JSON.stringify(customNotAchieved[tokenId]), now());
                    }
                }
            }
        });

        transaction();
        res.json({ success: true });
    } catch (error) {
        console.error('Error syncing data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all data from server
app.get('/:token/api/sync', validateToken, (req, res) => {
    try {
        // Get all user info
        const users = db.prepare('SELECT * FROM user_info').all();

        const userInfo = {
            currentTokenID: users.length > 0 ? users[0].token_id : 1,
            list: {}
        };

        const achievements = {};
        const textjoins = {};
        const customNotAchieved = {};

        for (const user of users) {
            userInfo.list[user.token_id] = {
                tokenID: user.token_id,
                avatar: user.avatar,
                uid: user.uid,
                name: user.name
            };

            // Get achievement data
            const achData = db.prepare('SELECT data FROM user_achievement WHERE uid = ?').get(user.uid);
            if (achData) {
                achievements[user.token_id] = JSON.parse(achData.data);
            }

            // Get textjoin data
            const textData = db.prepare('SELECT data FROM user_textjoin WHERE uid = ?').get(user.uid);
            if (textData) {
                textjoins[user.token_id] = JSON.parse(textData.data);
            }

            // Get custom not achieved data
            const customData = db.prepare('SELECT data FROM user_custom_not_achieved WHERE uid = ?').get(user.uid);
            if (customData) {
                customNotAchieved[user.token_id] = JSON.parse(customData.data);
            }
        }

        res.json({
            success: true,
            data: {
                userInfo,
                achievements,
                textjoins,
                customNotAchieved
            }
        });
    } catch (error) {
        console.error('Error fetching sync data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

