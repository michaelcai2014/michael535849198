# 使用Node.js官方镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
