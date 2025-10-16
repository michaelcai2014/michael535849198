const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const router = express.Router();

// 生成JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: '24h'
  });
};

// 登录验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '访问令牌缺失' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '无效的访问令牌' });
    }
    req.user = user;
    next();
  });
};

// 传统登录
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成token
    const token = generateToken(user._id);

    // 记录登录日志
    await AuditLog.log({
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id,
      operator: user._id,
      description: `用户 ${username} 登录系统`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          wechatNickname: user.wechatNickname
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 微信授权登录
router.post('/wechat-login', [
  body('code').notEmpty().withMessage('微信授权码不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { code, nickname, avatar } = req.body;

    // 这里应该调用微信API获取openid
    // 为了演示，我们使用模拟数据
    const openId = `mock_openid_${Date.now()}`;

    // 查找或创建用户
    let user = await User.findOne({ wechatOpenId: openId });
    
    if (!user) {
      // 创建新用户
      user = new User({
        username: `wechat_${Date.now()}`,
        password: 'default_password', // 微信用户使用默认密码
        wechatOpenId: openId,
        wechatNickname: nickname,
        wechatAvatar: avatar,
        role: 'employee'
      });
      await user.save();
    } else {
      // 更新微信信息
      user.wechatNickname = nickname;
      user.wechatAvatar = avatar;
      user.lastLogin = new Date();
      await user.save();
    }

    // 生成token
    const token = generateToken(user._id);

    // 记录登录日志
    await AuditLog.log({
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id,
      operator: user._id,
      description: `用户通过微信登录: ${nickname}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '微信登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          wechatNickname: user.wechatNickname,
          wechatAvatar: user.wechatAvatar
        }
      }
    });

  } catch (error) {
    console.error('微信登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 登出
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // 记录登出日志
    await AuditLog.log({
      action: 'LOGOUT',
      entityType: 'User',
      entityId: req.user.userId,
      operator: req.user.userId,
      description: '用户登出系统',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = { router, authenticateToken };
