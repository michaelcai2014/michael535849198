const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('./auth');
const TrackingProject = require('../models/TrackingProject');
const DealProject = require('../models/DealProject');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const router = express.Router();

// 获取所有跟进中的项目
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, follower, priority, page = 1, limit = 20 } = req.query;
    
    // 构建查询条件
    const query = { isActive: true };
    if (status) query.status = status;
    if (follower) query.follower = follower;
    if (priority) query.priority = priority;
    
    // 非管理员只能看到自己的项目
    if (req.user.role !== 'admin') {
      query.follower = req.user.userId;
    }

    const projects = await TrackingProject.find(query)
      .populate('follower', 'username wechatNickname')
      .sort({ lastUpdated: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TrackingProject.countDocuments(query);

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
    console.error('获取跟进项目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建跟进项目
router.post('/', authenticateToken, [
  body('projectName').notEmpty().withMessage('项目名称不能为空'),
  body('customerIdentity').isIn(['国内个人', '国外个人', '老板', '项目负责人', '项目执行', '中介']).withMessage('客户身份无效'),
  body('customerCategory').isIn(['嫖客', '潜客']).withMessage('客户类别无效'),
  body('customerBackground').isIn(['初创企业', '个人', '广告公司', '海外', '民企传统行业', '民企互联网']).withMessage('客户背景无效'),
  body('channel').isIn(['蔡宗林', 'Michael', '视频号', '抖音']).withMessage('渠道无效'),
  body('follower').isMongoId().withMessage('跟进人ID无效'),
  body('priority').optional().isIn(['高', '低']).withMessage('优先级无效'),
  body('status').optional().isIn(['WIP', 'Close', 'Deal', 'Pending']).withMessage('状态无效'),
  body('details').optional().isLength({ max: 10000 }).withMessage('详情不能超过10000字')
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
    const project = new TrackingProject(projectData);
    await project.save();

    // 记录创建日志
    await AuditLog.log({
      action: 'CREATE',
      entityType: 'TrackingProject',
      entityId: project._id,
      operator: req.user.userId,
      description: `创建跟进项目: ${project.projectName}`,
      changes: [{
        field: 'projectName',
        newValue: project.projectName
      }],
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 如果状态是Deal，自动创建成交项目
    if (project.status === 'Deal') {
      await createDealProject(project, req.user.userId);
    }

    res.status(201).json({
      success: true,
      message: '跟进项目创建成功',
      data: project
    });

  } catch (error) {
    console.error('创建跟进项目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新跟进项目
router.put('/:id', authenticateToken, [
  body('projectName').optional().notEmpty().withMessage('项目名称不能为空'),
  body('customerIdentity').optional().isIn(['国内个人', '国外个人', '老板', '项目负责人', '项目执行', '中介']).withMessage('客户身份无效'),
  body('customerCategory').optional().isIn(['嫖客', '潜客']).withMessage('客户类别无效'),
  body('customerBackground').optional().isIn(['初创企业', '个人', '广告公司', '海外', '民企传统行业', '民企互联网']).withMessage('客户背景无效'),
  body('channel').optional().isIn(['蔡宗林', 'Michael', '视频号', '抖音']).withMessage('渠道无效'),
  body('follower').optional().isMongoId().withMessage('跟进人ID无效'),
  body('priority').optional().isIn(['高', '低']).withMessage('优先级无效'),
  body('status').optional().isIn(['WIP', 'Close', 'Deal', 'Pending']).withMessage('状态无效'),
  body('details').optional().isLength({ max: 10000 }).withMessage('详情不能超过10000字'),
  body('adminNotes').optional().isLength({ max: 10000 }).withMessage('管理员备注不能超过10000字')
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
    const project = await TrackingProject.findById(id);
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
    const oldStatus = project.status;
    
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
        entityType: 'TrackingProject',
        entityId: project._id,
        operator: req.user.userId,
        description: `更新跟进项目: ${project.projectName}`,
        changes,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // 如果状态从非Deal变为Deal，自动创建成交项目
    if (oldStatus !== 'Deal' && project.status === 'Deal') {
      await createDealProject(project, req.user.userId);
    }

    // 发送微信推送通知
    await sendWechatNotification(project, req.user.userId, 'update');

    res.json({
      success: true,
      message: '项目更新成功',
      data: project
    });

  } catch (error) {
    console.error('更新跟进项目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 添加跟进记录
router.post('/:id/follow-up', authenticateToken, [
  body('content').notEmpty().withMessage('跟进内容不能为空')
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
    const project = await TrackingProject.findById(id);
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

    // 添加跟进记录
    project.followUpRecords.push({
      content,
      updatedBy: req.user.userId
    });
    project.lastUpdated = new Date();
    await project.save();

    // 记录日志
    await AuditLog.log({
      action: 'UPDATE',
      entityType: 'TrackingProject',
      entityId: project._id,
      operator: req.user.userId,
      description: `添加跟进记录: ${project.projectName}`,
      changes: [{
        field: 'followUpRecords',
        newValue: content
      }],
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 发送微信推送通知
    await sendWechatNotification(project, req.user.userId, 'follow-up');

    res.json({
      success: true,
      message: '跟进记录添加成功',
      data: project
    });

  } catch (error) {
    console.error('添加跟进记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除跟进项目
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 查找项目
    const project = await TrackingProject.findById(id);
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
      entityType: 'TrackingProject',
      entityId: project._id,
      operator: req.user.userId,
      description: `删除跟进项目: ${project.projectName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: '项目删除成功'
    });

  } catch (error) {
    console.error('删除跟进项目错误:', error);
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

    const project = await TrackingProject.findById(id)
      .populate('follower', 'username wechatNickname')
      .populate('followUpRecords.updatedBy', 'username wechatNickname');

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

// 辅助函数：创建成交项目
async function createDealProject(trackingProject, operatorId) {
  try {
    const dealProject = new DealProject({
      projectName: trackingProject.projectName,
      dealDate: new Date(),
      originalTrackingProject: trackingProject._id,
      channel: trackingProject.channel,
      follower: trackingProject.follower,
      progress: trackingProject.details,
      status: '进行中'
    });

    await dealProject.save();

    // 记录日志
    await AuditLog.log({
      action: 'CREATE',
      entityType: 'DealProject',
      entityId: dealProject._id,
      operator: operatorId,
      description: `自动创建成交项目: ${dealProject.projectName}`,
      changes: [{
        field: 'projectName',
        newValue: dealProject.projectName
      }],
      ipAddress: 'system',
      userAgent: 'system'
    });

    return dealProject;
  } catch (error) {
    console.error('创建成交项目错误:', error);
  }
}

// 辅助函数：发送微信推送通知
async function sendWechatNotification(project, operatorId, action) {
  try {
    // 这里应该实现微信推送逻辑
    // 为了演示，我们只记录日志
    console.log(`微信推送通知: 项目 ${project.projectName} 被${action}`);
    
    // 实际实现中，这里应该调用微信API发送推送
    // 包括给管理员和跟进人的通知
  } catch (error) {
    console.error('发送微信推送错误:', error);
  }
}

module.exports = router;
