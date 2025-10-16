// 更新跟进项目
async function updateTrackingProject() {
    const projectId = document.getElementById('editProjectId').value;
    const formData = {
        projectName: document.getElementById('editProjectName').value,
        customerIdentity: document.getElementById('editCustomerIdentity').value,
        customerCategory: document.getElementById('editCustomerCategory').value,
        customerBackground: document.getElementById('editCustomerBackground').value,
        channel: document.getElementById('editChannel').value,
        follower: document.getElementById('editFollower').value,
        priority: document.getElementById('editPriority').value,
        status: document.getElementById('editStatus').value,
        customerWechatName: document.getElementById('editCustomerWechatName').value,
        details: document.getElementById('editDetails').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/tracking/${projectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('项目更新成功', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editTrackingProjectModal')).hide();
            
            // 发送微信推送通知管理员
            if (typeof notifyProjectCreated === 'function') {
                notifyProjectCreated(formData.projectName, `项目更新：${formData.details || '无详情'}`);
            }
            
            loadTrackingProjects();
            
            // 如果状态变为Deal，提示用户查看成交项目并刷新成交项目列表
            if (formData.status === 'Deal') {
                showToast('项目已成交！已自动创建成交项目，请查看"已成交项目"页面', 'success');
                loadDealProjects();
            }
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('更新跟进项目错误:', error);
        showToast('更新失败', 'error');
    }
}
