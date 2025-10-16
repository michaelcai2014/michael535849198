// 编辑成交项目
async function editDealProject(projectId) {
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const project = data.data;
            
            // 填充表单
            document.getElementById('editDealProjectId').value = projectId;
            document.getElementById('editDealProjectName').value = project.projectName || '';
            document.getElementById('editDealDate').value = new Date(project.dealDate).toLocaleString('zh-CN');
            document.getElementById('editDealChannel').value = project.channel || '-';
            document.getElementById('editDealFollower').value = project.follower?.username || project.follower || '-';
            document.getElementById('editDealStatus').value = project.status || '进行中';
            document.getElementById('editDealProgress').value = project.progress || '';
            
            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('editDealProjectModal'));
            modal.show();
        } else {
            showToast('获取项目详情失败', 'error');
        }
    } catch (error) {
        console.error('获取项目详情错误:', error);
        showToast('获取项目详情失败', 'error');
    }
}

// 更新成交项目
async function updateDealProject() {
    const projectId = document.getElementById('editDealProjectId').value;
    const updatedProject = {
        status: document.getElementById('editDealStatus').value,
        progress: document.getElementById('editDealProgress').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updatedProject)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('项目更新成功', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editDealProjectModal')).hide();
            loadDealProjects();
            
            // 发送微信推送通知管理员
            sendWechatNotification('deal_update', {
                projectName: document.getElementById('editDealProjectName').value,
                status: updatedProject.status,
                progress: updatedProject.progress
            });
        } else {
            showToast(data.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('更新项目错误:', error);
        showToast('更新项目失败', 'error');
    }
}

// 查看成交项目详情
async function viewDealProjectDetail(projectId) {
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const project = data.data;
            
            const modalContent = `
                <div class="modal fade" id="dealProjectDetailModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-handshake me-2"></i>${project.projectName}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <strong>签单时间：</strong>
                                        <p>${new Date(project.dealDate).toLocaleString('zh-CN')}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong>状态：</strong>
                                        <p><span class="badge bg-info">${project.status}</span></p>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <strong>渠道：</strong>
                                        <p>${project.channel || '-'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong>项目经理：</strong>
                                        <p>${project.follower?.username || project.follower || '-'}</p>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-12">
                                        <strong>项目进展：</strong>
                                        <div class="mt-2 p-3 bg-light rounded">
                                            <pre class="mb-0" style="white-space: pre-wrap; font-family: inherit;">${project.progress || '暂无进展记录'}</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                                <button type="button" class="btn btn-primary" onclick="bootstrap.Modal.getInstance(document.getElementById('dealProjectDetailModal')).hide(); editDealProject(${projectId})">
                                    <i class="fas fa-edit me-1"></i>编辑
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 移除旧的模态框（如果存在）
            const oldModal = document.getElementById('dealProjectDetailModal');
            if (oldModal) {
                oldModal.remove();
            }
            
            // 添加新模态框
            document.body.insertAdjacentHTML('beforeend', modalContent);
            
            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('dealProjectDetailModal'));
            modal.show();
        } else {
            showToast('获取项目详情失败', 'error');
        }
    } catch (error) {
        console.error('获取项目详情错误:', error);
        showToast('获取项目详情失败', 'error');
    }
}
