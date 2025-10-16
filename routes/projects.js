const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('./auth');
const DealProject = require('../models/DealProject');
const AuditLog = require('../models/AuditLog');
const router = express.Router();

// 获取所有已成交项目
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, follower, page = 1, limit = 20 } = req.query;
    
    // 构建查询条件
    const query = { isActive: true };
    if (status) query.status = status;
    if (follower) query.follower = follower;
    
    // 非管理员只能看到自己的项目
    if (req.user.role !== 'admin') {
      query.follower = req.user.userId;
    }

    const projects = await DealProject.find(query)
      .populate('follower', 'username wechatNickname')
      .populate('originalTrackingProject', 'projectName')
      .sort({ dealDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DealProject.countDocuments(query);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('获取成交项目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建成交项目（手动创建）
router.post('/', authenticateToken, [
  body('projectName').notEmpty().withMessage('项目名称不能为空'),
  body('channel').isIn(['蔡宗林', 'Michael', '视频号', '抖音']).withMessage('渠道无效'),
  body('follower').isMongoId().withMessage('跟进人ID无效'),
  body('status').optional().isIn(['挂单', '进行中', '已关闭', '已完成']).withMessage('状态无效'),
  body('progress').optional().isLength({ max: 10000 }).withMessage('项目进展不能超过10000字')
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

    const projectData = {
      ...req.body,
      follower: req.body.follower || req.user.userId
    };

    // 创建项目
    const project = new DealProject(projectData);
    await project.save();

    // 记录创建日志
    await AuditLog.log({
      action: 'CREATE',
      entityType: 'DealProject',
      entityId: project._id,
      operator: req.user.userId,
      description: `手动创建成交项目: ${project.projectName}`,
      changes: [{
        field: 'projectName',
        newValue: project.projectName
      }],
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: '成交项目创建成功',
      data: project
    });

  } catch (error) {
    console.error('创建成交项目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新成交项目
router.put('/:id', authenticateToken, [
  body('projectName').optional().notEmpty().withMessage('项目名称不能为空'),
  body('channel').optional().isIn(['蔡宗林', 'Michael', '视频号', '抖音']).withMessage('渠道无效'),
  body('follower').optional().isMongoId().withMessage('跟进人ID无效'),
  body('status').optional().isIn(['挂单', '进行中', '已关闭', '已完成']).withMessage('状态无效'),
  body('progress').optional().isLength({ max: 10000 }).withMessage('项目进展不能超过10000字')
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

    // 查找项目
    const project = await DealProject.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 权限检查：非管理员只能更新自己的项目
    if (req.user.role !== 'admin' && project.follower.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 记录变更
    const changes = [];
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== project[key]) {
        changes.push({
          field: key,
          oldValue: project[key],
          newValue: updateData[key]
        });
      }
    });

    // 更新项目
    Object.assign(project, updateData);
    project.lastUpdated = new Date();
    await project.save();

    // 记录更新日志
    if (changes.length > 0) {
      await AuditLog.log({
        action: 'UPDATE',
        entityType: 'DealProject',
        entityId: project._id,
        operator: req.user.userId,
        description: `更新成交项目: ${project.projectName}`,
        changes,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.json({
      success: true,
      message: '项目更新成功',
      data: project
    });

  } catch (error) {
    console.error('更新成交项目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 添加项目进展记录
router.post('/:id/progress', authenticateToken, [
  body('content').notEmpty().withMessage('进展内容不能为空')
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
    const { content } = req.body;

    // 查找项目
    const project = await DealProject.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 权限检查
    if (req.user.role !== 'admin' && project.follower.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 添加进展记录
    project.progressRecords.push({
      content,
      updatedBy: req.user.userId
    });
    project.lastUpdated = new Date();
    await project.save();

    // 记录日志
    await AuditLog.log({
      action: 'UPDATE',
      entityType: 'DealProject',
      entityId: project._id,
      operator: req.user.userId,
      description: `添加项目进展: ${project.projectName}`,
      changes: [{
        field: 'progressRecords',
        newValue: content
      }],
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '进展记录添加成功',
      data: project
    });

  } catch (error) {
    console.error('添加进展记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除成交项目
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 查找项目
    const project = await DealProject.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 权限检查
    if (req.user.role !== 'admin' && project.follower.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 软删除
    project.isActive = false;
    await project.save();

    // 记录删除日志
    await AuditLog.log({
      action: 'DELETE',
      entityType: 'DealProject',
      entityId: project._id,
      operator: req.user.userId,
      description: `删除成交项目: ${project.projectName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '项目删除成功'
    });

  } catch (error) {
    console.error('删除成交项目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取项目详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await DealProject.findById(id)
      .populate('follower', 'username wechatNickname')
      .populate('originalTrackingProject', 'projectName details')
      .populate('progressRecords.updatedBy', 'username wechatNickname');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 权限检查
    if (req.user.role !== 'admin' && project.follower._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('获取项目详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取项目统计信息
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const query = { isActive: true };
    
    // 非管理员只能看到自己的项目
    if (req.user.role !== 'admin') {
      query.follower = req.user.userId;
    }

    const totalProjects = await DealProject.countDocuments(query);
    const statusStats = await DealProject.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const channelStats = await DealProject.aggregate([
      { $match: query },
      { $group: { _id: '$channel', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalProjects,
        statusStats,
        channelStats
      }
    });

  } catch (error) {
    console.error('获取项目统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
