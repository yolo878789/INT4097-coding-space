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
app.use(express.static('.')); // Change this to serve files from current directory

// Baserow配置
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const TABLE_ID = process.env.TABLE_ID;
const BASEROW_API_URL = 'https://api.baserow.io'; // Use this, not the full URL

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
        res.json(response.data);
    } catch (error) {
        console.error('获取用户失败:', error.response?.data || error.message);
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

        console.log('Creating user:', userData);
        
        const response = await baserowApi.post(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/`),
            userData
        );
        
        console.log('✅ User created successfully:', response.data.id);
        res.json(response.data);
    } catch (error) {
        console.error('创建用户失败:', error.response?.data || error.message);
        res.status(500).json({ error: '创建用户失败: ' + (error.response?.data?.detail || error.message) });
    }
});

// 更新用户
app.patch('/api/users/:row_id', async (req, res) => {
    try {
        const { row_id } = req.params;
        const response = await baserowApi.patch(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/${row_id}/`),
            req.body
        );
        res.json(response.data);
    } catch (error) {
        console.error('更新用户失败:', error.response?.data || error.message);
        res.status(500).json({ error: '更新用户失败: ' + (error.response?.data?.detail || error.message) });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/users`);
    console.log(`📊 Baserow Table: ${TABLE_ID}\n`);
});