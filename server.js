const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config({ path: './config.env' });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use('/api/', limiter);

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tunda_project_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('数据库连接成功'))
.catch(err => console.error('数据库连接失败:', err));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/wechat', require('./routes/wechat'));

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`用户 ${socket.id} 加入房间 ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

// 将 io 实例传递给路由
app.set('io', io);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '接口不存在' 
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = { app, io };
