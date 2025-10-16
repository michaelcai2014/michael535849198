// 微信公众号配置管理

// 加载微信公众号配置
async function loadWechatConfig() {
    try {
        const response = await fetch(`${API_BASE}/wechat/config`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            // 填充表单
            document.getElementById('appId').value = data.data.appId || '';
            document.getElementById('appSecret').value = data.data.appSecret || '';
            document.getElementById('templateId').value = data.data.templateId || '';
            document.getElementById('token').value = data.data.token || '';
            document.getElementById('encodingAESKey').value = data.data.encodingAESKey || '';
            document.getElementById('enablePush').checked = data.data.enablePush !== false;
        }
        
        // 生成绑定二维码
        generateBindQRCode();
        
    } catch (error) {
        console.error('加载微信配置错误:', error);
    }
}

// 保存微信公众号配置
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('wechatConfigForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const config = {
                appId: document.getElementById('appId').value,
                appSecret: document.getElementById('appSecret').value,
                templateId: document.getElementById('templateId').value,
                token: document.getElementById('token').value,
                encodingAESKey: document.getElementById('encodingAESKey').value,
                enablePush: document.getElementById('enablePush').checked
            };
            
            try {
                const response = await fetch(`${API_BASE}/wechat/config`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(config)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('配置保存成功', 'success');
                } else {
                    showToast(data.message || '保存失败', 'error');
                }
            } catch (error) {
                console.error('保存微信配置错误:', error);
                showToast('保存失败', 'error');
            }
        });
    }
});

// 测试微信公众号连接
async function testWechatConnection() {
    try {
        showToast('正在测试连接...', 'info');
        
        const response = await fetch(`${API_BASE}/wechat/test`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('连接测试成功！', 'success');
        } else {
            showToast(data.message || '连接测试失败', 'error');
        }
    } catch (error) {
        console.error('测试微信连接错误:', error);
        showToast('连接测试失败', 'error');
    }
}

// 生成绑定二维码
async function generateBindQRCode() {
    try {
        const canvas = document.getElementById('wechatBindQRCode');
        if (!canvas) return;
        
        // 生成绑定URL（实际应该从后端获取）
        const bindUrl = `${window.location.origin}/api/wechat/bind?t=${Date.now()}`;
        
        // 使用 QRCode 库生成二维码
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(canvas, bindUrl, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }, function (error) {
                if (error) console.error('生成二维码失败:', error);
            });
        }
    } catch (error) {
        console.error('生成绑定二维码错误:', error);
    }
}

// 刷新绑定二维码
function refreshBindQRCode() {
    generateBindQRCode();
    showToast('二维码已刷新', 'success');
}

// 显示用户微信绑定二维码
async function showUserBindQR(userId, username) {
    try {
        // 创建模态框
        const modalHtml = `
            <div class="modal fade" id="userBindQRModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="fab fa-weixin me-2"></i>微信绑定 - ${username}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <p class="text-muted">请使用微信扫描下方二维码关注公众号</p>
                            <canvas id="userBindQR" style="max-width: 250px;"></canvas>
                            <p class="mt-3 small text-muted">扫码关注后系统将自动绑定您的微信账号</p>
                            <div class="alert alert-info mt-3">
                                <i class="fas fa-info-circle me-2"></i>
                                绑定后可接收项目通知推送
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                            <button type="button" class="btn btn-primary" onclick="refreshUserBindQR(${userId})">
                                <i class="fas fa-sync me-1"></i>刷新二维码
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 移除旧的模态框（如果存在）
        const oldModal = document.getElementById('userBindQRModal');
        if (oldModal) {
            oldModal.remove();
        }
        
        // 添加新模态框
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('userBindQRModal'));
        modal.show();
        
        // 生成二维码
        const bindUrl = `${window.location.origin}/api/wechat/bind?userId=${userId}&t=${Date.now()}`;
        const canvas = document.getElementById('userBindQR');
        
        if (typeof QRCode !== 'undefined' && canvas) {
            QRCode.toCanvas(canvas, bindUrl, {
                width: 250,
                margin: 2
            });
        }
        
    } catch (error) {
        console.error('显示绑定二维码错误:', error);
        showToast('生成二维码失败', 'error');
    }
}

// 刷新用户绑定二维码
function refreshUserBindQR(userId) {
    const canvas = document.getElementById('userBindQR');
    if (canvas) {
        const bindUrl = `${window.location.origin}/api/wechat/bind?userId=${userId}&t=${Date.now()}`;
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(canvas, bindUrl, {
                width: 250,
                margin: 2
            });
        }
    }
    showToast('二维码已刷新', 'success');
}

