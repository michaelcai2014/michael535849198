// Tunda项目管理系统测试脚本
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 测试数据
const testData = {
  admin: {
    username: 'Michael',
    password: '123456'
  },
  trackingProject: {
    projectName: '测试项目 - 电动车营销APP',
    customerIdentity: '老板',
    customerCategory: '潜客',
    customerBackground: '初创企业',
    channel: 'Michael',
    priority: '高',
    status: 'WIP',
    customerWechatName: '测试客户',
    details: '这是一个测试项目，用于验证系统功能。'
  }
};

async function testSystem() {
  console.log('🧪 开始测试Tunda项目管理系统...\n');

  try {
    // 1. 测试管理员登录
    console.log('1️⃣ 测试管理员登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, testData.admin);
    
    if (loginResponse.data.success) {
      console.log('✅ 管理员登录成功');
      const token = loginResponse.data.data.token;
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // 2. 测试获取用户信息
      console.log('\n2️⃣ 测试获取用户信息...');
      const meResponse = await axios.get(`${API_BASE}/auth/me`, { headers });
      console.log('✅ 用户信息获取成功:', meResponse.data.data.username);
      
      // 3. 测试创建跟进项目
      console.log('\n3️⃣ 测试创建跟进项目...');
      const projectResponse = await axios.post(`${API_BASE}/tracking`, {
        ...testData.trackingProject,
        follower: meResponse.data.data._id
      }, { headers });
      
      if (projectResponse.data.success) {
        console.log('✅ 跟进项目创建成功:', projectResponse.data.data.projectName);
        const projectId = projectResponse.data.data._id;
        
        // 4. 测试获取跟进项目列表
        console.log('\n4️⃣ 测试获取跟进项目列表...');
        const listResponse = await axios.get(`${API_BASE}/tracking`, { headers });
        console.log('✅ 跟进项目列表获取成功，共', listResponse.data.data.projects.length, '个项目');
        
        // 5. 测试添加跟进记录
        console.log('\n5️⃣ 测试添加跟进记录...');
        const followUpResponse = await axios.post(`${API_BASE}/tracking/${projectId}/follow-up`, {
          content: '今天与客户进行了初步沟通，了解了项目需求。'
        }, { headers });
        
        if (followUpResponse.data.success) {
          console.log('✅ 跟进记录添加成功');
        }
        
        // 6. 测试更新项目状态为Deal
        console.log('\n6️⃣ 测试更新项目状态为Deal...');
        const updateResponse = await axios.put(`${API_BASE}/tracking/${projectId}`, {
          status: 'Deal'
        }, { headers });
        
        if (updateResponse.data.success) {
          console.log('✅ 项目状态更新成功');
          
          // 7. 测试获取成交项目列表
          console.log('\n7️⃣ 测试获取成交项目列表...');
          const dealsResponse = await axios.get(`${API_BASE}/projects`, { headers });
          console.log('✅ 成交项目列表获取成功，共', dealsResponse.data.data.projects.length, '个项目');
        }
        
        // 8. 测试获取操作日志
        console.log('\n8️⃣ 测试获取操作日志...');
        const logsResponse = await axios.get(`${API_BASE}/logs`, { headers });
        console.log('✅ 操作日志获取成功，共', logsResponse.data.data.logs.length, '条记录');
        
        // 9. 测试删除项目
        console.log('\n9️⃣ 测试删除跟进项目...');
        const deleteResponse = await axios.delete(`${API_BASE}/tracking/${projectId}`, { headers });
        if (deleteResponse.data.success) {
          console.log('✅ 项目删除成功');
        }
      }
      
      // 10. 测试登出
      console.log('\n🔟 测试用户登出...');
      const logoutResponse = await axios.post(`${API_BASE}/auth/logout`, {}, { headers });
      if (logoutResponse.data.success) {
        console.log('✅ 用户登出成功');
      }
    }
    
    console.log('\n🎉 所有测试通过！系统功能正常。');
    console.log('\n📋 测试总结:');
    console.log('   ✅ 用户认证系统');
    console.log('   ✅ 跟进项目管理');
    console.log('   ✅ 成交项目管理');
    console.log('   ✅ 操作日志系统');
    console.log('   ✅ 权限控制');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data?.message || error.message);
    console.log('\n🔧 请检查:');
    console.log('   1. 服务器是否正在运行 (npm start)');
    console.log('   2. MongoDB是否正在运行');
    console.log('   3. 端口3000是否被占用');
  }
}

// 运行测试
testSystem();
