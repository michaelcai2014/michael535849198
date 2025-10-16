// 微信公众号服务模块
const WechatAPI = require('co-wechat-api');

// 微信API实例（使用配置中的AppID和AppSecret）
let api = null;
let currentConfig = null;

// 初始化微信API
function initWechatAPI(config) {
  if (!config.appId || !config.appSecret) {
    console.log('⚠️  微信API未初始化：缺少AppID或AppSecret');
    return false;
  }
  
  try {
    api = new WechatAPI(config.appId, config.appSecret);
    currentConfig = config;
    console.log('✅ 微信API初始化成功');
    console.log('   AppID:', config.appId);
    return true;
  } catch (error) {
    console.error('❌ 微信API初始化失败:', error.message);
    return false;
  }
}

// 发送模板消息
async function sendTemplateMessage(openid, templateData) {
  // 如果未初始化或未启用推送，返回模拟成功
  if (!api || !currentConfig || !currentConfig.enablePush) {
    console.log('💡 微信推送未启用，跳过发送');
    return {
      success: true,
      simulated: true,
      message: '推送功能未启用（模拟成功）'
    };
  }
  
  // 检查是否有模板ID
  if (!currentConfig.templateId) {
    console.log('⚠️  未配置模板ID，无法发送模板消息');
    return {
      success: false,
      message: '未配置模板ID'
    };
  }
  
  try {
    // 调用微信API发送模板消息
    const result = await api.sendTemplate(openid, currentConfig.templateId, '', templateData);
    
    console.log('✅ 模板消息发送成功');
    console.log('   MsgID:', result.msgid);
    
    return {
      success: true,
      msgid: result.msgid,
      message: '推送成功'
    };
    
  } catch (error) {
    console.error('❌ 模板消息发送失败:', error.message);
    
    // 返回友好的错误信息
    let errorMessage = '推送失败';
    if (error.message.includes('access_token')) {
      errorMessage = 'AccessToken无效，请检查AppID和AppSecret';
    } else if (error.message.includes('template')) {
      errorMessage = '模板ID无效或未配置';
    } else if (error.message.includes('openid')) {
      errorMessage = 'OpenID无效或用户未关注公众号';
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error.message
    };
  }
}

// 发送项目创建通知
async function sendProjectCreatedNotification(openid, projectData) {
  // 构建模板数据
  const templateData = {
    first: {
      value: '📋 新项目通知',
      color: '#173177'
    },
    keyword1: {
      value: projectData.projectName || '未知项目',
      color: '#173177'
    },
    keyword2: {
      value: projectData.operator || '未知',
      color: '#173177'
    },
    keyword3: {
      value: projectData.time || new Date().toLocaleString('zh-CN'),
      color: '#173177'
    },
    keyword4: {
      value: projectData.details || '暂无详情',
      color: '#666666'
    },
    remark: {
      value: '点击查看项目详情',
      color: '#ff6600'
    }
  };
  
  return await sendTemplateMessage(openid, templateData);
}

// 发送跟进记录更新通知
async function sendFollowUpNotification(openid, followUpData) {
  // 构建模板数据
  const templateData = {
    first: {
      value: '📝 跟进记录更新',
      color: '#173177'
    },
    keyword1: {
      value: followUpData.projectName || '未知项目',
      color: '#173177'
    },
    keyword2: {
      value: followUpData.operator || '未知',
      color: '#173177'
    },
    keyword3: {
      value: followUpData.time || new Date().toLocaleString('zh-CN'),
      color: '#173177'
    },
    keyword4: {
      value: followUpData.content || '暂无内容',
      color: '#666666'
    },
    remark: {
      value: '点击查看更新详情',
      color: '#ff6600'
    }
  };
  
  return await sendTemplateMessage(openid, templateData);
}

// 获取当前配置
function getCurrentConfig() {
  return currentConfig;
}

// 测试连接
async function testConnection() {
  if (!api) {
    return {
      success: false,
      message: '微信API未初始化'
    };
  }
  
  try {
    // 尝试获取AccessToken来测试连接
    const token = await api.ensureAccessToken();
    
    return {
      success: true,
      message: '连接测试成功',
      accessToken: token.accessToken ? '已获取' : '未获取'
    };
    
  } catch (error) {
    return {
      success: false,
      message: '连接测试失败',
      error: error.message
    };
  }
}

module.exports = {
  initWechatAPI,
  sendTemplateMessage,
  sendProjectCreatedNotification,
  sendFollowUpNotification,
  getCurrentConfig,
  testConnection
};

