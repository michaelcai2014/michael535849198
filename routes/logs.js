const express = require('express');
const { authenticateToken } = require('./auth');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const router = express.Router();

// 获取审计日志
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      entityType, 
      action, 
      operator, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;

    // 构建查询条件
    const query = {};
    if (entityType) query.entityType = entityType;
    if (action) query.action = action;
    if (operator) query.operator = operator;
    
    // 日期范围查询
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // 非管理员只能看到自己的操作日志
    if (req.user.role !== 'admin') {
      query.operator = req.user.userId;
    }

    const logs = await AuditLog.find(query)
      .populate('operator', 'username wechatNickname')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('获取审计日志错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取特定实体的操作历史
router.get('/entity/:entityType/:entityId', authenticateToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = { entityType, entityId };
    
    // 非管理员只能看到自己相关的操作
    if (req.user.role !== 'admin') {
      query.operator = req.user.userId;
    }

    const logs = await AuditLog.find(query)
      .populate('operator', 'username wechatNickname')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('获取实体操作历史错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户操作统计
router.get('/stats/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 权限检查
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    const stats = await AuditLog.aggregate([
      { $match: { operator: userId } },
      { 
        $group: { 
          _id: '$action', 
          count: { $sum: 1 },
          lastAction: { $max: '$timestamp' }
        } 
      }
    ]);

    const totalActions = await AuditLog.countDocuments({ operator: userId });
    const recentActions = await AuditLog.find({ operator: userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('operator', 'username wechatNickname');

    res.json({
      success: true,
      data: {
        stats,
        totalActions,
        recentActions
      }
    });

  } catch (error) {
    console.error('获取用户操作统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取系统操作统计（仅管理员）
router.get('/stats/system', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: today } } },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    const weeklyStats = await AuditLog.aggregate([
      { 
        $match: { 
          timestamp: { 
            $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) 
          } 
        } 
      },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    const userStats = await AuditLog.aggregate([
      { $group: { _id: '$operator', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        todayStats,
        weeklyStats,
        userStats
      }
    });

  } catch (error) {
    console.error('获取系统操作统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 导出日志（仅管理员）
router.get('/export', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const { startDate, endDate, format = 'json' } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('operator', 'username wechatNickname')
      .sort({ timestamp: -1 });

    if (format === 'csv') {
      // 生成CSV格式
      const csvHeader = '时间,操作者,操作类型,实体类型,实体ID,描述,IP地址\n';
      const csvData = logs.map(log => 
        `${log.timestamp},${log.operator.username},${log.action},${log.entityType},${log.entityId},${log.description},${log.ipAddress}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      res.send(csvHeader + csvData);
    } else {
      // JSON格式
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
      res.json({
        success: true,
        data: logs,
        exportTime: new Date(),
        totalRecords: logs.length
      });
    }

  } catch (error) {
    console.error('导出日志错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
