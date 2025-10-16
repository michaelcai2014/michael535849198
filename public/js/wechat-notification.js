// 发送微信推送通知
async function sendWechatNotification(type, data) {
    try {
        const response = await fetch(`${API_BASE}/wechat/notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                type,
                data,
                timestamp: new Date().toISOString()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('微信推送成功:', type, data);
        } else {
            console.warn('微信推送失败:', result.message);
        }
    } catch (error) {
        console.error('微信推送错误:', error);
    }
}

// 在创建项目时发送通知
async function notifyProjectCreated(projectName, details) {
    await sendWechatNotification('project_created', {
        projectName,
        details,
        operator: currentUser.username,
        time: new Date().toLocaleString('zh-CN')
    });
}

// 在添加跟进记录时发送通知
async function notifyFollowUpAdded(projectName, content) {
    await sendWechatNotification('followup_added', {
        projectName,
        content,
        operator: currentUser.username,
        time: new Date().toLocaleString('zh-CN')
    });
}

// 在管理员添加备注时发送通知给跟进人
async function notifyFollowerAboutRemark(followerUsername, projectName, remark) {
    await sendWechatNotification('admin_remark', {
        followerUsername,
        projectName,
        remark,
        admin: currentUser.username,
        time: new Date().toLocaleString('zh-CN')
    });
}
