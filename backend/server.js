// 加载环境变量
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Baserow配置
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const TABLE_ID = process.env.TABLE_ID;
const BASEROW_API_URL = 'https://api.baserow.io';

// Check if token exists
if (!BASEROW_TOKEN) {
    console.error('❌ BASEROW_TOKEN not found in .env!');
    process.exit(1);
}

console.log('✅ Baserow Token loaded (length:', BASEROW_TOKEN.length, 'chars)');
console.log('✅ Table ID:', TABLE_ID);

// 创建Axios实例
const baserowApi = axios.create({
    baseURL: BASEROW_API_URL,
    headers: {
        'Authorization': `Token ${BASEROW_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// 辅助函数：添加user_field_names参数
const addUserFieldNames = (url) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}user_field_names=true`;
};

// ============== API路由 ==============

// 获取所有用户
app.get('/api/users', async (req, res) => {
    try {
        const response = await baserowApi.get(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/`)
        );
        console.log('✅ Fetched users from Baserow:', response.data.results?.length || 0);
        res.json(response.data);
    } catch (error) {
        console.error('❌ 获取用户失败:', error.response?.data || error.message);
        res.status(500).json({ error: '获取用户失败: ' + (error.response?.data?.detail || error.message) });
    }
});

// 创建新用户
app.post('/api/users', async (req, res) => {
    try {
        const { Username, Email, 'Total Score': totalScore = 0, 'Games Played': gamesPlayed = 0, 'Correct Guesses': correctGuesses = 0 } = req.body;
        
        const userData = {
            Username: Username,
            Email: Email,
            'Signup Date': new Date().toISOString(),
            'Total Score': totalScore,
            'Games Played': gamesPlayed,
            'Correct Guesses': correctGuesses
        };

        console.log('📝 Creating user in Baserow:', userData);
        
        const response = await baserowApi.post(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/`),
            userData
        );
        
        console.log('✅ User created successfully in Baserow! ID:', response.data.id);
        console.log('✅ Full response:', JSON.stringify(response.data, null, 2));
        res.json(response.data);
    } catch (error) {
        console.error('❌ 创建用户失败:', error.response?.data || error.message);
        res.status(500).json({ error: '创建用户失败: ' + (error.response?.data?.detail || error.message) });
    }
});

// 更新用户 - FIXED VERSION
app.patch('/api/users/:row_id', async (req, res) => {
    try {
        const { row_id } = req.params;
        const updateData = req.body;
        
        console.log(`📝 Updating user ${row_id} in Baserow with:`, updateData);
        
        // First, get the current user data to verify
        const currentUser = await baserowApi.get(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/${row_id}/`)
        );
        console.log('Current user data:', {
            id: currentUser.data.id,
            username: currentUser.data.Username,
            currentScore: currentUser.data['Total Score'],
            currentGames: currentUser.data['Games Played']
        });
        
        // Update the user
        const response = await baserowApi.patch(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/${row_id}/`),
            updateData
        );
        
        console.log('✅ User updated successfully in Baserow!');
        console.log('New data:', {
            id: response.data.id,
            username: response.data.Username,
            newScore: response.data['Total Score'],
            newGames: response.data['Games Played']
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('❌ 更新用户失败:', error.response?.data || error.message);
        res.status(500).json({ 
            error: '更新用户失败: ' + (error.response?.data?.detail || error.message),
            details: error.response?.data
        });
    }
});

// 测试端点 - 直接更新分数
app.post('/api/users/:row_id/add-score', async (req, res) => {
    try {
        const { row_id } = req.params;
        const { points, games } = req.body;
        
        console.log(`📝 Adding ${points} points and ${games} games to user ${row_id}`);
        
        // Get current user
        const currentUser = await baserowApi.get(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/${row_id}/`)
        );
        
        const currentScore = currentUser.data['Total Score'] || 0;
        const currentGames = currentUser.data['Games Played'] || 0;
        const currentGuesses = currentUser.data['Correct Guesses'] || 0;
        
        const newScore = currentScore + points;
        const newGames = currentGames + games;
        const newGuesses = currentGuesses + (points / 10); // Approximate guesses
        
        // Update user
        const response = await baserowApi.patch(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/${row_id}/`),
            {
                'Total Score': newScore,
                'Games Played': newGames,
                'Correct Guesses': newGuesses
            }
        );
        
        console.log(`✅ Updated: Score ${currentScore} → ${newScore}, Games ${currentGames} → ${newGames}`);
        res.json(response.data);
        
    } catch (error) {
        console.error('❌ Failed to add score:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to add score' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/users`);
    console.log(`📊 Baserow Table: ${TABLE_ID}`);
    console.log(`\n💡 Test commands:`);
    console.log(`   GET all users: curl http://localhost:${PORT}/api/users`);
    console.log(`   GET specific user: curl http://localhost:${PORT}/api/users/ROW_ID`);
    console.log(`\n`);
});