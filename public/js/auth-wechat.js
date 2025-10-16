// 微信授权绑定功能

// 显示微信绑定提示
function showWechatBindingPrompt() {
    const modal = `
        <div class="modal fade" id="wechatBindingModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fab fa-weixin me-2"></i>绑定微信账号
                        </h5>
                    </div>
                    <div class="modal-body text-center">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>重要提示</strong><br>
                            为了接收项目更新推送通知，请绑定您的微信账号
                        </div>
                        <div id="wechatBindQRContainer">
                            <div class="spinner-border text-success" role="status">
                                <span class="visually-hidden">加载中...</span>
                            </div>
                            <p class="mt-3">正在生成绑定二维码...</p>
                        </div>
                        <div id="wechatBindSuccess" style="display: none;">
                            <div class="text-success mb-3">
                                <i class="fas fa-check-circle fa-3x"></i>
                            </div>
                            <h5>绑定成功！</h5>
                            <p class="text-muted">您现在可以接收微信推送通知了</p>
                        </div>
                        <div class="mt-3">
                            <p class="text-muted small">
                                <i class="fas fa-mobile-alt me-1"></i>
                                请使用微信扫描二维码完成绑定
                            </p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="skipWechatBinding()">
                            稍后绑定
                        </button>
                        <button type="button" class="btn btn-success" onclick="refreshWechatBindQR()">
                            <i class="fas fa-refresh me-1"></i>刷新二维码
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除旧的模态框
    const oldModal = document.getElementById('wechatBindingModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    // 添加新模态框
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // 显示模态框
    const bindingModal = new bootstrap.Modal(document.getElementById('wechatBindingModal'));
    bindingModal.show();
    
    // 生成二维码
    generateWechatBindQR();
}

// 生成微信绑定二维码
async function generateWechatBindQR() {
    try {
        const qrContainer = document.getElementById('wechatBindQRContainer');
        if (!qrContainer) return;
        
        // 生成绑定链接
        const bindState = 'bind_' + currentUser.username + '_' + Date.now();
        sessionStorage.setItem('wechat_bind_state', bindState);
        
        const bindUrl = `${window.location.origin}/api/wechat/bind?state=${bindState}&user=${currentUser.username}`;
        
        // 显示二维码
        qrContainer.innerHTML = `
            <div class="p-3">
                <canvas id="wechatBindQR"></canvas>
            </div>
        `;
        
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(document.getElementById('wechatBindQR'), bindUrl, {
                width: 200,
                margin: 2
            }, function (error) {
                if (error) {
                    console.error('二维码生成失败:', error);
                    qrContainer.innerHTML = '<div class="alert alert-danger">二维码生成失败</div>';
                }
            });
        } else {
            qrContainer.innerHTML = `
                <div class="alert alert-warning">
                    <p>二维码库未加载</p>
                    <p class="small">绑定链接：</p>
                    <input type="text" class="form-control" value="${bindUrl}" readonly>
                </div>
            `;
        }
        
        // 开始轮询绑定状态
        startPollingBindStatus(bindState);
        
    } catch (error) {
        console.error('生成绑定二维码错误:', error);
    }
}

// 轮询绑定状态
let bindPollingInterval = null;
function startPollingBindStatus(bindState) {
    // 清除之前的轮询
    if (bindPollingInterval) {
        clearInterval(bindPollingInterval);
    }
    
    // 每3秒检查一次
    bindPollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/wechat/bind-status?state=${bindState}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.bound) {
                // 绑定成功
                clearInterval(bindPollingInterval);
                handleWechatBindSuccess(data.wechatInfo);
            }
        } catch (error) {
            console.error('检查绑定状态错误:', error);
        }
    }, 3000);
    
    // 2分钟后停止轮询
    setTimeout(() => {
        if (bindPollingInterval) {
            clearInterval(bindPollingInterval);
        }
    }, 120000);
}

// 处理绑定成功
function handleWechatBindSuccess(wechatInfo) {
    document.getElementById('wechatBindQRContainer').style.display = 'none';
    document.getElementById('wechatBindSuccess').style.display = 'block';
    
    // 更新用户信息
    if (currentUser) {
        currentUser.wechatBound = true;
        currentUser.wechatNickname = wechatInfo.nickname;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    showToast('微信绑定成功！', 'success');
    
    // 2秒后关闭模态框
    setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('wechatBindingModal'));
        if (modal) {
            modal.hide();
        }
        // 进入主界面
        showMainInterface();
    }, 2000);
}

// 跳过微信绑定
function skipWechatBinding() {
    if (bindPollingInterval) {
        clearInterval(bindPollingInterval);
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('wechatBindingModal'));
    if (modal) {
        modal.hide();
    }
    
    // 进入主界面
    showMainInterface();
}

// 刷新绑定二维码
function refreshWechatBindQR() {
    generateWechatBindQR();
}

// 检查用户是否已绑定微信
function checkWechatBinding() {
    if (currentUser && !currentUser.wechatBound) {
        // 显示绑定提示
        setTimeout(() => {
            showWechatBindingPrompt();
        }, 500);
    }
}

