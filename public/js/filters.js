// 项目筛选功能

// 全局存储原始数据
let allTrackingProjects = [];
let allDealProjects = [];

// 应用跟进项目筛选
function applyTrackingFilters() {
    const filters = {
        name: document.getElementById('filterTrackingName').value.trim().toLowerCase(),
        identity: document.getElementById('filterTrackingIdentity').value,
        category: document.getElementById('filterTrackingCategory').value,
        channel: document.getElementById('filterTrackingChannel').value,
        priority: document.getElementById('filterTrackingPriority').value,
        status: document.getElementById('filterTrackingStatus').value
    };
    
    console.log('应用跟进项目筛选:', filters);
    
    let filteredProjects = allTrackingProjects.filter(project => {
        // 项目名称筛选
        if (filters.name && !project.projectName.toLowerCase().includes(filters.name)) {
            return false;
        }
        
        // 客户身份筛选
        if (filters.identity && project.customerIdentity !== filters.identity) {
            return false;
        }
        
        // 客户类别筛选
        if (filters.category && project.customerCategory !== filters.category) {
            return false;
        }
        
        // 渠道筛选
        if (filters.channel && project.channel !== filters.channel) {
            return false;
        }
        
        // 优先级筛选
        if (filters.priority && project.priority !== filters.priority) {
            return false;
        }
        
        // 状态筛选
        if (filters.status && project.status !== filters.status) {
            return false;
        }
        
        return true;
    });
    
    console.log('筛选结果:', filteredProjects.length, '个项目');
    
    // 显示筛选后的结果
    displayTrackingProjects(filteredProjects);
    
    showToast(`找到 ${filteredProjects.length} 个匹配项目`, 'success');
}

// 重置跟进项目筛选
function resetTrackingFilters() {
    document.getElementById('filterTrackingName').value = '';
    document.getElementById('filterTrackingIdentity').value = '';
    document.getElementById('filterTrackingCategory').value = '';
    document.getElementById('filterTrackingChannel').value = '';
    document.getElementById('filterTrackingPriority').value = '';
    document.getElementById('filterTrackingStatus').value = '';
    
    // 显示所有项目
    displayTrackingProjects(allTrackingProjects);
    
    showToast('筛选已重置', 'info');
}

// 显示跟进项目
function displayTrackingProjects(projects) {
    const tbody = document.querySelector('#trackingProjectsTable tbody');
    tbody.innerHTML = '';
    
    if (projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">暂无匹配项目</td></tr>';
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

// 应用成交项目筛选
function applyDealFilters() {
    const filters = {
        name: document.getElementById('filterDealName').value.trim().toLowerCase(),
        channel: document.getElementById('filterDealChannel').value,
        status: document.getElementById('filterDealStatus').value
    };
    
    console.log('应用成交项目筛选:', filters);
    
    let filteredProjects = allDealProjects.filter(project => {
        // 项目名称筛选
        if (filters.name && !project.projectName.toLowerCase().includes(filters.name)) {
            return false;
        }
        
        // 渠道筛选
        if (filters.channel && project.channel !== filters.channel) {
            return false;
        }
        
        // 状态筛选
        if (filters.status && project.status !== filters.status) {
            return false;
        }
        
        return true;
    });
    
    console.log('筛选结果:', filteredProjects.length, '个项目');
    
    // 显示筛选后的结果
    displayDealProjects(filteredProjects);
    
    showToast(`找到 ${filteredProjects.length} 个匹配项目`, 'success');
}

// 重置成交项目筛选
function resetDealFilters() {
    document.getElementById('filterDealName').value = '';
    document.getElementById('filterDealChannel').value = '';
    document.getElementById('filterDealStatus').value = '';
    
    // 显示所有项目
    displayDealProjects(allDealProjects);
    
    showToast('筛选已重置', 'info');
}

// 显示成交项目
function displayDealProjects(projects) {
    const tbody = document.querySelector('#dealProjectsTable tbody');
    tbody.innerHTML = '';
    
    if (projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">暂无匹配项目</td></tr>';
        return;
    }
    
    projects.forEach(project => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${project.projectName}</td>
            <td>${new Date(project.dealDate).toLocaleDateString('zh-CN')}</td>
            <td>${project.channel || '-'}</td>
            <td>${project.follower.wechatNickname || project.follower.username}</td>
            <td><span class="badge bg-${project.status === '进行中' ? 'primary' : project.status === '已完成' ? 'success' : 'secondary'}">${project.status}</span></td>
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

