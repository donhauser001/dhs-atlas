import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

// 测试联系人数据
const testContacts = [
  {
    username: 'zhang_kehu',
    password: '123456',
    email: 'zhang@testcompany.com',
    phone: '13800138001',
    realName: '张客户',
    role: '客户',
    department: '外部客户',
    status: 'active',
    company: 'ABC科技有限公司',
    position: '采购经理',
    shippingMethod: '顺丰快递，收件人：张客户，电话：13800138001，地址：北京市朝阳区建国路88号',
    description: '重要客户，需要重点关注'
  },
  {
    username: 'li_designer',
    password: '123456',
    email: 'li@designstudio.com',
    phone: '13800138002',
    realName: '李设计师',
    role: '客户',
    department: '外部客户',
    status: 'active',
    company: 'XYZ设计工作室',
    position: '设计总监',
    shippingMethod: '圆通快递，收件人：李设计师，电话：13800138002，地址：上海市浦东新区陆家嘴金融中心',
    description: '设计类客户，对质量要求较高'
  },
  {
    username: 'wang_manager',
    password: '123456',
    email: 'wang@techgroup.com',
    phone: '13800138003',
    realName: '王经理',
    role: '客户',
    department: '外部客户',
    status: 'active',
    company: '创新科技集团',
    position: '技术总监',
    shippingMethod: '中通快递，收件人：王经理，电话：13800138003，地址：深圳市南山区科技园',
    description: '技术导向型客户，注重创新'
  },
  {
    username: 'liu_director',
    password: '123456',
    email: 'liu@futuredigital.com',
    phone: '13800138004',
    realName: '刘总监',
    role: '客户',
    department: '外部客户',
    status: 'active',
    company: '未来数字公司',
    position: '运营总监',
    shippingMethod: '申通快递，收件人：刘总监，电话：13800138004，地址：广州市天河区珠江新城',
    description: '数字化客户，追求效率'
  },
  {
    username: 'chen_supervisor',
    password: '123456',
    email: 'chen@smartsolution.com',
    phone: '13800138005',
    realName: '陈主管',
    role: '客户',
    department: '外部客户',
    status: 'active',
    company: '智慧解决方案',
    position: '项目经理',
    shippingMethod: '韵达快递，收件人：陈主管，电话：13800138005，地址：杭州市西湖区文三路',
    description: '解决方案客户，注重整体服务'
  },
  {
    username: 'zhao_director',
    password: '123456',
    email: 'zhao@digitalmarketing.com',
    phone: '13800138006',
    realName: '赵总监',
    role: '客户',
    department: '外部客户',
    status: 'active',
    company: '数字营销公司',
    position: '市场总监',
    shippingMethod: 'EMS，收件人：赵总监，电话：13800138006，地址：成都市高新区天府软件园',
    description: '营销类客户，关注ROI'
  },
  {
    username: 'sun_designer',
    password: '123456',
    email: 'sun@creativestudio.com',
    phone: '13800138007',
    realName: '孙设计师',
    role: '客户',
    department: '外部客户',
    status: 'active',
    company: '创意设计工作室',
    position: '创意总监',
    shippingMethod: '京东物流，收件人：孙设计师，电话：13800138007，地址：武汉市东湖新技术开发区',
    description: '创意类客户，追求独特设计'
  },
  {
    username: 'zhou_manager',
    password: '123456',
    email: 'zhou@internettech.com',
    phone: '13800138008',
    realName: '周经理',
    role: '客户',
    department: '外部客户',
    status: 'active',
    company: '互联网科技公司',
    position: '产品经理',
    shippingMethod: '自提，联系人：周经理，电话：13800138008，地址：西安市高新区科技路',
    description: '互联网客户，快速迭代需求'
  },
  {
    username: 'wu_assistant',
    password: '123456',
    email: 'wu@startup.com',
    phone: '13800138009',
    realName: '吴助理',
    role: '客户',
    department: '外部客户',
    status: 'inactive',
    company: '创业公司',
    position: '行政助理',
    shippingMethod: '顺丰快递，收件人：吴助理，电话：13800138009，地址：南京市江宁区科学园',
    description: '初创公司客户，预算有限'
  },
  {
    username: 'zheng_engineer',
    password: '123456',
    email: 'zheng@manufacturing.com',
    phone: '13800138010',
    realName: '郑工程师',
    role: '客户',
    department: '外部客户',
    status: 'active',
    company: '制造业公司',
    position: '技术工程师',
    shippingMethod: '圆通快递，收件人：郑工程师，电话：13800138010，地址：苏州市工业园区星湖街',
    description: '制造业客户，注重成本控制'
  }
]

async function createTestContacts() {
  console.log('开始创建测试联系人...')
  
  for (const contact of testContacts) {
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, contact)
      if (response.data.success) {
        console.log(`✅ 成功创建联系人: ${contact.realName} (${contact.username})`)
      } else {
        console.log(`❌ 创建联系人失败: ${contact.realName} - ${response.data.message}`)
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log(`⚠️  联系人已存在: ${contact.realName} (${contact.username})`)
      } else {
        console.log(`❌ 创建联系人失败: ${contact.realName} - ${error.message}`)
      }
    }
  }
  
  console.log('测试联系人创建完成！')
}

// 运行脚本
createTestContacts().catch(console.error) 