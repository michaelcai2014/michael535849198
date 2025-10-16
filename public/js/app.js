// 全局变量
let currentUser = null;
let authToken = null;
const API_BASE = '/api';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    console.log('初始化应用...');
    
    // 检查是否已登录
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        try {
            authToken = token;
            currentUser = JSON.parse(user);
            console.log('发现已保存的用户:', currentUser);
            
            // 验证token是否有效
            loadUserInfo();
        } catch (error) {
            console.error('解析用户信息错误:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            showLoginSection();
        }
    } else {
        console.log('未找到登录信息，显示登录页面');
        showLoginSection();
    }
    
    // 绑定事件监听器
    bindEventListeners();
}

// 绑定事件监听器
function bindEventListeners() {
    // 登录表单提交
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('登录表单事件监听器已绑定');
    } else {
        console.error('未找到登录表单');
    }
    
    // 微信登录按钮
    const wechatBtn = document.getElementById('wechatLoginBtn');
    if (wechatBtn) {
        wechatBtn.addEventListener('click', wechatLogin);
        console.log('微信登录按钮事件监听器已绑定');
    }
}

// 显示登录页面
function showLoginSection() {
    console.log('显示登录页面...');
    document.getElementById('loginSection').style.display = 'block';
    
    // 隐藏导航栏
    document.querySelector('.navbar').style.display = 'none';
    
    // 隐藏所有区域
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
}

// 显示主界面
function showMainInterface() {
    console.log('显示主界面...');
    document.getElementById('loginSection').style.display = 'none';
    
    // 显示导航栏
    document.querySelector('.navbar').style.display = 'block';
    
    // 根据用户角色显示/隐藏菜单
    updateUIBasedOnRole();
    
    // 默认显示仪表板
    showSection('dashboard');
    loadDashboard();
}

// 根据用户角色更新UI
function updateUIBasedOnRole() {
    if (!currentUser) return;
    
    const isAdmin = currentUser.role === 'admin' || currentUser.username === 'Michael';
    
    // 更新导航栏用户名显示
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = currentUser.username;
    }
    
    // 显示/隐藏管理员菜单
    const adminMenu = document.getElementById('adminMenu');
    if (adminMenu) {
        adminMenu.style.display = isAdmin ? 'block' : 'none';
    }
    
    // 显示/隐藏用户卡片
    const usersCard = document.getElementById('usersCard');
    if (usersCard) {
        usersCard.style.display = isAdmin ? 'block' : 'none';
    }
    
    // 显示/隐藏操作日志菜单
    const logsMenu = document.getElementById('logsMenu');
    if (logsMenu) {
        logsMenu.style.display = isAdmin ? 'block' : 'none';
    }
    
    console.log('用户角色:', currentUser.role, '是否管理员:', isAdmin);
}

// 显示指定区域
function showSection(sectionName) {
    // 隐藏所有区域
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 显示指定区域
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // 更新导航栏活动状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // 加载对应数据
        switch(sectionName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'tracking':
                loadTrackingProjects();
                break;
            case 'deals':
                loadDealProjects();
                break;
            case 'users':
                loadUsers();
                break;
            case 'logs':
                loadLogs();
                break;
        }
    }
}

// 处理登录
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 显示加载状态
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>登录中...';
    submitBtn.disabled = true;
    
    try {
        console.log('尝试登录:', { username, password });
        console.log('API地址:', `${API_BASE}/auth/login`);
        
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        console.log('响应状态:', response.status);
        console.log('响应头:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('响应错误:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('响应数据:', data);
        
        if (data.success) {
            authToken = data.data.token;
            currentUser = data.data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showToast('登录成功', 'success');
            
            // 强制要求微信绑定（除了管理员Michael）
            if (currentUser.username !== 'Michael' && !currentUser.wechatBound) {
                // 显示微信绑定提示
                setTimeout(() => {
                    if (typeof showWechatBindingPrompt === 'function') {
                        showWechatBindingPrompt();
                    } else {
                        showMainInterface();
                    }
                }, 1000);
            } else {
                // 管理员或已绑定微信，直接进入主界面
                showMainInterface();
            }
        } else {
            showToast(data.message || '登录失败', 'error');
        }
    } catch (error) {
        console.error('登录错误:', error);
        showToast('登录失败，请检查网络连接', 'error');
    } finally {
        // 恢复按钮状态
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 显示微信扫码登录
function showWechatQR() {
    const modal = new bootstrap.Modal(document.getElementById('wechatQRModal'));
    modal.show();
    
    // 生成二维码
    generateWechatQR();
}

// 生成微信二维码
async function generateWechatQR() {
    try {
        // 重置状态
        document.getElementById('qrCodeContainer').style.display = 'block';
        document.getElementById('qrCodeSuccess').style.display = 'none';
        document.getElementById('qrCodeError').style.display = 'none';
        
        // 生成随机状态码
        const state = 'wechat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('wechat_state', state);
        
        // 构建微信登录URL
        const wechatUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=wx1234567890abcdef&redirect_uri=${encodeURIComponent(window.location.origin + '/api/wechat/callback')}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
        
        // 生成二维码
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        qrCodeContainer.innerHTML = `
            <div class="qr-code-wrapper">
                <div id="qrcode" style="display: flex; justify-content: center; margin: 20px 0;"></div>
                <p class="mt-3 text-muted">请使用微信扫描上方二维码</p>
                <div class="progress mt-3" style="height: 4px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
                </div>
            </div>
        `;
        
        // 使用QRCode.js生成二维码
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(document.getElementById('qrcode'), wechatUrl, {
                width: 200,
                height: 200,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, function (error) {
                if (error) {
                    console.error('生成二维码错误:', error);
                    qrCodeContainer.innerHTML = `
                        <div class="alert alert-info">
                            <p>请复制以下链接到微信中打开：</p>
                            <code>${wechatUrl}</code>
                        </div>
                    `;
                }
            });
        } else {
            // 如果没有QRCode.js，显示URL
            qrCodeContainer.innerHTML = `
                <div class="alert alert-info">
                    <p>请复制以下链接到微信中打开：</p>
                    <code>${wechatUrl}</code>
                </div>
            `;
        }
        
        // 开始轮询检查登录状态
        startPollingLoginStatus(state);
        
    } catch (error) {
        console.error('生成二维码错误:', error);
        document.getElementById('qrCodeError').style.display = 'block';
        document.getElementById('qrCodeContainer').style.display = 'none';
    }
}

// 轮询检查登录状态
function startPollingLoginStatus(state) {
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/wechat/check-login?state=${state}`);
            const data = await response.json();
            
            if (data.success && data.loggedIn) {
                clearInterval(pollInterval);
                handleWechatLoginSuccess(data.user);
            }
        } catch (error) {
            console.error('检查登录状态错误:', error);
        }
    }, 2000); // 每2秒检查一次
    
    // 5分钟后停止轮询
    setTimeout(() => {
        clearInterval(pollInterval);
        if (document.getElementById('qrCodeContainer').style.display !== 'none') {
            document.getElementById('qrCodeError').style.display = 'block';
            document.getElementById('qrCodeContainer').style.display = 'none';
        }
    }, 300000); // 5分钟
}

// 处理微信登录成功
function handleWechatLoginSuccess(userData) {
    document.getElementById('qrCodeContainer').style.display = 'none';
    document.getElementById('qrCodeSuccess').style.display = 'block';
    
    // 模拟登录成功
    setTimeout(() => {
        authToken = 'mock-token';
        currentUser = userData;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 关闭模态框
        bootstrap.Modal.getInstance(document.getElementById('wechatQRModal')).hide();
        
        // 显示主界面
        showMainInterface();
        showToast('微信登录成功', 'success');
    }, 1500);
}

// 刷新二维码
function refreshQRCode() {
    generateWechatQR();
}

// 加载用户信息
async function loadUserInfo() {
    try {
        console.log('验证用户信息...');
        
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('用户信息响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('用户信息响应数据:', data);
        
        if (data.success) {
            currentUser = data.data;
            document.getElementById('userName').textContent = currentUser.username;
            
            // 显示管理员菜单
            if (currentUser.role === 'admin') {
                document.getElementById('adminMenu').style.display = 'block';
                document.getElementById('adminMenu2').style.display = 'block';
            }
            
            console.log('用户验证成功，显示主界面');
            showMainInterface();
        } else {
            console.log('用户验证失败，清除本地存储');
            // Token无效，清除本地存储
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            authToken = null;
            currentUser = null;
            showLoginSection();
        }
    } catch (error) {
        console.error('加载用户信息错误:', error);
        // 清除本地存储并显示登录页面
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        authToken = null;
        currentUser = null;
        showLoginSection();
    }
}

// 加载仪表板数据
async function loadDashboard() {
    try {
        // 加载跟进项目统计
        const trackingResponse = await fetch(`${API_BASE}/tracking?limit=1000`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const trackingData = await trackingResponse.json();
        
        if (trackingData.success) {
            const trackingProjects = trackingData.data.projects;
            document.getElementById('totalTrackingProjects').textContent = trackingProjects.length;
            
            const highPriorityCount = trackingProjects.filter(p => p.priority === '高').length;
            document.getElementById('highPriorityProjects').textContent = highPriorityCount;
        }
        
        // 加载成交项目统计
        const dealsResponse = await fetch(`${API_BASE}/projects?limit=1000`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const dealsData = await dealsResponse.json();
        
        if (dealsData.success) {
            const dealProjects = dealsData.data.projects;
            document.getElementById('totalDealProjects').textContent = dealProjects.length;
        }
        
        // 加载用户统计（仅管理员）
        if (currentUser.role === 'admin') {
            const usersResponse = await fetch(`${API_BASE}/users`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const usersData = await usersResponse.json();
            
            if (usersData.success) {
                document.getElementById('totalUsers').textContent = usersData.data.length;
            }
        }
    } catch (error) {
        console.error('加载仪表板数据错误:', error);
    }
}

// 加载跟进项目
async function loadTrackingProjects() {
    try {
        const response = await fetch(`${API_BASE}/tracking`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.querySelector('#trackingProjectsTable tbody');
            tbody.innerHTML = '';
            
            // 权限控制：员工只看自己的项目，管理员看所有项目
            const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.username === 'Michael');
            
            console.log('当前用户:', currentUser.username, '是否管理员:', isAdmin);
            console.log('所有项目数量:', data.data.projects.length);
            
            const projects = isAdmin ? data.data.projects : data.data.projects.filter(p => {
                // 获取跟进人用户名
                let followerUsername;
                if (typeof p.follower === 'object' && p.follower !== null) {
                    followerUsername = p.follower.username || p.follower._id;
                } else {
                    followerUsername = p.follower;
                }
                
                const isMatch = followerUsername === currentUser.username || 
                                followerUsername === currentUser.id ||
                                (p.follower && p.follower._id === currentUser.id);
                
                console.log('项目:', p.projectName, '跟进人:', followerUsername, '当前用户:', currentUser.username, '匹配:', isMatch);
                
                return isMatch;
            });
            
            console.log('过滤后项目数量:', projects.length);
            
            if (projects.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">暂无项目</td></tr>';
                return;
            }
            
            projects.forEach(project => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${project.projectName}</td>
                    <td>${project.customerIdentity}</td>
                    <td>${project.customerCategory}</td>
                    <td>${project.channel || '-'}</td>
                    <td>${project.follower.wechatNickname || project.follower.username}</td>
                    <td><span class="priority-${project.priority === '高' ? 'high' : 'low'}">${project.priority}</span></td>
                    <td><span class="status-badge status-${project.status.toLowerCase()}">${project.status}</span></td>
                    <td>${new Date(project.lastUpdated).toLocaleString('zh-CN')}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewProjectDetail('${project._id}', 'tracking')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="editTrackingProject('${project._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteTrackingProject('${project._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('加载跟进项目错误:', error);
        showToast('加载数据失败', 'error');
    }
}

// 加载成交项目
async function loadDealProjects() {
    try {
        const response = await fetch(`${API_BASE}/projects`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.querySelector('#dealProjectsTable tbody');
            tbody.innerHTML = '';
            
            // 权限控制：员工只看自己的项目，管理员看所有项目
            const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.username === 'Michael');
            
            const projects = isAdmin ? data.data.projects : data.data.projects.filter(p => {
                // 获取跟进人用户名
                let followerUsername;
                if (typeof p.follower === 'object' && p.follower !== null) {
                    followerUsername = p.follower.username || p.follower._id;
                } else {
                    followerUsername = p.follower;
                }
                
                return followerUsername === currentUser.username || 
                       followerUsername === currentUser.id ||
                       (p.follower && p.follower._id === currentUser.id);
            });
            
            if (projects.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">暂无成交项目</td></tr>';
                return;
            }
            
            projects.forEach(project => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${project.projectName}</td>
                    <td>${new Date(project.dealDate).toLocaleDateString('zh-CN')}</td>
                    <td>${project.channel}</td>
                    <td>${project.follower.wechatNickname || project.follower.username}</td>
                    <td><span class="status-badge status-${project.status}">${project.status}</span></td>
                    <td>${new Date(project.lastUpdated).toLocaleString('zh-CN')}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewProjectDetail('${project._id}', 'deal')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="editDealProject('${project._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteDealProject('${project._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('加载成交项目错误:', error);
        showToast('加载数据失败', 'error');
    }
}

// 加载用户列表
async function loadUsers() {
    if (currentUser.role !== 'admin') {
        showToast('权限不足', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.querySelector('#usersTable tbody');
            tbody.innerHTML = '';
            
            data.data.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td><span class="badge bg-${user.role === 'admin' ? 'danger' : 'primary'}">${user.role === 'admin' ? '管理员' : '员工'}</span></td>
                    <td>${user.wechatNickname || '-'}</td>
                    <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString('zh-CN') : '从未登录'}</td>
                    <td><span class="badge bg-${user.isActive ? 'success' : 'secondary'}">${user.isActive ? '活跃' : '禁用'}</span></td>
                    <td>${new Date(user.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="editUser('${user._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('加载用户列表错误:', error);
        showToast('加载数据失败', 'error');
    }
}

// 加载操作日志
async function loadLogs() {
    if (currentUser.role !== 'admin') {
        showToast('权限不足', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/logs`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.querySelector('#logsTable tbody');
            tbody.innerHTML = '';
            
            data.data.logs.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(log.timestamp).toLocaleString('zh-CN')}</td>
                    <td>${log.operator.username}</td>
                    <td><span class="badge bg-info">${log.action}</span></td>
                    <td>${log.entityType}</td>
                    <td>${log.description}</td>
                    <td>${log.ipAddress || '-'}</td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('加载操作日志错误:', error);
        showToast('加载数据失败', 'error');
    }
}

// 显示新增跟进项目模态框
function showAddTrackingProjectModal() {
    // 加载用户列表到跟进人下拉框
    loadUsersForSelect('follower');
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addTrackingProjectModal'));
    modal.show();
}

// 保存跟进项目
async function saveTrackingProject() {
    const formData = {
        projectName: document.getElementById('projectName').value,
        customerIdentity: document.getElementById('customerIdentity').value,
        customerCategory: document.getElementById('customerCategory').value,
        customerBackground: document.getElementById('customerBackground').value,
        channel: document.getElementById('channel').value,
        follower: document.getElementById('follower').value,
        priority: document.getElementById('priority').value,
        status: document.getElementById('status').value,
        customerWechatName: document.getElementById('customerWechatName').value,
        details: document.getElementById('details').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/tracking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('项目创建成功', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addTrackingProjectModal')).hide();
            document.getElementById('addTrackingProjectForm').reset();
            
            // 发送微信推送通知管理员
            if (typeof notifyProjectCreated === 'function') {
                notifyProjectCreated(formData.projectName, formData.details || '新项目创建');
            }
            
            // 刷新项目列表和仪表盘
            loadTrackingProjects();
            loadDashboard();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('保存跟进项目错误:', error);
        showToast('保存失败', 'error');
    }
}

// 加载用户到下拉框
async function loadUsersForSelect(selectId) {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById(selectId);
            select.innerHTML = '<option value="">请选择</option>';
            
            data.data.forEach(user => {
                const option = document.createElement('option');
                option.value = user._id;
                option.textContent = user.username;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载用户列表错误:', error);
    }
}

// 查看项目详情
async function viewProjectDetail(projectId, type) {
    try {
        const endpoint = type === 'tracking' ? 'tracking' : 'projects';
        const response = await fetch(`${API_BASE}/${endpoint}/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const project = data.data;
            const content = document.getElementById('projectDetailContent');
            
            content.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h5>基本信息</h5>
                        <table class="table table-sm">
                            <tr><td><strong>项目名称:</strong></td><td>${project.projectName}</td></tr>
                            <tr><td><strong>状态:</strong></td><td><span class="status-badge status-${project.status.toLowerCase()}">${project.status}</span></td></tr>
                            <tr><td><strong>优先级:</strong></td><td>${project.priority}</td></tr>
                            <tr><td><strong>渠道:</strong></td><td>${project.channel || '-'}</td></tr>
                            <tr><td><strong>跟进人:</strong></td><td>${project.follower.wechatNickname || project.follower.username}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h5>客户信息</h5>
                        <table class="table table-sm">
                            <tr><td><strong>客户身份:</strong></td><td>${project.customerIdentity}</td></tr>
                            <tr><td><strong>客户类别:</strong></td><td>${project.customerCategory}</td></tr>
                            <tr><td><strong>客户背景:</strong></td><td>${project.customerBackground}</td></tr>
                            <tr><td><strong>微信名:</strong></td><td>${project.customerWechatName || '-'}</td></tr>
                        </table>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <h5>项目详情</h5>
                        <div class="card">
                            <div class="card-body">
                                <p>${project.details || '暂无详情'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                ${project.adminNotes ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h5>管理员备注</h5>
                        <div class="card bg-light">
                            <div class="card-body">
                                <p>${project.adminNotes}</p>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
                ${project.followUpRecords && project.followUpRecords.length > 0 ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h5>跟进记录</h5>
                        <div class="timeline">
                            ${project.followUpRecords.map(record => `
                                <div class="card mb-2">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div class="flex-grow-1">
                                                <p class="mb-1">${record.content}</p>
                                            </div>
                                            <div class="text-muted small">
                                                <div>${record.formattedDate || new Date(record.date).toLocaleString('zh-CN')}</div>
                                                <div>${record.updatedBy.username || record.updatedBy}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}
                <div class="row mt-3">
                    <div class="col-12">
                        <h5>操作</h5>
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-warning" onclick="editTrackingProject('${projectId}')">
                                <i class="fas fa-edit me-1"></i>编辑项目
                            </button>
                            <button type="button" class="btn btn-info" onclick="addFollowUpRecord('${projectId}')">
                                <i class="fas fa-plus me-1"></i>添加跟进记录
                            </button>
                            <button type="button" class="btn btn-danger" onclick="deleteTrackingProject('${projectId}')">
                                <i class="fas fa-trash me-1"></i>删除项目
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            const modal = new bootstrap.Modal(document.getElementById('projectDetailModal'));
            modal.show();
        }
    } catch (error) {
        console.error('加载项目详情错误:', error);
        showToast('加载项目详情失败', 'error');
    }
}

// 删除跟进项目
async function deleteTrackingProject(projectId) {
    if (!confirm('确定要删除这个项目吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/tracking/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('项目删除成功', 'success');
            loadTrackingProjects();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('删除跟进项目错误:', error);
        showToast('删除失败', 'error');
    }
}

// 删除成交项目
async function deleteDealProject(projectId) {
    if (!confirm('确定要删除这个项目吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('项目删除成功', 'success');
            loadDealProjects();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('删除成交项目错误:', error);
        showToast('删除失败', 'error');
    }
}

// 删除用户
async function deleteUser(userId) {
    if (!confirm('确定要删除这个用户吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('用户删除成功', 'success');
            loadUsers();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('删除用户错误:', error);
        showToast('删除失败', 'error');
    }
}

// 显示提示消息
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // 自动移除toast元素
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// 创建toast容器
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        authToken = null;
        currentUser = null;
        showLoginSection();
        showToast('已退出登录', 'info');
    }
}

// 显示个人资料
function showProfile() {
    if (currentUser) {
        alert(`用户名: ${currentUser.username}\n角色: ${currentUser.role === 'admin' ? '管理员' : '员工'}\n微信昵称: ${currentUser.wechatNickname || '未绑定'}`);
    }
}

// 编辑跟进项目
async function editTrackingProject(projectId) {
    try {
        console.log('获取项目详情，ID:', projectId);
        
        // 获取项目详情
        const response = await fetch(`${API_BASE}/tracking/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('项目详情数据:', data);
        
        if (data.success) {
            const project = data.data;
            
            // 填充编辑表单
            document.getElementById('editProjectId').value = projectId;
            document.getElementById('editProjectName').value = project.projectName;
            document.getElementById('editCustomerIdentity').value = project.customerIdentity;
            document.getElementById('editCustomerCategory').value = project.customerCategory;
            document.getElementById('editCustomerBackground').value = project.customerBackground;
            document.getElementById('editChannel').value = project.channel || '';
            document.getElementById('editFollower').value = project.follower._id || project.follower.username || project.follower;
            document.getElementById('editPriority').value = project.priority;
            document.getElementById('editStatus').value = project.status;
            document.getElementById('editCustomerWechatName').value = project.customerWechatName || '';
            document.getElementById('editDetails').value = project.details || '';
            
            // 加载用户列表到跟进人下拉框
            await loadUsersForSelect('editFollower');
            
            // 关闭详情模态框
            const detailModal = bootstrap.Modal.getInstance(document.getElementById('projectDetailModal'));
            if (detailModal) {
                detailModal.hide();
            }
            
            // 显示编辑模态框
            const modal = new bootstrap.Modal(document.getElementById('editTrackingProjectModal'));
            modal.show();
        } else {
            console.error('API返回错误:', data.message);
            showToast('获取项目详情失败: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('获取项目详情错误:', error);
        showToast('获取项目详情失败: ' + error.message, 'error');
    }
}

// 添加跟进记录
function addFollowUpRecord(projectId) {
    // 设置项目ID
    document.getElementById('followUpProjectId').value = projectId;
    document.getElementById('followUpContent').value = '';
    
    // 关闭详情模态框
    const detailModal = bootstrap.Modal.getInstance(document.getElementById('projectDetailModal'));
    if (detailModal) {
        detailModal.hide();
    }
    
    // 显示添加跟进记录模态框
    const modal = new bootstrap.Modal(document.getElementById('addFollowUpModal'));
    modal.show();
}

// 编辑成交项目
function editDealProject(projectId) {
    showToast('编辑成交项目功能开发中...', 'info');
}

// 删除成交项目
async function deleteDealProject(projectId) {
    if (!confirm('确定要删除这个项目吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('项目删除成功', 'success');
            loadDealProjects();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('删除成交项目错误:', error);
        showToast('删除失败', 'error');
    }
}

// 删除用户
async function deleteUser(userId) {
    if (!confirm('确定要删除这个用户吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('用户删除成功', 'success');
            loadUsers();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('删除用户错误:', error);
        showToast('删除失败', 'error');
    }
}
