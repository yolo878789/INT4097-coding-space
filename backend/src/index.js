// 加载环境变量（必须在最前面）
require('dotenv').config();

// 导入应用
const app = require('./app');
const PORT = process.env.PORT || 3000;

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ 服务器运行成功！`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`🎮 游戏地址: http://localhost:${PORT}`);
  console.log(`📊 API地址: http://localhost:${PORT}/api/health`);
});