# 📋 功能实现指南

## 当前状态

**已完成** ✅:
1. 修复跟进记录创建人显示错误
2. 修复成交项目字段丢失问题
3. 登录页面居中显示

**待实现** 🚧:
1. 添加成交项目必填字段（时间节点、付款比例）
2. 实现时间节点动态添加功能
3. 添加收款状态标注功能
4. 实现微信公众号推送功能
5. 优化推送消息格式

---

## 🎯 待实现功能详细说明

### 1. 成交项目必填字段和时间节点

#### 数据结构设计

```javascript
// 成交项目完整数据结构
const dealProject = {
  // 基础信息
  id: 1,
  projectName: "电动车营销APP",
  dealDate: "2025-10-16",
  
  // 客户信息
  customerIdentity: "老板",
  customerCategory: "潜客",
  customerBackground: "初创企业",
  customerWechat: "wxid_123",
  
  // 项目信息
  channel: "Michael",
  follower: { username: "Jayce", wechatNickname: "Jayce" },
  priority: "高",
  
  // 进度信息
  status: "进行中", // 挂单、进行中、已关闭、已完成
  progress: "项目启动阶段",
  originalDetails: "原始详情",
  
  // 时间节点和付款信息（核心新功能）
  milestones: [
    {
      id: 1,
      name: "需求阶段",
      date: "2025-10-20",
      paymentRatio: 30, // 付款比例（%）
      amount: 10000, // 付款金额（元）
      isPaid: false, // 是否已收款
      paidDate: null, // 收款日期
      description: "完成需求文档和原型设计",
      order: 1
    },
    {
      id: 2,
      name: "开发阶段",
      date: "2025-11-15",
      paymentRatio: 40,
      amount: 13333,
      isPaid: false,
      paidDate: null,
      description: "完成前后端开发和测试",
      order: 2
    },
    {
      id: 3,
      name: "交付阶段",
      date: "2025-12-01",
      paymentRatio: 30,
      amount: 10000,
      isPaid: false,
      paidDate: null,
      description: "项目上线和验收",
      order: 3
    }
  ],
  
  totalAmount: 33333, // 项目总金额
  paidAmount: 0, // 已收款金额
  unpaidAmount: 33333, // 未收款金额
  
  lastUpdated: "2025-10-16",
  createdAt: "2025-10-16"
};
```

#### 前端UI设计

**成交项目详情页面**:
```html
<div class="modal fade" id="dealProjectDetailModal">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <h5>成交项目详情 - {{projectName}}</h5>
      </div>
      <div class="modal-body">
        <!-- 基础信息 -->
        <div class="row mb-3">
          <div class="col-md-6">
            <strong>项目名称：</strong>{{projectName}}
          </div>
          <div class="col-md-6">
            <strong>签单时间：</strong>{{dealDate}}
          </div>
        </div>
        
        <!-- 客户信息 -->
        <div class="card mb-3">
          <div class="card-header">客户信息</div>
          <div class="card-body">
            <p><strong>客户身份：</strong>{{customerIdentity}}</p>
            <p><strong>客户类别：</strong>{{customerCategory}}</p>
            <p><strong>客户背景：</strong>{{customerBackground}}</p>
            <p><strong>客户微信：</strong>{{customerWechat}}</p>
          </div>
        </div>
        
        <!-- 项目信息 -->
        <div class="card mb-3">
          <div class="card-header">项目信息</div>
          <div class="card-body">
            <p><strong>渠道：</strong>{{channel}}</p>
            <p><strong>跟进人：</strong>{{follower}}</p>
            <p><strong>优先级：</strong>{{priority}}</p>
            <p><strong>状态：</strong>{{status}}</p>
          </div>
        </div>
        
        <!-- 时间节点和付款信息 -->
        <div class="card mb-3">
          <div class="card-header d-flex justify-content-between">
            <span>时间节点和付款信息</span>
            <button class="btn btn-sm btn-primary" onclick="addMilestone()">
              <i class="fas fa-plus"></i> 添加节点
            </button>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>阶段名称</th>
                    <th>目标日期</th>
                    <th>付款比例</th>
                    <th>付款金额</th>
                    <th>收款状态</th>
                    <th>收款日期</th>
                    <th>说明</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody id="milestonesTable">
                  <!-- 动态生成行 -->
                </tbody>
              </table>
            </div>
            
            <!-- 汇总信息 -->
            <div class="row mt-3">
              <div class="col-md-4">
                <div class="alert alert-info">
                  <strong>项目总金额：</strong>¥{{totalAmount}}
                </div>
              </div>
              <div class="col-md-4">
                <div class="alert alert-success">
                  <strong>已收款金额：</strong>¥{{paidAmount}}
                </div>
              </div>
              <div class="col-md-4">
                <div class="alert alert-warning">
                  <strong>未收款金额：</strong>¥{{unpaidAmount}}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
        <button class="btn btn-primary" onclick="saveDealProject()">保存</button>
      </div>
    </div>
  </div>
</div>
```

**时间节点行模板**:
```html
<tr data-milestone-id="{{id}}">
  <td>
    <input type="text" class="form-control" value="{{name}}" />
  </td>
  <td>
    <input type="date" class="form-control" value="{{date}}" />
  </td>
  <td>
    <div class="input-group">
      <input type="number" class="form-control" value="{{paymentRatio}}" min="0" max="100" />
      <span class="input-group-text">%</span>
    </div>
  </td>
  <td>
    <div class="input-group">
      <span class="input-group-text">¥</span>
      <input type="number" class="form-control" value="{{amount}}" />
    </div>
  </td>
  <td>
    <select class="form-select">
      <option value="false" {{!isPaid ? 'selected' : ''}}>未收款</option>
      <option value="true" {{isPaid ? 'selected' : ''}}>已收款</option>
    </select>
  </td>
  <td>
    <input type="date" class="form-control" value="{{paidDate}}" {{!isPaid ? 'disabled' : ''}} />
  </td>
  <td>
    <textarea class="form-control" rows="2">{{description}}</textarea>
  </td>
  <td>
    <button class="btn btn-sm btn-danger" onclick="removeMilestone({{id}})">
      <i class="fas fa-trash"></i>
    </button>
  </td>
</tr>
```

#### 后端API设计

```javascript
// 更新成交项目（包含时间节点）
app.put('/api/projects/:id', authenticateToken, (req, res) => {
  const projectId = parseInt(req.params.id);
  const projectIndex = mockDealProjects.findIndex(p => p.id === projectId);
  
  if (projectIndex !== -1) {
    const { status, progress, milestones, totalAmount } = req.body;
    
    // 计算已收款和未收款金额
    let paidAmount = 0;
    if (milestones && Array.isArray(milestones)) {
      paidAmount = milestones
        .filter(m => m.isPaid)
        .reduce((sum, m) => sum + (m.amount || 0), 0);
    }
    
    mockDealProjects[projectIndex] = {
      ...mockDealProjects[projectIndex],
      status,
      progress,
      milestones,
      totalAmount,
      paidAmount,
      unpaidAmount: totalAmount - paidAmount,
      lastUpdated: new Date()
    };
    
    res.json({
      success: true,
      message: '项目更新成功',
      data: mockDealProjects[projectIndex]
    });
  } else {
    res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }
});
```

---

### 2. 微信公众号推送功能

#### 配置文件

**config/wechat.js**:
```javascript
module.exports = {
  // 公众号配置
  appId: process.env.WECHAT_APP_ID || 'your_app_id',
  appSecret: process.env.WECHAT_APP_SECRET || 'your_app_secret',
  token: process.env.WECHAT_TOKEN || 'your_token',
  encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY || 'your_aes_key',
  
  // 模板消息ID
  templates: {
    projectCreated: process.env.TEMPLATE_PROJECT_CREATED || 'TEMPLATE_ID_1',
    followupAdded: process.env.TEMPLATE_FOLLOWUP_ADDED || 'TEMPLATE_ID_2',
    projectUpdated: process.env.TEMPLATE_PROJECT_UPDATED || 'TEMPLATE_ID_3'
  },
  
  // 管理员OpenID
  adminOpenId: process.env.ADMIN_OPENID || 'admin_openid'
};
```

#### 推送服务

**services/wechatService.js**:
```javascript
const axios = require('axios');
const wechatConfig = require('../config/wechat');

class WechatService {
  constructor() {
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }
  
  // 获取access_token
  async getAccessToken() {
    const now = Date.now();
    
    // 如果token还未过期，直接返回
    if (this.accessToken && now < this.tokenExpireTime) {
      return this.accessToken;
    }
    
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/token`;
      const response = await axios.get(url, {
        params: {
          grant_type: 'client_credential',
          appid: wechatConfig.appId,
          secret: wechatConfig.appSecret
        }
      });
      
      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        // token有效期7200秒，提前5分钟刷新
        this.tokenExpireTime = now + (response.data.expires_in - 300) * 1000;
        return this.accessToken;
      }
      
      throw new Error('获取access_token失败');
    } catch (error) {
      console.error('获取access_token错误:', error);
      throw error;
    }
  }
  
  // 发送模板消息
  async sendTemplateMessage(openid, templateId, data, url = '') {
    try {
      const accessToken = await this.getAccessToken();
      const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
      
      const response = await axios.post(apiUrl, {
        touser: openid,
        template_id: templateId,
        url: url,
        data: data
      });
      
      return response.data;
    } catch (error) {
      console.error('发送模板消息错误:', error);
      throw error;
    }
  }
  
  // 通知项目创建
  async notifyProjectCreated(project, operator) {
    const templateData = {
      first: {
        value: '您有新的项目通知',
        color: '#173177'
      },
      keyword1: {
        value: project.projectName,
        color: '#173177'
      },
      keyword2: {
        value: project.details || '暂无详情',
        color: '#173177'
      },
      keyword3: {
        value: operator.username,
        color: '#173177'
      },
      keyword4: {
        value: new Date().toLocaleString('zh-CN'),
        color: '#173177'
      },
      remark: {
        value: `\n客户身份：${project.customerIdentity}\n客户类别：${project.customerCategory}\n渠道：${project.channel}`,
        color: '#666666'
      }
    };
    
    return await this.sendTemplateMessage(
      wechatConfig.adminOpenId,
      wechatConfig.templates.projectCreated,
      templateData
    );
  }
  
  // 通知跟进记录添加
  async notifyFollowupAdded(project, followup, operator) {
    const templateData = {
      first: {
        value: '项目跟进记录更新',
        color: '#173177'
      },
      keyword1: {
        value: project.projectName,
        color: '#173177'
      },
      keyword2: {
        value: followup.content,
        color: '#173177'
      },
      keyword3: {
        value: operator.username,
        color: '#173177'
      },
      keyword4: {
        value: new Date().toLocaleString('zh-CN'),
        color: '#173177'
      },
      remark: {
        value: `\n${followup.content}`,
        color: '#666666'
      }
    };
    
    return await this.sendTemplateMessage(
      wechatConfig.adminOpenId,
      wechatConfig.templates.followupAdded,
      templateData
    );
  }
}

module.exports = new WechatService();
```

#### 集成到路由

**routes/wechat.js**:
```javascript
const express = require('express');
const router = express.Router();
const wechatService = require('../services/wechatService');

// 微信服务器验证
router.get('/wechat', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  // 验证逻辑
  res.send(echostr);
});

// 接收微信消息
router.post('/wechat', (req, res) => {
  // 处理用户消息
  res.send('success');
});

// 推送通知API
router.post('/wechat/notify', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    let result;
    switch (type) {
      case 'project_created':
        result = await wechatService.notifyProjectCreated(data.project, data.operator);
        break;
      case 'followup_added':
        result = await wechatService.notifyFollowupAdded(data.project, data.followup, data.operator);
        break;
      default:
        throw new Error('未知的通知类型');
    }
    
    res.json({
      success: true,
      message: '推送成功',
      data: result
    });
  } catch (error) {
    console.error('推送失败:', error);
    res.status(500).json({
      success: false,
      message: '推送失败',
      error: error.message
    });
  }
});

module.exports = router;
```

---

## 🚀 实施步骤

### 第一阶段：时间节点功能
1. 修改数据结构（后端）
2. 创建编辑界面（前端）
3. 实现动态添加/删除节点
4. 实现收款状态切换
5. 实现金额自动计算
6. 测试完整流程

### 第二阶段：微信公众号推送
1. 申请微信公众号测试账号
2. 配置服务器地址和Token
3. 创建模板消息
4. 实现推送服务
5. 集成到现有API
6. 测试推送功能

### 第三阶段：优化完善
1. 优化推送消息格式
2. 添加更多字段展示
3. 性能优化
4. 错误处理完善

---

**预计工作量**：
- 时间节点功能：4-6小时
- 微信公众号推送：6-8小时
- 测试和优化：2-3小时

**总计**：12-17小时
