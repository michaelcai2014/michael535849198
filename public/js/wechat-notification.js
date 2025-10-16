// 发送微信推送通知（包含完整项目信息）
async function sendWechatNotification(type, data, project = null) {
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
                project,  // 传递完整项目信息
                timestamp: new Date().toISOString()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ 微信推送成功:', type);
            console.log('   项目:', data.projectName);
            console.log('   操作人:', data.operator);
        } else {
            console.warn('⚠️  微信推送失败:', result.message);
        }
    } catch (error) {
        console.error('❌ 微信推送错误:', error);
    }
}

// 在创建项目时发送通知（包含完整信息）
async function notifyProjectCreated(projectName, details, project = null) {
    await sendWechatNotification('project_created', {
        projectName,
        details,
        operator: currentUser.username,
        time: new Date().toLocaleString('zh-CN')
    }, project);
}

// 在添加跟进记录时发送通知（包含完整信息）
async function notifyFollowUpAdded(projectName, content, project = null) {
    await sendWechatNotification('followup_added', {
        projectName,
        content,
        operator: currentUser.username,
        time: new Date().toLocaleString('zh-CN')
    }, project);
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
