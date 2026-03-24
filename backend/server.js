// 加载环境变量
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());                    // 允许跨域请求
app.use(express.json());            // 解析JSON请求体
app.use(express.static('../frontend')); // 提供前端静态文件

// Baserow配置
const BASEROW_API_URL = process.env.BASEROW_API_URL;
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const TABLE_ID = process.env.TABLE_ID;

// 创建Axios实例，配置默认请求头
const baserowApi = axios.create({
  baseURL: BASEROW_API_URL,
  headers: {
    'Authorization': `Token ${BASEROW_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// 辅助函数：添加user_field_names参数，让返回的字段名使用实际名称而非field_xxx
const addUserFieldNames = (url) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}user_field_names=true`;
};

// ============== API路由 ==============

// 获取所有用户（用于排行榜）
app.get('/api/users', async (req, res) => {
  try {
    const response = await baserowApi.get(
      addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/`)
    );
    res.json(response.data);
  } catch (error) {
    console.error('获取用户失败:', error.response?.data || error.message);
    res.status(500).json({ error: '获取用户失败' });
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
    const { Username, Email, 'Total Score': totalScore = 0, Ranking = [] } = req.body;
    
    // 构建用户数据
    const userData = {
      Username,
      Email,
      'Signup Date': new Date().toISOString(),  // 注册日期
      'Total Score': totalScore,                 // 总分
      Ranking                                    // 排名关联
    };

    const response = await baserowApi.post(
      addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/`),
      userData
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('创建用户失败:', error.response?.data || error.message);
    res.status(500).json({ error: '创建用户失败' });
  }
});

// 更新用户分数（增加分数）
app.patch('/api/users/:row_id/score', async (req, res) => {
  try {
    const { row_id } = req.params;
    const { score } = req.body;
    
    // 先获取当前用户信息
    const currentUser = await baserowApi.get(
      addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/${row_id}/`)
    );
    
    const currentScore = currentUser.data['Total Score'] || 0;
    const newScore = currentScore + score;
    
    // 更新分数
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

// 获取排行榜（按分数排序的前10名）
app.get('/api/leaderboard', async (req, res) => {
  try {
    const response = await baserowApi.get(
      addUserFieldNames(`/api/database/rows/table/${TABLE_ID}/`)
    );
    
    const users = response.data.results || response.data;
    // 按总分降序排序，取前10名
    const leaderboard = users
      .sort((a, b) => (b['Total Score'] || 0) - (a['Total Score'] || 0))
      .slice(0, 10);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('获取排行榜失败:', error.response?.data || error.message);
    res.status(500).json({ error: '获取排行榜失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});