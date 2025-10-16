const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('./auth');
const User = require('../models/User');
const TrackingProject = require('../models/TrackingProject');
const router = express.Router();

// 微信配置
const WECHAT_CONFIG = {
  appId: process.env.WECHAT_APPID,
  secret: process.env.WECHAT_SECRET,
  templateId: 'your_template_id', // 需要申请模板消息ID
  accessTokenUrl: 'https://api.weixin.qq.com/cgi-bin/token',
  sendMessageUrl: 'https://api.weixin.qq.com/cgi-bin/message/template/send'
};

let accessToken = null;
let tokenExpireTime = 0;

// 获取微信访问令牌
async function getAccessToken() {
  try {
    if (accessToken && Date.now() < tokenExpireTime) {
      return accessToken;
    }

    const response = await axios.get(WECHAT_CONFIG.accessTokenUrl, {
      params: {
        grant_type: 'client_credential',
        appid: WECHAT_CONFIG.appId,
        secret: WECHAT_CONFIG.secret
      }
    });

    if (response.data.access_token) {
      accessToken = response.data.access_token;
      tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000; // 提前5分钟过期
      return accessToken;
    } else {
      throw new Error('获取访问令牌失败: ' + response.data.errmsg);
    }
  } catch (error) {
    console.error('获取微信访问令牌错误:', error);
    throw error;
  }
}

// 发送模板消息
async function sendTemplateMessage(openId, templateData) {
  try {
    const token = await getAccessToken();
    
    const messageData = {
      touser: openId,
      template_id: WECHAT_CONFIG.templateId,
      data: templateData
    };

    const response = await axios.post(
      `${WECHAT_CONFIG.sendMessageUrl}?access_token=${token}`,
      messageData
    );

    if (response.data.errcode === 0) {
      console.log('微信消息发送成功:', response.data);
      return true;
    } else {
      console.error('微信消息发送失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('发送微信消息错误:', error);
    return false;
  }
}

// 发送项目更新通知
router.post('/notify/project-update', authenticateToken, async (req, res) => {
  try {
    const { projectId, updateType, content } = req.body;

    // 获取项目信息
    const project = await TrackingProject.findById(projectId)
      .populate('follower', 'wechatOpenId wechatNickname');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 获取管理员列表
    const admins = await User.find({ 
      role: 'admin', 
      wechatOpenId: { $exists: true, $ne: null },
      isActive: true 
    });

    // 发送给管理员
    for (const admin of admins) {
      if (admin.wechatOpenId) {
        const templateData = {
          first: {
            value: `项目更新通知`,
            color: '#173177'
          },
          keyword1: {
            value: project.projectName,
            color: '#173177'
          },
          keyword2: {
            value: project.follower.wechatNickname || project.follower.username,
            color: '#173177'
          },
          keyword3: {
            value: updateType === 'update' ? '项目信息更新' : '新增跟进记录',
            color: '#173177'
          },
          keyword4: {
            value: new Date().toLocaleString('zh-CN'),
            color: '#173177'
          },
          remark: {
            value: content || '请及时查看项目详情',
            color: '#173177'
          }
        };

        await sendTemplateMessage(admin.wechatOpenId, templateData);
      }
    }

    // 发送给跟进人（如果不是跟进人自己更新的）
    if (project.follower.wechatOpenId && project.follower._id.toString() !== req.user.userId) {
      const templateData = {
        first: {
          value: `您的项目有更新`,
          color: '#173177'
        },
        keyword1: {
          value: project.projectName,
          color: '#173177'
        },
        keyword2: {
          value: updateType === 'update' ? '项目信息更新' : '新增跟进记录',
          color: '#173177'
        },
        keyword3: {
          value: new Date().toLocaleString('zh-CN'),
          color: '#173177'
        },
        remark: {
          value: content || '请及时查看项目详情',
          color: '#173177'
        }
      };

      await sendTemplateMessage(project.follower.wechatOpenId, templateData);
    }

    res.json({
      success: true,
      message: '通知发送成功'
    });

  } catch (error) {
    console.error('发送项目更新通知错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 发送管理员备注通知
router.post('/notify/admin-note', authenticateToken, async (req, res) => {
  try {
    const { projectId, note } = req.body;

    // 获取项目信息
    const project = await TrackingProject.findById(projectId)
      .populate('follower', 'wechatOpenId wechatNickname');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 发送给跟进人
    if (project.follower.wechatOpenId) {
      const templateData = {
        first: {
          value: `管理员添加了备注`,
          color: '#173177'
        },
        keyword1: {
          value: project.projectName,
          color: '#173177'
        },
        keyword2: {
          value: '管理员备注',
          color: '#173177'
        },
        keyword3: {
          value: new Date().toLocaleString('zh-CN'),
          color: '#173177'
        },
        remark: {
          value: note || '请查看项目详情',
          color: '#173177'
        }
      };

      await sendTemplateMessage(project.follower.wechatOpenId, templateData);
    }

    res.json({
      success: true,
      message: '备注通知发送成功'
    });

  } catch (error) {
    console.error('发送管理员备注通知错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取微信用户信息
router.get('/user-info/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // 通过code获取access_token和openid
    const tokenResponse = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
      params: {
        appid: WECHAT_CONFIG.appId,
        secret: WECHAT_CONFIG.secret,
        code: code,
        grant_type: 'authorization_code'
      }
    });

    if (tokenResponse.data.errcode) {
      return res.status(400).json({
        success: false,
        message: '获取微信用户信息失败: ' + tokenResponse.data.errmsg
      });
    }

    const { access_token, openid } = tokenResponse.data;

    // 获取用户详细信息
    const userInfoResponse = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
      params: {
        access_token: access_token,
        openid: openid,
        lang: 'zh_CN'
      }
    });

    if (userInfoResponse.data.errcode) {
      return res.status(400).json({
        success: false,
        message: '获取微信用户详细信息失败: ' + userInfoResponse.data.errmsg
      });
    }

    res.json({
      success: true,
      data: {
        openid: userInfoResponse.data.openid,
        nickname: userInfoResponse.data.nickname,
        headimgurl: userInfoResponse.data.headimgurl,
        sex: userInfoResponse.data.sex,
        city: userInfoResponse.data.city,
        province: userInfoResponse.data.province,
        country: userInfoResponse.data.country
      }
    });

  } catch (error) {
    console.error('获取微信用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 测试微信推送
router.post('/test-notification', authenticateToken, async (req, res) => {
  try {
    const { openId, message } = req.body;

    if (!openId) {
      return res.status(400).json({
        success: false,
        message: 'openId不能为空'
      });
    }

    const templateData = {
      first: {
        value: '测试消息',
        color: '#173177'
      },
      keyword1: {
        value: message || '这是一条测试消息',
        color: '#173177'
      },
      keyword2: {
        value: new Date().toLocaleString('zh-CN'),
        color: '#173177'
      },
      remark: {
        value: '如果您收到此消息，说明微信推送功能正常',
        color: '#173177'
      }
    };

    const success = await sendTemplateMessage(openId, templateData);

    res.json({
      success,
      message: success ? '测试消息发送成功' : '测试消息发送失败'
    });

  } catch (error) {
    console.error('测试微信推送错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取微信配置信息
router.get('/config', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        appId: WECHAT_CONFIG.appId,
        redirectUri: `${req.protocol}://${req.get('host')}/api/wechat/callback`,
        scope: 'snsapi_userinfo',
        state: 'STATE'
      }
    });
  } catch (error) {
    console.error('获取微信配置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
