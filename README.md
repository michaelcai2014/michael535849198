# Tunda项目管理系统

一个基于Node.js和MongoDB的实时项目管理系统，支持微信授权登录和实时推送通知。

## 功能特性

### 核心功能
- **用户管理**: 支持传统登录和微信授权登录
- **项目管理**: 跟进中项目和已成交项目的完整生命周期管理
- **实时通知**: 微信推送通知，支持管理员和跟进人实时接收更新
- **操作日志**: 完整的审计日志系统，记录所有操作变更
- **权限控制**: 管理员和员工角色权限分离

### 跟进中项目管理
- 项目基本信息（名称、客户信息、渠道等）
- 客户分类管理（身份、类别、背景）
- 跟进记录和状态跟踪
- 优先级和状态管理
- 管理员备注功能

### 已成交项目管理
- 自动从跟进项目转换
- 项目进展跟踪
- 状态管理（挂单、进行中、已关闭、已完成）
- 详细进展记录

### 微信集成
- 微信授权登录
- 模板消息推送
- 实时通知管理

## 技术栈

- **后端**: Node.js, Express.js, MongoDB, Mongoose
- **前端**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **认证**: JWT, 微信OAuth
- **实时通信**: Socket.IO
- **部署**: PM2, Nginx

## 安装和运行

### 环境要求
- Node.js 14.0+
- MongoDB 4.0+
- 微信开发者账号（用于微信登录和推送）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd tunda-project-management
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp config.env.example config.env
# 编辑 config.env 文件，填入你的配置
```

4. **启动MongoDB**
```bash
# 确保MongoDB服务正在运行
mongod
```

5. **启动应用**
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 环境变量配置

```env
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/tunda_project_management

# JWT密钥
JWT_SECRET=your_jwt_secret_key_here

# 微信配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 服务器配置
PORT=3000
NODE_ENV=development

# 管理员默认账号
ADMIN_USERNAME=Michael
ADMIN_PASSWORD=123456
```

## API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/wechat-login` - 微信登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/logout` - 用户登出

### 用户管理接口
- `GET /api/users` - 获取用户列表（管理员）
- `POST /api/users` - 创建用户（管理员）
- `PUT /api/users/:id` - 更新用户信息（管理员）
- `DELETE /api/users/:id` - 删除用户（管理员）

### 跟进项目管理接口
- `GET /api/tracking` - 获取跟进项目列表
- `POST /api/tracking` - 创建跟进项目
- `PUT /api/tracking/:id` - 更新跟进项目
- `DELETE /api/tracking/:id` - 删除跟进项目
- `POST /api/tracking/:id/follow-up` - 添加跟进记录

### 成交项目管理接口
- `GET /api/projects` - 获取成交项目列表
- `POST /api/projects` - 创建成交项目
- `PUT /api/projects/:id` - 更新成交项目
- `DELETE /api/projects/:id` - 删除成交项目
- `POST /api/projects/:id/progress` - 添加项目进展

### 日志接口
- `GET /api/logs` - 获取操作日志（管理员）
- `GET /api/logs/entity/:entityType/:entityId` - 获取实体操作历史
- `GET /api/logs/stats/user/:userId` - 获取用户操作统计
- `GET /api/logs/export` - 导出日志（管理员）

### 微信接口
- `POST /api/wechat/notify/project-update` - 发送项目更新通知
- `POST /api/wechat/notify/admin-note` - 发送管理员备注通知
- `GET /api/wechat/user-info/:code` - 获取微信用户信息

## 部署指南

### 使用PM2部署

1. **安装PM2**
```bash
npm install -g pm2
```

2. **创建PM2配置文件**
```bash
# 创建 ecosystem.config.js
```

3. **启动应用**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 使用Docker部署

1. **创建Dockerfile**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

2. **构建和运行**
```bash
docker build -t tunda-project-management .
docker run -p 3000:3000 tunda-project-management
```

## 使用说明

### 管理员账号
- 用户名: Michael
- 密码: 123456

### 主要功能使用

1. **登录系统**
   - 使用管理员账号登录
   - 或使用微信授权登录

2. **创建员工账号**
   - 管理员登录后，进入"用户管理"
   - 点击"新增用户"创建员工账号

3. **管理跟进项目**
   - 进入"跟进中项目"
   - 添加新项目或更新现有项目
   - 系统会自动发送微信通知

4. **管理成交项目**
   - 跟进项目状态设为"Deal"时自动创建成交项目
   - 进入"已成交项目"查看和管理

5. **查看操作日志**
   - 管理员可查看所有操作记录
   - 支持按时间、用户、操作类型筛选

## 开发指南

### 项目结构
```
tunda-project-management/
├── models/              # 数据模型
├── routes/             # 路由处理
├── public/             # 静态文件
│   ├── css/           # 样式文件
│   ├── js/            # JavaScript文件
│   └── index.html      # 主页面
├── server.js          # 服务器入口
├── package.json        # 项目配置
└── README.md          # 项目说明
```

### 开发规范
- 使用ES6+语法
- 遵循RESTful API设计
- 统一的错误处理
- 完整的日志记录

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 联系方式

如有问题，请联系开发团队。
