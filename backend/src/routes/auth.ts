import express from 'express';
import { AuthController } from '../controllers/AuthController';

const router = express.Router();
const authController = new AuthController();

// 用户登录
router.post('/login', authController.login.bind(authController));

// 用户注册
router.post('/register', authController.register.bind(authController));

// 验证token
router.get('/verify', authController.verifyToken.bind(authController));

// 刷新token
router.post('/refresh', authController.refreshToken.bind(authController));

// 退出登录
router.post('/logout', authController.logout.bind(authController));

export default router;
