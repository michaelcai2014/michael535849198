# 🚀 Tunda项目管理系统 - 部署指南

## 📦 推送代码到Git仓库

### 方式1：推送到GitHub

#### 步骤1：创建GitHub仓库
1. 访问 https://github.com
2. 点击右上角 "+" → "New repository"
3. 输入仓库名称：`tunda-project-management`
4. 选择 Private（私有）或 Public（公开）
5. **不要**勾选 "Initialize with README"
6. 点击 "Create repository"

#### 步骤2：推送代码
```bash
# 进入项目目录
cd "/Users/pan/Desktop/tunda project management"

# 添加远程仓库（替换为您的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/tunda-project-management.git

# 推送代码到main分支
git branch -M master
git push -u origin master
```

#### 步骤3：验证
访问您的GitHub仓库，确认代码已上传。

---

### 方式2：推送到GitLab

#### 步骤1：创建GitLab项目
1. 访问 https://gitlab.com
2. 点击 "New project" → "Create blank project"
3. 输入项目名称：`tunda-project-management`
4. 选择可见性（Private/Internal/Public）
5. 点击 "Create project"

#### 步骤2：推送代码
```bash
# 进入项目目录
cd "/Users/pan/Desktop/tunda project management"

# 添加远程仓库（替换为您的GitLab用户名）
git remote add origin https://gitlab.com/YOUR_USERNAME/tunda-project-management.git

# 推送代码
git branch -M master
git push -u origin master
```

---

### 方式3：推送到自建Git服务器

```bash
# 进入项目目录
cd "/Users/pan/Desktop/tunda project management"

# 添加远程仓库（替换为您的Git服务器地址）
git remote add origin git@your-server.com:path/to/repo.git

# 推送代码
git push -u origin master
```

---

## 🖥️ 服务器部署步骤

### 准备工作

#### 服务器要求
- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / macOS
- **Node.js**: v14+ 
- **内存**: 至少512MB
- **硬盘**: 至少1GB可用空间

#### 可选（生产环境）
- MongoDB 4.4+
- Nginx
- PM2进程管理器

---

### 部署方式1：快速部署（演示版）

适合：测试、演示、小规模使用

#### 步骤1：克隆代码
```bash
# 在服务器上执行
git clone https://github.com/YOUR_USERNAME/tunda-project-management.git
cd tunda-project-management
```

#### 步骤2：安装依赖
```bash
npm install
```

#### 步骤3：启动服务
```bash
# 直接启动（演示版，使用内存存储）
node start-simple.js
```

#### 步骤4：访问系统
```
http://服务器IP:3000
账号：Michael / 123456
```

#### 步骤5：后台运行（使用nohup）
```bash
# 后台运行
nohup node start-simple.js > logs.txt 2>&1 &

# 查看日志
tail -f logs.txt

# 停止服务
ps aux | grep start-simple.js
kill -9 <进程ID>
```

---

### 部署方式2：生产环境部署

适合：正式使用、数据持久化

#### 步骤1：安装MongoDB
```bash
# Ubuntu
sudo apt-get update
sudo apt-get install -y mongodb

# CentOS
sudo yum install -y mongodb-org

# macOS
brew install mongodb-community
```

#### 步骤2：启动MongoDB
```bash
# 启动MongoDB服务
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证MongoDB运行
mongo --eval "db.version()"
```

#### 步骤3：配置环境变量
```bash
# 编辑config.env文件
vim config.env
```

修改以下内容：
```env
# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/tunda

# 微信配置（如需要）
WECHAT_APPID=你的微信AppID
WECHAT_SECRET=你的微信Secret

# JWT密钥
JWT_SECRET=your-secret-key-here-change-in-production

# 端口
PORT=3000
```

#### 步骤4：使用PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动服务（使用完整版server.js）
pm2 start server.js --name tunda-pm

# 查看状态
pm2 status

# 查看日志
pm2 logs tunda-pm

# 重启服务
pm2 restart tunda-pm

# 停止服务
pm2 stop tunda-pm

# 设置开机自启
pm2 startup
pm2 save
```

---

### 部署方式3：Docker部署

适合：容器化部署、微服务架构

#### 步骤1：构建Docker镜像
```bash
# 在项目目录执行
docker build -t tunda-pm:latest .
```

#### 步骤2：运行容器
```bash
# 使用演示版（内存存储）
docker run -d \
  --name tunda-pm \
  -p 3000:3000 \
  tunda-pm:latest

# 使用生产版（连接MongoDB）
docker-compose up -d
```

#### 步骤3：查看容器
```bash
# 查看运行状态
docker ps

# 查看日志
docker logs -f tunda-pm

# 停止容器
docker stop tunda-pm

# 删除容器
docker rm tunda-pm
```

---

## 🔒 安全配置

### 1. 修改默认密码
```bash
# 首次部署后，立即修改管理员密码
# 登录系统 → 用户管理 → 编辑Michael → 修改密码
```

### 2. 配置防火墙
```bash
# Ubuntu/CentOS - 开放3000端口
sudo ufw allow 3000
sudo ufw enable

# 或使用firewalld
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 3. 使用Nginx反向代理
```nginx
# /etc/nginx/sites-available/tunda-pm
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/tunda-pm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 配置HTTPS（推荐）
```bash
# 安装certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 📊 监控和维护

### 日志管理
```bash
# PM2日志
pm2 logs tunda-pm

# 清理日志
pm2 flush

# 系统日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 性能监控
```bash
# 使用PM2监控
pm2 monit

# 查看系统资源
htop
```

### 备份数据
```bash
# MongoDB备份
mongodump --db tunda --out /backup/$(date +%Y%m%d)

# 恢复数据
mongorestore --db tunda /backup/20251016/tunda
```

---

## 🔄 更新部署

### 更新代码
```bash
# 1. 拉取最新代码
cd /path/to/tunda-project-management
git pull origin master

# 2. 安装新依赖
npm install

# 3. 重启服务
pm2 restart tunda-pm

# 或使用Docker
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 🌐 域名配置

### 步骤1：购买域名
在阿里云、腾讯云或其他域名服务商购买域名

### 步骤2：配置DNS解析
```
类型: A
主机记录: @（或www）
记录值: 您的服务器IP
TTL: 600
```

### 步骤3：等待生效
通常需要10分钟到24小时

---

## 🐛 常见问题

### 问题1：端口被占用
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或修改config.env中的PORT
```

### 问题2：MongoDB连接失败
```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 重启MongoDB
sudo systemctl restart mongod

# 查看MongoDB日志
sudo tail -f /var/log/mongodb/mongod.log
```

### 问题3：权限问题
```bash
# 给予执行权限
chmod +x start.sh

# 修改文件所有者
sudo chown -R $USER:$USER /path/to/project
```

### 问题4：依赖安装失败
```bash
# 清理缓存
npm cache clean --force

# 重新安装
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 技术支持

### 快速命令参考

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs --lines 100

# 重启服务
pm2 restart tunda-pm

# 停止服务
pm2 stop tunda-pm

# 查看MongoDB状态
sudo systemctl status mongod

# 查看Nginx状态
sudo systemctl status nginx
```

---

## ✅ 部署检查清单

部署完成后，请检查：

- [ ] 代码已推送到Git仓库
- [ ] 服务器已安装Node.js
- [ ] 代码已克隆到服务器
- [ ] 依赖已安装（npm install）
- [ ] 服务正常启动
- [ ] 可以通过浏览器访问
- [ ] 可以正常登录（Michael / 123456）
- [ ] 已修改默认管理员密码
- [ ] 防火墙已配置
- [ ] 数据库连接正常（如使用MongoDB）
- [ ] Nginx反向代理已配置（可选）
- [ ] HTTPS证书已配置（可选）
- [ ] PM2已设置开机自启
- [ ] 监控和日志系统正常

---

## 🎉 部署完成

部署完成后，您的同事可以：

1. **克隆代码**
   ```bash
   git clone <您的Git仓库地址>
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动服务**
   ```bash
   # 快速启动（演示版）
   node start-simple.js
   
   # 或使用PM2（生产版）
   pm2 start server.js --name tunda-pm
   ```

4. **访问系统**
   ```
   http://服务器IP:3000
   ```

---

**部署文档版本**: v1.0  
**更新日期**: 2025-10-16  
**适用系统**: Linux / macOS / Windows

需要帮助？查看其他文档：
- **START_HERE.md** - 快速开始
- **README.md** - 技术文档
- **USAGE_GUIDE.md** - 使用指南
