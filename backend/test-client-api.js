const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testClientAPI() {
  console.log('开始测试客户管理API...\n');

  try {
    // 1. 测试获取客户列表
    console.log('1. 测试获取客户列表');
    const clientsResponse = await axios.get(`${BASE_URL}/clients`);
    console.log('客户列表:', clientsResponse.data);
    console.log('');

    // 2. 测试获取客户分类
    console.log('2. 测试获取客户分类');
    const categoriesResponse = await axios.get(`${BASE_URL}/client-categories`);
    console.log('客户分类:', categoriesResponse.data);
    console.log('');

    // 3. 测试获取报价单
    console.log('3. 测试获取报价单');
    const quotationsResponse = await axios.get(`${BASE_URL}/quotations`);
    console.log('报价单:', quotationsResponse.data);
    console.log('');

    // 4. 测试创建客户
    console.log('4. 测试创建客户');
    const newClient = {
      name: '测试客户公司',
      address: '北京市朝阳区测试路123号',
      invoiceType: '增值税普通发票',
      invoiceInfo: '测试客户公司\n税号：91110000123456789X\n开户行：测试银行\n账号：1234567890123456789',
      category: '科技企业',
      rating: 4,
      summary: '这是一个测试客户'
    };

    const createResponse = await axios.post(`${BASE_URL}/clients`, newClient);
    console.log('创建客户结果:', createResponse.data);
    console.log('');

    // 5. 测试获取刚创建的客户
    if (createResponse.data.success) {
      const clientId = createResponse.data.data._id;
      console.log('5. 测试获取客户详情');
      const clientResponse = await axios.get(`${BASE_URL}/clients/${clientId}`);
      console.log('客户详情:', clientResponse.data);
      console.log('');

      // 6. 测试更新客户
      console.log('6. 测试更新客户');
      const updateData = {
        name: '更新后的测试客户公司',
        rating: 5
      };
      const updateResponse = await axios.put(`${BASE_URL}/clients/${clientId}`, updateData);
      console.log('更新客户结果:', updateResponse.data);
      console.log('');

      // 7. 测试删除客户
      console.log('7. 测试删除客户');
      const deleteResponse = await axios.delete(`${BASE_URL}/clients/${clientId}`);
      console.log('删除客户结果:', deleteResponse.data);
      console.log('');
    }

    console.log('所有API测试完成！');

  } catch (error) {
    console.error('API测试失败:', error.response?.data || error.message);
  }
}

testClientAPI(); 