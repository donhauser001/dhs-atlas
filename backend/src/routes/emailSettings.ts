import express from 'express'
import EmailSettingController from '../controllers/EmailSettingController'

const router = express.Router()

// 获取邮件设置
router.get('/', EmailSettingController.getEmailSetting)

// 保存邮件设置
router.post('/', EmailSettingController.saveEmailSetting)

// 更新邮件设置
router.put('/', EmailSettingController.saveEmailSetting)

// 发送测试邮件
router.post('/test', EmailSettingController.sendTestEmail)

// 验证邮件配置
router.post('/verify', EmailSettingController.verifyEmailConfiguration)

// 检查邮件设置状态
router.get('/status', EmailSettingController.checkEmailStatus)

export default router
