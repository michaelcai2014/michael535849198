const mongoose = require('mongoose');

const dealProjectSchema = new mongoose.Schema({
  // 基本信息
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  dealDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // 从跟进项目同步的信息
  originalTrackingProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrackingProject'
  },
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
  
  // 项目进展
  progress: {
    type: String,
    maxlength: 10000
  },
  status: {
    type: String,
    enum: ['挂单', '进行中', '已关闭', '已完成'],
    default: '进行中'
  },
  
  // 进展记录
  progressRecords: [{
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
dealProjectSchema.index({ projectName: 1 });
dealProjectSchema.index({ status: 1 });
dealProjectSchema.index({ follower: 1 });
dealProjectSchema.index({ dealDate: -1 });

module.exports = mongoose.model('DealProject', dealProjectSchema);
