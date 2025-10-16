const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('./auth');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const router = express.Router();

// 管理员权限检查中间件
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }
  next();
};

// 获取所有用户（管理员）
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建员工账号（管理员）
router.post('/', authenticateToken, requireAdmin, [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('role').isIn(['admin', 'employee']).withMessage('角色必须是admin或employee')
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

    const { username, password, role } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      password,
      role,
      createdBy: req.user.userId
    });

    await user.save();

    // 记录创建日志
    await AuditLog.log({
      action: 'CREATE',
      entityType: 'User',
      entityId: user._id,
      operator: req.user.userId,
      description: `管理员创建新用户: ${username}`,
      changes: [{
        field: 'username',
        newValue: username
      }, {
        field: 'role',
        newValue: role
      }],
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新用户信息（管理员）
router.put('/:id', authenticateToken, requireAdmin, [
  body('username').optional().notEmpty().withMessage('用户名不能为空'),
  body('password').optional().isLength({ min: 6 }).withMessage('密码至少6位'),
  body('role').optional().isIn(['admin', 'employee']).withMessage('角色必须是admin或employee'),
  body('isActive').optional().isBoolean().withMessage('激活状态必须是布尔值')
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

    const { id } = req.params;
    const updateData = req.body;

    // 查找用户
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 记录变更
    const changes = [];
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== user[key]) {
        changes.push({
          field: key,
          oldValue: user[key],
          newValue: updateData[key]
        });
      }
    });

    // 更新用户
    Object.assign(user, updateData);
    await user.save();

    // 记录更新日志
    if (changes.length > 0) {
      await AuditLog.log({
        action: 'UPDATE',
        entityType: 'User',
        entityId: user._id,
        operator: req.user.userId,
        description: `管理员更新用户信息: ${user.username}`,
        changes,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除用户（管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 查找用户
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 软删除
    user.isActive = false;
    await user.save();

    // 记录删除日志
    await AuditLog.log({
      action: 'DELETE',
      entityType: 'User',
      entityId: user._id,
      operator: req.user.userId,
      description: `管理员删除用户: ${user.username}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 非管理员只能查看自己的信息
    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    const user = await User.findById(id).select('-password');
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
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
