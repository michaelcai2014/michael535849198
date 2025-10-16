// 显示新增用户模态框
function showAddUserModal() {
    document.getElementById('addUserForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
}

// 保存新用户
async function saveNewUser() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newUserRole').value || 'employee'; // 默认为员工
    
    if (!username || !password) {
        showToast('请填写完整信息', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('密码至少6位字符', 'error');
        return;
    }
    
    if (!role) {
        showToast('请选择用户角色', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ username, password, role })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('员工账号创建成功', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            loadUsers();
        } else {
            showToast(data.message || '创建失败', 'error');
        }
    } catch (error) {
        console.error('创建用户错误:', error);
        showToast('创建失败', 'error');
    }
}

// 编辑用户
async function editUser(userId) {
    showToast('编辑用户功能开发中...', 'info');
}
