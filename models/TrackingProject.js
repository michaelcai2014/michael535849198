const mongoose = require('mongoose');

const trackingProjectSchema = new mongoose.Schema({
  // 基本信息
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // 客户信息
  customerIdentity: {
    type: String,
    enum: ['国内个人', '国外个人', '老板', '项目负责人', '项目执行', '中介'],
    required: true
  },
  customerCategory: {
    type: String,
    enum: ['嫖客', '潜客'],
    required: true
  },
  customerBackground: {
    type: String,
    enum: ['初创企业', '个人', '广告公司', '海外', '民企传统行业', '民企互联网'],
    required: true
  },
  customerWechatName: {
    type: String,
    trim: true
  },
  
  // 项目信息
  channel: {
    type: String,
    enum: ['蔡宗林', 'Michael', '视频号', '抖音'],
    required: true
  },
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['高', '低'],
    default: '低'
  },
  status: {
    type: String,
    enum: ['WIP', 'Close', 'Deal', 'Pending'],
    default: 'WIP'
  },
  
  // 详情和备注
  details: {
    type: String,
    maxlength: 10000
  },
  adminNotes: {
    type: String,
    maxlength: 10000
  },
  
  // 跟进记录
  followUpRecords: [{
    date: {
      type: Date,
      default: Date.now
    },
    content: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // 系统字段
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
trackingProjectSchema.index({ projectName: 1 });
trackingProjectSchema.index({ status: 1 });
trackingProjectSchema.index({ follower: 1 });
trackingProjectSchema.index({ date: -1 });

module.exports = mongoose.model('TrackingProject', trackingProjectSchema);
