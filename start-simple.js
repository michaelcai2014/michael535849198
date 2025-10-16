// 简化版启动脚本 - 不依赖MongoDB
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 添加请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 模拟数据
const mockUsers = [
  { id: 1, username: 'Michael', password: '123456', role: 'admin', wechatNickname: 'Michael' }
];

const mockProjects = [
  {
    id: 1,
    projectName: '电动车营销APP',
    customerIdentity: '老板',
    customerCategory: '潜客',
    customerBackground: '初创企业',
    channel: 'Michael',
    follower: 'Michael',
    priority: '高',
    status: 'WIP',
    details: '这是一个测试项目',
    lastUpdated: new Date()
  }
];

const mockDealProjects = [];

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // 接受所有mock-token开头的token
  if (token && token.startsWith('mock-token')) {
    req.user = { userId: 1, role: 'admin' };
    next();
  } else {
    res.status(401).json({ success: false, message: '访问令牌缺失' });
  }
};

// 登录接口
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 查找用户
  const user = mockUsers.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
  
  // 验证密码（实际应用中应该使用加密密码比较）
  const isPasswordValid = user.password ? user.password === password : (username === 'Michael' && password === '123456');
  
  if (isPasswordValid) {
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token: 'mock-token-' + user.id,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          wechatNickname: user.wechatNickname
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

// 获取用户信息
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      _id: 1,
      username: 'Michael',
      role: 'admin',
      wechatNickname: 'Michael'
    }
  });
});

// 获取跟进项目列表
app.get('/api/tracking', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      projects: mockProjects.map(project => ({
        ...project,
        _id: project.id,
        follower: { username: project.follower, wechatNickname: project.follower }
      }))
    }
  });
});

// 获取成交项目列表
app.get('/api/projects', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      projects: mockDealProjects.map(project => ({
        ...project,
        _id: project.id,
        follower: { username: project.follower, wechatNickname: project.follower }
      }))
    }
  });
});

// 获取单个成交项目详情
app.get('/api/projects/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = mockDealProjects.find(p => p.id === projectId);
  
  if (project) {
    res.json({
      success: true,
      data: {
        ...project,
        _id: project.id,
        follower: { username: project.follower, wechatNickname: project.follower }
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }
});

// 更新成交项目
app.put('/api/projects/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const projectIndex = mockDealProjects.findIndex(p => p.id === projectId);
  
  if (projectIndex !== -1) {
    // 只允许更新状态和进展
    mockDealProjects[projectIndex] = {
      ...mockDealProjects[projectIndex],
      status: req.body.status || mockDealProjects[projectIndex].status,
      progress: req.body.progress !== undefined ? req.body.progress : mockDealProjects[projectIndex].progress,
      lastUpdated: new Date()
    };
    
    console.log('成交项目更新:', mockDealProjects[projectIndex].projectName);
    
    res.json({
      success: true,
      message: '项目更新成功',
      data: mockDealProjects[projectIndex]
    });
  } else {
    res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }
});

// 获取用户列表
app.get('/api/users', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: mockUsers.map(user => ({
      ...user,
      _id: user.id,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date()
    }))
  });
});

// 创建新用户
app.post('/api/users', authenticateToken, (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }
  
  // 检查用户名是否已存在
  if (mockUsers.find(u => u.username === username)) {
    return res.status(400).json({
      success: false,
      message: '用户名已存在'
    });
  }
  
  const newUser = {
    id: mockUsers.length + 1,
    username,
    password, // 实际应用中应该加密
    role: role || 'employee',
    wechatNickname: username,
    createdAt: new Date()
  };
  
  mockUsers.push(newUser);
  
  console.log('新用户创建成功:', username);
  
  res.status(201).json({
    success: true,
    message: '用户创建成功',
    data: {
      _id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      wechatNickname: newUser.wechatNickname
    }
  });
});

// 获取操作日志
app.get('/api/logs', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      logs: [
        {
          _id: 1,
          timestamp: new Date(),
          operator: { username: 'Michael' },
          action: 'LOGIN',
          entityType: 'User',
          description: '用户登录系统',
          ipAddress: '127.0.0.1'
        }
      ]
    }
  });
});

// 创建跟进项目
app.post('/api/tracking', authenticateToken, (req, res) => {
  const newProject = {
    id: mockProjects.length + 1,
    ...req.body,
    channel: req.body.channel || '', // 允许空值
    lastUpdated: new Date()
  };
  mockProjects.push(newProject);
  
  res.status(201).json({
    success: true,
    message: '项目创建成功',
    data: {
      ...newProject,
      _id: newProject.id
    }
  });
});

// 更新跟进项目
app.put('/api/tracking/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const projectIndex = mockProjects.findIndex(p => p.id === projectId);
  
  if (projectIndex !== -1) {
    const oldProject = { ...mockProjects[projectIndex] };
    const newStatus = req.body.status;
    
    mockProjects[projectIndex] = {
      ...mockProjects[projectIndex],
      ...req.body,
      lastUpdated: new Date()
    };
    
    // 如果状态从非Deal变为Deal，自动创建成交项目
    if (oldProject.status !== 'Deal' && newStatus === 'Deal') {
      const dealProject = {
        id: mockDealProjects.length + 1,
        projectName: mockProjects[projectIndex].projectName,
        dealDate: new Date(),
        originalTrackingProject: projectId,
        channel: mockProjects[projectIndex].channel || '',
        follower: mockProjects[projectIndex].follower,
        progress: mockProjects[projectIndex].details || '',
        status: '进行中',
        lastUpdated: new Date()
      };
      
      mockDealProjects.push(dealProject);
      console.log('自动创建成交项目:', dealProject.projectName);
    }
    
    res.json({
      success: true,
      message: '项目更新成功',
      data: {
        ...mockProjects[projectIndex],
        _id: mockProjects[projectIndex].id
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }
});

// 删除跟进项目
app.delete('/api/tracking/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const projectIndex = mockProjects.findIndex(p => p.id === projectId);
  
  if (projectIndex !== -1) {
    mockProjects.splice(projectIndex, 1);
    res.json({
      success: true,
      message: '项目删除成功'
    });
  } else {
    res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }
});

// 添加跟进记录
app.post('/api/tracking/:id/follow-up', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = mockProjects.find(p => p.id === projectId);
  
  if (project) {
    if (!project.followUpRecords) {
      project.followUpRecords = [];
    }
    
    const now = new Date();
    project.followUpRecords.push({
      content: req.body.content,
      date: now,
      updatedBy: { 
        username: 'Michael',
        wechatNickname: 'Michael'
      },
      timestamp: now.toISOString(),
      formattedDate: now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    });
    
    project.lastUpdated = now;
    
    res.json({
      success: true,
      message: '跟进记录添加成功',
      data: project
    });
  } else {
    res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }
});

// 获取项目详情
app.get('/api/tracking/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = mockProjects.find(p => p.id === projectId);
  
  if (project) {
    res.json({
      success: true,
      data: {
        ...project,
        _id: project.id,
        follower: { 
          username: project.follower, 
          wechatNickname: project.follower,
          _id: project.follower
        }
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }
});

// 微信配置
app.get('/api/wechat/config', (req, res) => {
  res.json({
    success: true,
    data: {
      appId: 'wx1234567890abcdef',
      redirectUri: `${req.protocol}://${req.get('host')}/api/wechat/callback`,
      scope: 'snsapi_login',
      state: 'STATE'
    }
  });
});

// 检查微信登录状态
app.get('/api/wechat/check-login', (req, res) => {
  const { state } = req.query;
  
  // 模拟检查登录状态
  // 在实际应用中，这里应该检查微信API的登录状态
  const mockLoggedIn = Math.random() > 0.8; // 20%概率模拟登录成功
  
  if (mockLoggedIn) {
    res.json({
      success: true,
      loggedIn: true,
      user: {
        id: 2,
        username: 'wechat_user_' + Date.now(),
        role: 'employee',
        wechatNickname: '微信用户',
        wechatAvatar: 'https://via.placeholder.com/100x100?text=WX'
      }
    });
  } else {
    res.json({
      success: true,
      loggedIn: false
    });
  }
});

// 微信登录回调
app.get('/api/wechat/callback', (req, res) => {
  const { code, state } = req.query;
  
  // 模拟微信登录成功
  res.json({
    success: true,
    message: '微信登录成功',
    data: {
      token: 'mock-token',
      user: {
        id: 2,
        username: 'wechat_user_' + Date.now(),
        role: 'employee',
        wechatNickname: '微信用户',
        wechatAvatar: 'https://via.placeholder.com/100x100?text=WX'
      }
    }
  });
});

// 微信登录
app.post('/api/auth/wechat-login', (req, res) => {
  res.json({
    success: true,
    message: '微信登录成功',
    data: {
      token: 'mock-token',
      user: {
        id: 2,
        username: 'wechat_user_' + Date.now(),
        role: 'employee',
        wechatNickname: req.body.nickname || '微信用户',
        wechatAvatar: req.body.avatar
      }
    }
  });
});

// 登出
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 微信推送通知API
app.post('/api/wechat/notify', authenticateToken, (req, res) => {
  const { type, data } = req.body;
  
  console.log('📱 微信推送通知:');
  console.log('   类型:', type);
  console.log('   内容:', JSON.stringify(data, null, 2));
  
  // 实际应用中这里会调用微信API发送模板消息
  // 现在只是记录日志
  
  res.json({
    success: true,
    message: '推送通知已发送'
  });
});

// 微信绑定接口
app.get('/api/wechat/bind', (req, res) => {
  const { state, user } = req.query;
  
  // 实际应用中这里会调用微信API获取用户信息
  // 现在返回模拟的绑定页面
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>微信绑定</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        .success { color: #52c41a; font-size: 48px; }
        button { padding: 10px 30px; font-size: 16px; background: #52c41a; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="success">✓</div>
      <h2>微信绑定成功！</h2>
      <p>用户: ${user}</p>
      <p>您现在可以接收微信推送通知了</p>
      <button onclick="window.close()">关闭页面</button>
      <script>
        // 通知主页面绑定成功
        if (window.opener) {
          window.opener.postMessage({ type: 'wechat_bound', state: '${state}' }, '*');
        }
        // 3秒后自动关闭
        setTimeout(() => window.close(), 3000);
      </script>
    </body>
    </html>
  `);
});

// 检查微信绑定状态
app.get('/api/wechat/bind-status', authenticateToken, (req, res) => {
  const { state } = req.query;
  
  // 实际应用中这里会检查数据库中的绑定状态
  // 现在模拟绑定成功
  const isBound = Math.random() > 0.7; // 30%概率返回已绑定
  
  res.json({
    success: true,
    bound: isBound,
    wechatInfo: isBound ? {
      nickname: req.user.username + '_WeChat',
      openid: 'mock_openid_' + Date.now()
    } : null
  });
});

// 管理员添加反馈到项目
app.post('/api/tracking/:id/admin-remark', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const { remark } = req.body;
  const project = mockProjects.find(p => p.id === projectId);
  
  if (project) {
    const now = new Date();
    const remarkRecord = {
      content: `【管理员备注】${remark}`,
      date: now,
      updatedBy: { 
        username: 'Michael',
        wechatNickname: 'Michael'
      },
      timestamp: now.toISOString(),
      formattedDate: now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      isAdminRemark: true
    };
    
    if (!project.followUpRecords) {
      project.followUpRecords = [];
    }
    project.followUpRecords.push(remarkRecord);
    project.lastUpdated = now;
    
    console.log('📝 管理员添加备注:', project.projectName);
    console.log('   备注内容:', remark);
    console.log('   推送给:', project.follower);
    
    res.json({
      success: true,
      message: '备注添加成功',
      data: project
    });
  } else {
    res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }
});

// 微信登录回调（演示）
app.get('/api/wechat/callback', (req, res) => {
  res.redirect('/?wechat_login=success');
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Tunda项目管理系统已启动！`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
  console.log(`👤 管理员账号: Michael / 123456`);
  console.log(`💡 这是一个演示版本，使用模拟数据`);
  console.log(`🔧 按 Ctrl+C 停止服务`);
});

module.exports = app;
