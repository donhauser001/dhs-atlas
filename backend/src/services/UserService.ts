import User, {
    IUser,
    CreateUserRequest,
    UpdateUserRequest,
    UserQuery,
    ResetPasswordRequest,
    UpdateUserPermissionsRequest,
    UserType,
    IEmployeeProfile,
    IClientContactProfile,
    mapLegacyRoleToNewRoles,
    isEmployeeRole,
    isClientRole
} from '../models/User';
import bcrypt from 'bcryptjs';

// ========== 新增：客户门户相关接口 ==========
export interface ClientPortalUser {
    id: string;
    username: string;
    realName: string;
    email?: string;
    phone: string;
    clientId: string;
    clientDepartmentName?: string;
    title?: string;
    isPrimary?: boolean;
    portalRole?: 'owner' | 'member' | 'finance';
}

export interface InviteToPortalResult {
    success: boolean;
    message: string;
    temporaryPassword?: string;
}

export class UserService {
    // 获取用户列表
    async getUsers(query: UserQuery = {}): Promise<{ users: any[]; total: number }> {
        try {
            let filter: any = {};

            // 搜索过滤
            if (query.search) {
                filter.$or = [
                    { username: { $regex: query.search, $options: 'i' } },
                    { realName: { $regex: query.search, $options: 'i' } },
                    { email: { $regex: query.search, $options: 'i' } },
                    { phone: { $regex: query.search, $options: 'i' } },
                    { company: { $regex: query.search, $options: 'i' } },
                    { enterpriseName: { $regex: query.search, $options: 'i' } }
                ];
            }

            // 角色过滤
            if (query.role && query.role !== 'all') {
                filter.role = query.role;
            }

            // 状态过滤
            if (query.status && query.status !== 'all') {
                filter.status = query.status;
            }

            // 部门过滤
            if (query.department && query.department !== 'all') {
                filter.department = query.department;
            }

            // 计算总数
            const total = await User.countDocuments(filter);

            // 分页
            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;

            // 查询用户
            const users = await User.find(filter)
                .sort({ createTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // 将MongoDB的_id转换为id
            const usersWithId = users.map(user => ({
                ...user,
                id: user._id.toString()
            }));

            return { users: usersWithId, total };
        } catch (error) {
            console.error('获取用户列表失败:', error);
            throw new Error('获取用户列表失败');
        }
    }

    // 根据ID获取用户
    async getUserById(id: string): Promise<any | null> {
        try {
            const user = await User.findById(id).lean();
            if (user) {
                return {
                    ...user,
                    id: user._id.toString()
                };
            }
            return null;
        } catch (error) {
            throw new Error('获取用户详情失败');
        }
    }

    // 根据用户名获取用户
    async getUserByUsername(username: string): Promise<any | null> {
        try {
            const user = await User.findOne({ username }).lean();
            if (user) {
                return {
                    ...user,
                    id: user._id.toString()
                };
            }
            return null;
        } catch (error) {
            throw new Error('获取用户详情失败');
        }
    }

    // 创建用户
    async createUser(userData: CreateUserRequest): Promise<any> {
        try {
            // 检查用户名是否已存在
            const existingUser = await this.getUserByUsername(userData.username);
            if (existingUser) {
                throw new Error('用户名已存在');
            }

            // 检查邮箱是否已存在（只有当邮箱不为空时才检查）
            if (userData.email && userData.email.trim() !== '') {
                const existingEmail = await User.findOne({ email: userData.email });
                if (existingEmail) {
                    throw new Error('邮箱已存在');
                }
            }

            // 加密密码
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const newUser = new User({
                ...userData,
                password: hashedPassword,
                createTime: new Date().toISOString().split('T')[0],
                permissions: userData.permissions || [],
                permissionGroups: userData.permissionGroups || []
            });

            return await newUser.save();
        } catch (error) {
            // 如果错误已经有消息，直接抛出；否则抛出通用错误
            if (error instanceof Error && error.message) {
                throw error;
            }
            throw new Error('创建用户失败');
        }
    }

    // 更新用户
    async updateUser(id: string, userData: UpdateUserRequest): Promise<any | null> {
        try {
            // 如果更新用户名，检查是否与其他用户冲突
            if (userData.username) {
                const existingUser = await User.findOne({ username: userData.username, _id: { $ne: id } });
                if (existingUser) {
                    throw new Error('用户名已存在');
                }
            }

            // 处理邮箱字段
            let processedUserData: any = { ...userData };

            // 如果邮箱字段存在且为空或undefined，设置为null以清除该字段
            if (userData.hasOwnProperty('email')) {
                if (!userData.email || userData.email.trim() === '') {
                    processedUserData.email = null;
                } else {
                    // 如果邮箱不为空，检查是否与其他用户冲突
                    const existingEmail = await User.findOne({ email: userData.email, _id: { $ne: id } });
                    if (existingEmail) {
                        throw new Error('邮箱已存在');
                    }
                }
            }

            return await User.findByIdAndUpdate(id, processedUserData, { new: true, runValidators: true }).lean();
        } catch (error) {
            throw new Error('更新用户失败');
        }
    }

    // 删除用户
    async deleteUser(id: string): Promise<boolean> {
        try {
            const user = await User.findById(id);
            if (!user) {
                return false;
            }

            // 检查是否为超级管理员
            if (user.role === '超级管理员') {
                throw new Error('超级管理员不能删除');
            }

            await User.findByIdAndDelete(id);
            return true;
        } catch (error) {
            throw new Error('删除用户失败');
        }
    }

    // 重置密码
    async resetPassword(id: string, passwordData: ResetPasswordRequest): Promise<boolean> {
        try {
            const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);
            await User.findByIdAndUpdate(id, { password: hashedPassword });
            return true;
        } catch (error) {
            throw new Error('重置密码失败');
        }
    }

    // 更新用户权限
    async updateUserPermissions(id: string, permissionData: UpdateUserPermissionsRequest): Promise<any | null> {
        try {
            return await User.findByIdAndUpdate(id, {
                permissions: permissionData.permissions,
                permissionGroups: permissionData.permissionGroups
            }, { new: true }).lean();
        } catch (error) {
            throw new Error('更新用户权限失败');
        }
    }

    // 切换用户状态
    async toggleUserStatus(id: string): Promise<any | null> {
        try {
            const user = await User.findById(id);
            if (!user) {
                return null;
            }

            // 检查是否为超级管理员
            if (user.role === '超级管理员') {
                throw new Error('超级管理员状态不能修改');
            }

            const newStatus = user.status === 'active' ? 'inactive' : 'active';
            return await User.findByIdAndUpdate(id, { status: newStatus }, { new: true }).lean();
        } catch (error) {
            throw new Error('切换用户状态失败');
        }
    }

    // 获取所有用户（不分页）
    async getAllUsers(): Promise<any[]> {
        try {
            return await User.find().lean();
        } catch (error) {
            throw new Error('获取所有用户失败');
        }
    }

    // 获取员工和超级管理员用户
    async getEmployeesAndAdmins(): Promise<any[]> {
        try {
            const users = await User.find({
                role: { $in: ['员工', '超级管理员'] },
                status: 'active'
            }).lean();

            return users.map(user => ({
                ...user,
                id: user._id.toString()
            }));
        } catch (error) {
            throw new Error('获取员工和管理员失败');
        }
    }

    // 检查用户名是否存在
    async isUsernameExists(username: string): Promise<boolean> {
        try {
            const user = await User.findOne({ username });
            return !!user;
        } catch (error) {
            throw new Error('检查用户名失败');
        }
    }

    // 根据邮箱获取用户
    async getUserByEmail(email: string): Promise<any | null> {
        try {
            const user = await User.findOne({ email }).lean();
            if (user) {
                return {
                    ...user,
                    id: user._id.toString()
                };
            }
            return null;
        } catch (error) {
            throw new Error('根据邮箱获取用户失败');
        }
    }

    // 检查邮箱是否存在
    async isEmailExists(email: string): Promise<boolean> {
        try {
            const user = await User.findOne({ email });
            return !!user;
        } catch (error) {
            throw new Error('检查邮箱失败');
        }
    }

    // 更新最后登录时间
    async updateLastLogin(id: string): Promise<void> {
        try {
            await User.findByIdAndUpdate(id, {
                lastLogin: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            throw new Error('更新最后登录时间失败');
        }
    }

    // ========== 新增方法：基于新 Profile 模型 ==========

    /**
     * 获取员工列表（仅返回 userTypes 包含 'employee' 的用户）
     */
    async getEmployees(query: {
        enterpriseId?: string;
        departmentId?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<{ employees: any[]; total: number }> {
        try {
            const filter: any = {
                $or: [
                    { userTypes: 'employee' },
                    // 兼容旧数据：role 为员工类型
                    { role: { $in: ['超级管理员', '项目经理', '设计师', '员工'] } }
                ]
            };

            // 企业过滤
            if (query.enterpriseId) {
                filter.$or = [
                    { 'employeeProfile.enterpriseId': query.enterpriseId },
                    { enterpriseId: query.enterpriseId }
                ];
            }

            // 部门过滤
            if (query.departmentId) {
                filter.$or = [
                    { 'employeeProfile.departmentId': query.departmentId },
                    { departmentId: query.departmentId }
                ];
            }

            // 状态过滤
            if (query.status && query.status !== 'all') {
                filter.status = query.status;
            }

            // 搜索过滤
            if (query.search) {
                filter.$and = filter.$and || [];
                filter.$and.push({
                    $or: [
                        { username: { $regex: query.search, $options: 'i' } },
                        { realName: { $regex: query.search, $options: 'i' } },
                        { email: { $regex: query.search, $options: 'i' } },
                        { phone: { $regex: query.search, $options: 'i' } }
                    ]
                });
            }

            const total = await User.countDocuments(filter);

            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;

            const employees = await User.find(filter)
                .sort({ createTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const employeesWithId = employees.map(user => ({
                ...user,
                id: user._id.toString()
            }));

            return { employees: employeesWithId, total };
        } catch (error) {
            console.error('获取员工列表失败:', error);
            throw new Error('获取员工列表失败');
        }
    }

    /**
     * 获取客户联系人列表（仅返回 userTypes 包含 'client_contact' 的用户）
     */
    async getClientContacts(query: {
        clientId?: string;
        search?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<{ contacts: any[]; total: number }> {
        try {
            const filter: any = {
                $or: [
                    { userTypes: 'client_contact' },
                    // 兼容旧数据
                    { role: '客户' }
                ]
            };

            // 客户公司过滤
            if (query.clientId) {
                filter['clientContactProfile.clientId'] = query.clientId;
            }

            // 搜索过滤
            if (query.search) {
                filter.$and = filter.$and || [];
                filter.$and.push({
                    $or: [
                        { username: { $regex: query.search, $options: 'i' } },
                        { realName: { $regex: query.search, $options: 'i' } },
                        { email: { $regex: query.search, $options: 'i' } },
                        { phone: { $regex: query.search, $options: 'i' } },
                        { company: { $regex: query.search, $options: 'i' } }
                    ]
                });
            }

            const total = await User.countDocuments(filter);

            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;

            const contacts = await User.find(filter)
                .sort({ createTime: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const contactsWithId = contacts.map(user => ({
                ...user,
                id: user._id.toString()
            }));

            return { contacts: contactsWithId, total };
        } catch (error) {
            console.error('获取客户联系人列表失败:', error);
            throw new Error('获取客户联系人列表失败');
        }
    }

    /**
     * 根据客户ID获取该客户的所有联系人
     */
    async getContactsByClientId(clientId: string): Promise<any[]> {
        try {
            const contacts = await User.find({
                $or: [
                    { 'clientContactProfile.clientId': clientId },
                    // 兼容旧数据：通过 company 字段关联
                    { role: '客户' }
                ]
            }).lean();

            return contacts.map(user => ({
                ...user,
                id: user._id.toString()
            }));
        } catch (error) {
            console.error('根据客户ID获取联系人失败:', error);
            throw new Error('根据客户ID获取联系人失败');
        }
    }

    /**
     * 邀请客户联系人使用门户
     * - 设置临时密码
     * - 添加 client_portal 角色
     * - 更新 userTypes
     */
    async inviteClientToPortal(userId: string): Promise<InviteToPortalResult> {
        try {
            const user = await User.findById(userId);
            if (!user) {
                return { success: false, message: '用户不存在' };
            }

            // 检查是否为客户联系人
            const isClient = user.userTypes?.includes('client_contact') || user.role === '客户';
            if (!isClient) {
                return { success: false, message: '该用户不是客户联系人' };
            }

            // 检查是否已有门户权限
            if (user.roles?.includes('client_portal')) {
                return { success: false, message: '该用户已具备门户访问权限' };
            }

            // 生成临时密码
            const temporaryPassword = this.generateTemporaryPassword();
            const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

            // 更新用户
            const updateData: any = {
                password: hashedPassword,
                $addToSet: {
                    roles: 'client_portal',
                    userTypes: 'client_contact'
                }
            };

            await User.findByIdAndUpdate(userId, updateData);

            return {
                success: true,
                message: '邀请成功，已生成临时密码',
                temporaryPassword
            };
        } catch (error) {
            console.error('邀请客户使用门户失败:', error);
            throw new Error('邀请客户使用门户失败');
        }
    }

    /**
     * 撤销客户门户访问权限
     */
    async revokePortalAccess(userId: string): Promise<boolean> {
        try {
            await User.findByIdAndUpdate(userId, {
                $pull: { roles: 'client_portal' }
            });
            return true;
        } catch (error) {
            console.error('撤销门户权限失败:', error);
            throw new Error('撤销门户权限失败');
        }
    }

    /**
     * 更新员工档案
     */
    async updateEmployeeProfile(userId: string, profile: Partial<IEmployeeProfile>): Promise<any | null> {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }

            const currentProfile = user.employeeProfile || {};
            const updatedProfile = { ...currentProfile, ...profile };

            return await User.findByIdAndUpdate(
                userId,
                {
                    employeeProfile: updatedProfile,
                    $addToSet: { userTypes: 'employee' }
                },
                { new: true }
            ).lean();
        } catch (error) {
            console.error('更新员工档案失败:', error);
            throw new Error('更新员工档案失败');
        }
    }

    /**
     * 更新客户联系人档案
     */
    async updateClientContactProfile(userId: string, profile: Partial<IClientContactProfile>): Promise<any | null> {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }

            const currentProfile = user.clientContactProfile || {};
            const updatedProfile = { ...currentProfile, ...profile };

            return await User.findByIdAndUpdate(
                userId,
                {
                    clientContactProfile: updatedProfile,
                    $addToSet: { userTypes: 'client_contact' }
                },
                { new: true }
            ).lean();
        } catch (error) {
            console.error('更新客户联系人档案失败:', error);
            throw new Error('更新客户联系人档案失败');
        }
    }

    /**
     * 检查用户是否有客户门户权限
     */
    async hasPortalAccess(userId: string): Promise<boolean> {
        try {
            const user = await User.findById(userId);
            if (!user) return false;

            return !!(
                user.roles?.includes('client_portal') &&
                user.userTypes?.includes('client_contact') &&
                user.clientContactProfile?.clientId &&
                user.status === 'active'
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取门户用户信息（用于门户登录后获取用户资料）
     */
    async getPortalUserProfile(userId: string): Promise<ClientPortalUser | null> {
        try {
            const user = await User.findById(userId).lean();
            if (!user) return null;

            // 检查是否有门户权限
            if (!user.roles?.includes('client_portal')) {
                return null;
            }

            const profile = user.clientContactProfile;
            if (!profile?.clientId) {
                return null;
            }

            return {
                id: user._id.toString(),
                username: user.username,
                realName: user.realName,
                email: user.email,
                phone: user.phone,
                clientId: profile.clientId,
                clientDepartmentName: profile.clientDepartmentName,
                title: profile.title,
                isPrimary: profile.isPrimary,
                portalRole: profile.portalRole
            };
        } catch (error) {
            console.error('获取门户用户资料失败:', error);
            throw new Error('获取门户用户资料失败');
        }
    }

    /**
     * 生成临时密码
     */
    private generateTemporaryPassword(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
} 