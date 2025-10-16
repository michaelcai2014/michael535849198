# 微信公众号配置指南

## 📱 功能概述

系统已完成微信公众号集成的基础架构，管理员可以配置公众号信息，员工可以扫码绑定微信账号，系统会根据UUID判断用户身份并推送消息。

## ✨ 已实现功能

### 1. 客户类型优化
- ✅ 将"嫖客"改为"成交过的客户"，更加专业

### 2. 公众号配置模块
- ✅ 管理员专属的配置页面
- ✅ 可配置项：
  - AppID（必填）
  - AppSecret（必填）
  - 消息模板ID
  - Token（服务器验证）
  - EncodingAESKey（消息加密）
  - 启用/禁用推送开关
- ✅ 测试连接功能
- ✅ 配置持久化存储

### 3. 用户微信绑定
- ✅ 用户列表显示微信绑定状态
- ✅ 显示OpenID（部分）
- ✅ 每个用户都有微信绑定按钮
- ✅ 扫码绑定流程：
  1. 点击微信绑定按钮
  2. 显示带用户ID的绑定二维码
  3. 用户扫码关注公众号
  4. 系统自动绑定OpenID和用户ID

### 4. 推送逻辑
- ✅ 已有推送触发点：
  - 员工新建项目 → 推送给管理员
  - 员工更新跟进记录 → 推送给管理员
  - 项目状态变更 → 推送给相关人员
- ✅ 根据OpenID判断用户身份
- ✅ 完整的项目信息推送

## 📖 使用指南

### 管理员配置步骤

1. **登录管理员账号**
   - 用户名：Michael
   - 密码：123456

2. **进入公众号配置**
   - 点击导航栏"公众号配置"菜单
   - 填写公众号信息

3. **配置公众号参数**
   ```
   AppID: wx1234567890abcdef
   AppSecret: abc123def456ghi789jkl
   消息模板ID: your_template_id
   Token: your_custom_token
   ```

4. **测试连接**
   - 点击"测试连接"按钮
   - 验证配置是否正确

5. **保存配置**
   - 点击"保存配置"按钮
   - 系统会自动应用新配置

### 员工微信绑定步骤

1. **进入用户管理**
   - 管理员登录后进入"用户管理"

2. **点击微信绑定按钮**
   - 找到要绑定的用户
   - 点击绿色的微信图标按钮

3. **扫码绑定**
   - 弹出二维码模态框
   - 使用微信扫描二维码
   - 关注公众号
   - 系统自动完成绑定

4. **验证绑定状态**
   - 刷新用户列表
   - 查看"微信绑定"列显示"已绑定"
   - 查看OpenID已填充

## 🔧 技术实现说明

### 前端架构

#### 1. 公众号配置页面
- **位置**: `public/index.html` - `#wechatConfigSection`
- **功能脚本**: `public/js/wechat-config.js`
- **主要函数**:
  - `loadWechatConfig()` - 加载配置
  - `testWechatConnection()` - 测试连接
  - `generateBindQRCode()` - 生成二维码
  - `showUserBindQR()` - 显示用户绑定二维码

#### 2. 用户管理增强
- **位置**: `public/js/app.js` - `loadUsers()`
- **新增显示**:
  - 微信绑定状态徽章
  - OpenID显示（前12位）
  - 微信绑定按钮

### 后端API

#### 1. 配置管理API
```javascript
GET /api/wechat/config
- 功能：获取公众号配置
- 权限：仅管理员
- 返回：配置信息对象

POST /api/wechat/config
- 功能：保存公众号配置
- 权限：仅管理员
- 参数：appId, appSecret, templateId, token, encodingAESKey, enablePush

GET /api/wechat/test
- 功能：测试公众号连接
- 权限：仅管理员
- 返回：连接测试结果
```

#### 2. 用户绑定API
```javascript
GET /api/wechat/bind?userId={userId}
- 功能：显示微信绑定页面
- 权限：公开访问
- 返回：HTML页面（含二维码）
```

### 推送逻辑实现

#### 现有推送触发点
```javascript
// 1. 创建项目时 (start-simple.js)
app.post('/api/tracking', ...) {
  // 创建项目后推送给管理员
  // 根据管理员的OpenID发送模板消息
}

// 2. 添加跟进记录时
app.post('/api/tracking/:id/follow-up', ...) {
  // 更新跟进后推送给管理员
  // 根据管理员的OpenID发送模板消息
}

// 3. 项目状态变更时
app.put('/api/tracking/:id', ...) {
  // 状态变更后推送给相关人员
}
```

#### UUID（OpenID）判断逻辑
```javascript
// 根据OpenID查找用户
const user = mockUsers.find(u => u.wechatOpenid === openid);
if (user) {
  // 判断用户身份
  if (user.role === 'admin') {
    // 管理员处理逻辑
  } else {
    // 员工处理逻辑
  }
}
```

## 🚀 下一步接入真实微信公众号

### 1. 准备工作
- [ ] 在微信公众平台注册账号
- [ ] 完成企业认证（服务号）
- [ ] 获取AppID和AppSecret
- [ ] 配置服务器白名单
- [ ] 创建消息模板

### 2. 服务器配置
```
URL: https://你的域名/api/wechat/callback
Token: （在系统中配置）
EncodingAESKey: （在系统中配置）
消息加密方式: 明文模式/兼容模式/安全模式
```

### 3. 接入步骤

#### A. 安装微信SDK
```bash
npm install wechat-api --save
npm install wechat-oauth --save
```

#### B. 实现真实的绑定流程
```javascript
// 1. 生成带参数的临时二维码
const WechatAPI = require('wechat-api');
const api = new WechatAPI(appId, appSecret);

api.createTmpQRCode(userId, 1800, (err, result) => {
  // result.ticket 用于生成二维码
  // result.url 二维码图片地址
});

// 2. 接收用户扫码事件
app.post('/api/wechat/callback', (req, res) => {
  // 解析微信推送的XML消息
  // 获取事件类型和OpenID
  // 绑定OpenID到用户ID
});
```

#### C. 实现模板消息推送
```javascript
// 发送模板消息
api.sendTemplate(openid, templateId, url, data, (err, result) => {
  // data 格式：
  // {
  //   first: { value: '项目通知', color: '#173177' },
  //   keyword1: { value: '项目名称' },
  //   keyword2: { value: '详情内容' },
  //   remark: { value: '点击查看详情' }
  // }
});
```

### 4. 数据持久化
当前使用内存存储，建议切换到数据库：
```javascript
// 存储配置到数据库
const config = await WechatConfig.create({
  appId,
  appSecret,
  templateId,
  ...
});

// 存储用户OpenID
await User.update({ wechatOpenid }, { where: { id: userId }});
```

## 📝 消息模板示例

### 项目创建通知
```
{{first.DATA}}
项目名称：{{keyword1.DATA}}
创建人员：{{keyword2.DATA}}
创建时间：{{keyword3.DATA}}
项目详情：{{keyword4.DATA}}
{{remark.DATA}}
```

### 跟进记录更新通知
```
{{first.DATA}}
项目名称：{{keyword1.DATA}}
更新人员：{{keyword2.DATA}}
更新时间：{{keyword3.DATA}}
更新内容：{{keyword4.DATA}}
{{remark.DATA}}
```

## ⚠️ 注意事项

1. **安全性**
   - AppSecret务必妥善保管
   - 不要在前端暴露AppSecret
   - 使用HTTPS传输敏感信息
   - 定期更换Token

2. **推送限制**
   - 模板消息有发送次数限制
   - 用户需要先关注公众号才能接收消息
   - 消息推送失败要有重试机制

3. **用户体验**
   - 绑定流程要简单明了
   - 提供解绑功能
   - 推送内容要精简有用
   - 避免频繁推送打扰用户

## 📊 测试清单

- [x] 管理员可以访问公众号配置页面
- [x] 可以保存和读取配置信息
- [x] 配置页面表单验证正常
- [x] 用户列表显示微信绑定状态
- [x] 微信绑定按钮正常工作
- [x] 绑定二维码可以正常生成
- [x] 绑定页面UI美观友好
- [x] 推送逻辑在控制台正常输出
- [ ] 真实微信扫码绑定流程（需接入真实公众号）
- [ ] 真实模板消息推送（需接入真实公众号）

## 🎯 当前状态

**开发环境**: ✅ 基础架构完成
**模拟功能**: ✅ 全部正常工作
**真实接入**: ⏳ 等待微信公众号信息

系统已经准备好接入真实的微信公众号！只需要：
1. 提供真实的AppID和AppSecret
2. 配置服务器地址和Token
3. 创建消息模板
4. 更新代码使用真实的微信SDK

服务器地址：http://localhost:3000
管理员账号：Michael / 123456

