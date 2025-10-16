// 微信公众号服务模块（Node.js v8 兼容版本）
const https = require('https');

// 当前配置和AccessToken
let currentConfig = null;
let accessToken = null;
let tokenExpireTime = 0;

// 初始化微信API
function initWechatAPI(config) {
  if (!config.appId || !config.appSecret) {
    console.log('⚠️  微信API未初始化：缺少AppID或AppSecret');
    return false;
  }
  
  currentConfig = config;
  console.log('✅ 微信API配置已更新');
  console.log('   AppID:', config.appId);
  
  // 清空旧的AccessToken
  accessToken = null;
  tokenExpireTime = 0;
  
  return true;
}

// HTTP请求封装
function httpsRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(new Error('解析响应失败: ' + data));
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// 获取Access Token
async function getAccessToken() {
  if (!currentConfig || !currentConfig.appId || !currentConfig.appSecret) {
    throw new Error('未配置AppID和AppSecret');
  }
  
  // 如果token还有效，直接返回
  if (accessToken && Date.now() < tokenExpireTime) {
    return accessToken;
  }
  
  // 请求新的AccessToken
  const options = {
    hostname: 'api.weixin.qq.com',
    port: 443,
    path: `/cgi-bin/token?grant_type=client_credential&appid=${currentConfig.appId}&secret=${currentConfig.appSecret}`,
    method: 'GET'
  };
  
  try {
    const result = await httpsRequest(options);
    
    if (result.access_token) {
      accessToken = result.access_token;
      // 提前5分钟过期
      tokenExpireTime = Date.now() + (result.expires_in - 300) * 1000;
      console.log('✅ AccessToken获取成功');
      return accessToken;
    } else {
      throw new Error(result.errmsg || '获取AccessToken失败');
    }
  } catch (error) {
    console.error('❌ 获取AccessToken失败:', error.message);
    throw error;
  }
}

// 发送模板消息
async function sendTemplateMessage(openid, templateData) {
  // 如果未初始化或未启用推送，返回模拟成功
  if (!currentConfig || !currentConfig.enablePush) {
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
    // 获取AccessToken
    const token = await getAccessToken();
    
    // 构建请求
    const postData = JSON.stringify({
      touser: openid,
      template_id: currentConfig.templateId,
      data: templateData
    });
    
    const options = {
      hostname: 'api.weixin.qq.com',
      port: 443,
      path: `/cgi-bin/message/template/send?access_token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const result = await httpsRequest(options, postData);
    
    if (result.errcode === 0) {
      console.log('✅ 模板消息发送成功');
      console.log('   MsgID:', result.msgid);
      
      return {
        success: true,
        msgid: result.msgid,
        message: '推送成功'
      };
    } else {
      console.error('❌ 模板消息发送失败:', result.errmsg);
      
      // 返回友好的错误信息
      let errorMessage = '推送失败';
      if (result.errcode === 40001) {
        errorMessage = 'AppSecret错误或AccessToken无效';
      } else if (result.errcode === 40003) {
        errorMessage = 'OpenID无效';
      } else if (result.errcode === 43004) {
        errorMessage = '用户未关注公众号';
      } else if (result.errcode === 47001) {
        errorMessage = '模板ID无效';
      } else {
        errorMessage = result.errmsg || '推送失败';
      }
      
      return {
        success: false,
        message: errorMessage,
        errcode: result.errcode
      };
    }
    
  } catch (error) {
    console.error('❌ 发送模板消息异常:', error.message);
    return {
      success: false,
      message: error.message
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
  if (!currentConfig) {
    return {
      success: false,
      message: '微信API未初始化'
    };
  }
  
  try {
    // 尝试获取AccessToken来测试连接
    const token = await getAccessToken();
    
    return {
      success: true,
      message: '连接测试成功，AccessToken获取正常',
      accessToken: token ? '已获取' : '未获取'
    };
    
  } catch (error) {
    return {
      success: false,
      message: '连接测试失败: ' + error.message
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
