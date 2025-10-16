// 保存跟进记录
async function saveFollowUpRecord() {
    const projectId = document.getElementById('followUpProjectId').value;
    const content = document.getElementById('followUpContent').value;
    
    if (!content.trim()) {
        showToast('请输入跟进内容', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/tracking/${projectId}/follow-up`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('跟进记录添加成功', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addFollowUpModal')).hide();
            
            // 发送微信推送通知管理员
            const project = data.data;
            if (typeof notifyFollowUpAdded === 'function' && project) {
                notifyFollowUpAdded(project.projectName || '项目', content);
            }
            
            // 刷新跟进项目列表
            loadTrackingProjects();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('添加跟进记录错误:', error);
        showToast('添加跟进记录失败', 'error');
    }
}
