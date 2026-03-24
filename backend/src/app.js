// Express应用配置
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const os = require('os');  // 添加这行

const app = express();

// 获取本机局域网IP的函数
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (let name of Object.keys(interfaces)) {
        for (let iface of interfaces[name]) {
            // 跳过内部地址和非IPv4
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// 中间件配置
app.use(cors());                // 允许跨域请求
app.use(express.json());        // 解析JSON请求体

// 提供前端静态文件
const path = require('path');
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// 如果没有.env文件，使用默认值
const BASEROW_API_URL = process.env.BASEROW_API_URL || 'https://api.baserow.io';
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const TABLE_ID = process.env.TABLE_ID;
const PORT = process.env.PORT || 3000;

// 检查必要的配置
if (!BASEROW_TOKEN) {
    console.warn('⚠️  警告: BASEROW_TOKEN 未在.env文件中配置');
}
if (!TABLE_ID) {
    console.warn('⚠️  警告: TABLE_ID 未在.env文件中配置');
}

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

// ============== API路由（保持不变） ==============

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: '服务器运行正常',
        config: {
            hasToken: !!BASEROW_TOKEN,
            hasTableId: !!TABLE_ID
        }
    });
});

// 获取所有用户
app.get('/api/users', async (req, res) => {
    try {
        if (!BASEROW_TOKEN || !TABLE_ID) {
            return res.status(500).json({ error: '服务器配置错误，请检查.env文件' });
        }

        const response = await baserowApi.get(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/`)
        );
        res.json(response.data);
    } catch (error) {
        console.error('获取用户失败:', error.response?.data || error.message);
        res.status(500).json({ error: '获取用户失败', details: error.message });
    }
});

// 根据ID获取单个用户
app.get('/api/users/:row_id', async (req, res) => {
    try {
        const { row_id } = req.params;
        const response = await baserowApi.get(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/${row_id}/`)
        );
        res.json(response.data);
    } catch (error) {
        console.error('获取用户失败:', error.response?.data || error.message);
        res.status(500).json({ error: '获取用户失败' });
    }
});

// 创建新用户
app.post('/api/users', async (req, res) => {
    try {
        const {
            Username,
            Email,
            'Total Score': totalScore = 0,
            'Games Played': gamesPlayed = 0,
            'Correct Guesses': correctGuesses = 0,
            Ranking = []
        } = req.body;

        if (!Username || !Email) {
            return res.status(400).json({ error: '用户名和邮箱不能为空' });
        }

        const userData = {
            Username,
            Email,
            'Signup Date': new Date().toISOString(),
            'Total Score': totalScore,
            'Games Played': gamesPlayed,
            'Correct Guesses': correctGuesses,
            Ranking
        };

        const response = await baserowApi.post(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/`),
            userData
        );

        res.json(response.data);
    } catch (error) {
        console.error('创建用户失败:', error.response?.data || error.message);
        res.status(500).json({ error: '创建用户失败', details: error.message });
    }
});

// 更新用户分数
app.patch('/api/users/:row_id/score', async (req, res) => {
    try {
        const { row_id } = req.params;
        const { score } = req.body;

        const currentUser = await baserowApi.get(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/${row_id}/`)
        );

        const currentScore = parseInt(currentUser.data['Total Score']) || 0;
        const newScore = currentScore + score;

        const response = await baserowApi.patch(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/${row_id}/`),
            { 'Total Score': newScore }
        );

        res.json(response.data);
    } catch (error) {
        console.error('更新分数失败:', error.response?.data || error.message);
        res.status(500).json({ error: '更新分数失败' });
    }
});

// 完整更新用户信息
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
        res.status(500).json({ error: '更新用户失败' });
    }
});

// 删除用户
app.delete('/api/users/:row_id', async (req, res) => {
    try {
        const { row_id } = req.params;
        await baserowApi.delete(`/api/database/rows/table/${TABLE_ID}/${row_id}/`);
        res.json({ message: '用户删除成功' });
    } catch (error) {
        console.error('删除用户失败:', error.response?.data || error.message);
        res.status(500).json({ error: '删除用户失败' });
    }
});

// 获取排行榜
app.get('/api/leaderboard', async (req, res) => {
    try {
        const response = await baserowApi.get(
            addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/`)
        );

        const users = response.data.results || response.data;
        const leaderboard = users
            .filter(user => user['Total Score'] !== undefined)
            .sort((a, b) => {
                const scoreA = parseInt(a['Total Score']) || 0;
                const scoreB = parseInt(b['Total Score']) || 0;
                return scoreB - scoreA;
            })
            .slice(0, 10);

        res.json(leaderboard);
    } catch (error) {
        console.error('获取排行榜失败:', error.response?.data || error.message);
        res.status(500).json({ error: '获取排行榜失败' });
    }
});

// 处理所有其他路由，返回index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// 启动服务器 - 监听所有网络接口
const localIP = getLocalIP();
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('✅ 同义词大师游戏服务器已启动！');
    console.log('========================================');
    console.log(`📌 本机访问: http://localhost:${PORT}`);
    console.log(`📌 局域网访问: http://${localIP}:${PORT}`);
    console.log('\n📝 其他设备可以通过局域网IP访问');
    console.log('========================================\n');
});

module.exports = app;