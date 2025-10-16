const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // 操作信息
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['User', 'TrackingProject', 'DealProject', 'System']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // 操作者
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 变更详情
  changes: [{
    field: {
      type: String,
      required: true
    },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  
  // 操作描述
  description: {
    type: String,
    required: true
  },
  
  // 客户端信息
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  
  // 时间戳
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
auditLogSchema.index({ operator: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// 静态方法：记录日志
auditLogSchema.statics.log = async function(data) {
  const log = new this(data);
  return await log.save();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
