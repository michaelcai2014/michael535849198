const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  },
  wechatOpenId: {
    type: String,
    unique: true,
    sparse: true
  },
  wechatNickname: {
    type: String
  },
  wechatAvatar: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 创建默认管理员
userSchema.statics.createDefaultAdmin = async function() {
  const adminExists = await this.findOne({ username: 'Michael' });
  if (!adminExists) {
    const admin = new this({
      username: 'Michael',
      password: '123456',
      role: 'admin'
    });
    await admin.save();
    console.log('默认管理员账号已创建');
  }
};

module.exports = mongoose.model('User', userSchema);
