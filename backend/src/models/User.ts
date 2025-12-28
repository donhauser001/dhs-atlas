import mongoose, { Schema, Document } from 'mongoose'

// ========== 新增：员工档案子文档接口 ==========
export interface IEmployeeProfile {
    enterpriseId?: string;
    departmentId?: string;
    position?: string;
    employeeNo?: string;
    onboardDate?: Date;
    status: 'active' | 'left' | 'suspended';
}

// ========== 新增：客户联系人档案子文档接口 ==========
export interface IClientContactProfile {
    clientId?: string;
    clientDepartmentName?: string;  // 对方公司部门（纯文本，不关联内部部门表）
    title?: string;                  // 职位
    isPrimary?: boolean;             // 是否主要联系人
    portalRole?: 'owner' | 'member' | 'finance';  // 门户角色
}

// ========== 用户类型枚举 ==========
export type UserType = 'employee' | 'client_contact';

// ========== 角色类型（新） ==========
export type UserRole = 'owner' | 'admin' | 'designer' | 'pm' | 'finance' | 'client_portal' | 'viewer';

// ========== 旧角色类型（兼容） ==========
export type LegacyRole = '超级管理员' | '项目经理' | '设计师' | '客户' | '员工';

export interface IUser extends Document {
    username: string;
    password?: string;
    email: string;
    phone: string;
    realName: string;
    avatarUrl?: string;

    // ========== 新增字段 ==========
    userTypes: UserType[];           // 用户类型标记
    roles: string[];                  // 新角色数组
    employeeProfile?: IEmployeeProfile;       // 员工档案
    clientContactProfile?: IClientContactProfile;  // 客户联系人档案

    // ========== 旧字段（@deprecated，保留兼容） ==========
    /** @deprecated 使用 roles 替代 */
    role: LegacyRole;
    /** @deprecated 使用 employeeProfile.departmentId 替代 */
    department: string;
    status: 'active' | 'inactive';
    createTime: string;
    lastLogin?: string;
    /** @deprecated 使用 employeeProfile.enterpriseId 替代 */
    enterpriseId?: string;
    /** @deprecated */
    enterpriseName?: string;
    /** @deprecated 使用 employeeProfile.departmentId 替代 */
    departmentId?: string;
    /** @deprecated */
    departmentName?: string;
    /** @deprecated 使用 employeeProfile.position 替代 */
    position?: string;
    /** @deprecated 使用 clientContactProfile.clientId 替代 */
    company?: string;
    /** @deprecated */
    contactPerson?: string;
    /** @deprecated */
    address?: string;
    /** @deprecated */
    shippingMethod?: string;
    description?: string;
    permissions?: string[];
    permissionGroups?: string[];
}

// ========== 员工档案 Schema ==========
const EmployeeProfileSchema = new Schema<IEmployeeProfile>({
    enterpriseId: {
        type: String,
        index: true
    },
    departmentId: {
        type: String,
        index: true
    },
    position: {
        type: String,
        trim: true
    },
    employeeNo: {
        type: String,
        trim: true
    },
    onboardDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'left', 'suspended'],
        default: 'active'
    }
}, { _id: false });

// ========== 客户联系人档案 Schema ==========
const ClientContactProfileSchema = new Schema<IClientContactProfile>({
    clientId: {
        type: String,
        index: true
    },
    clientDepartmentName: {
        type: String,
        trim: true
    },
    title: {
        type: String,
        trim: true
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    portalRole: {
        type: String,
        enum: ['owner', 'member', 'finance'],
        default: 'member'
    }
}, { _id: false });

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        trim: true,
        index: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    realName: {
        type: String,
        required: true,
        trim: true
    },
    avatarUrl: {
        type: String,
        trim: true
    },

    // ========== 新增字段 ==========
    userTypes: [{
        type: String,
        enum: ['employee', 'client_contact']
    }],
    roles: [{
        type: String,
        index: true
    }],
    employeeProfile: {
        type: EmployeeProfileSchema
    },
    clientContactProfile: {
        type: ClientContactProfileSchema
    },

    // ========== 旧字段（保留兼容） ==========
    role: {
        type: String,
        required: true,
        enum: ['超级管理员', '项目经理', '设计师', '客户', '员工'],
        index: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        index: true
    },
    createTime: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    },
    lastLogin: {
        type: String
    },
    enterpriseId: {
        type: String
    },
    enterpriseName: {
        type: String,
        trim: true
    },
    departmentId: {
        type: String
    },
    departmentName: {
        type: String,
        trim: true
    },
    position: {
        type: String,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    contactPerson: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    shippingMethod: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    permissions: [{
        type: String
    }],
    permissionGroups: [{
        type: String
    }]
}, {
    timestamps: true
})

// ========== 索引 ==========
UserSchema.index({ 'employeeProfile.enterpriseId': 1 });
UserSchema.index({ 'employeeProfile.departmentId': 1 });
UserSchema.index({ 'clientContactProfile.clientId': 1 });
UserSchema.index({ userTypes: 1 });

export default mongoose.model<IUser>('User', UserSchema)

// ========== 类型导出 ==========
export interface User {
    id: string;
    username: string;
    password?: string;
    email: string;
    phone: string;
    realName: string;
    avatarUrl?: string;

    // 新字段
    userTypes?: UserType[];
    roles?: string[];
    employeeProfile?: IEmployeeProfile;
    clientContactProfile?: IClientContactProfile;

    // 旧字段（兼容）
    role: LegacyRole;
    department: string;
    status: 'active' | 'inactive';
    createTime: string;
    lastLogin?: string;
    enterpriseId?: string;
    enterpriseName?: string;
    departmentId?: string;
    departmentName?: string;
    position?: string;
    company?: string;
    contactPerson?: string;
    address?: string;
    shippingMethod?: string;
    description?: string;
    permissions?: string[];
    permissionGroups?: string[];
}

export interface CreateUserRequest {
    username: string;
    password: string;
    email: string;
    phone: string;
    realName: string;
    avatarUrl?: string;

    // 新字段
    userTypes?: UserType[];
    roles?: string[];
    employeeProfile?: IEmployeeProfile;
    clientContactProfile?: IClientContactProfile;

    // 旧字段（兼容）
    role: LegacyRole;
    department: string;
    status: 'active' | 'inactive';
    enterpriseId?: string;
    enterpriseName?: string;
    departmentId?: string;
    departmentName?: string;
    position?: string;
    company?: string;
    contactPerson?: string;
    address?: string;
    shippingMethod?: string;
    description?: string;
    permissions?: string[];
    permissionGroups?: string[];
}

export interface UpdateUserRequest {
    username?: string;
    email?: string;
    phone?: string;
    realName?: string;
    avatarUrl?: string;

    // 新字段
    userTypes?: UserType[];
    roles?: string[];
    employeeProfile?: Partial<IEmployeeProfile>;
    clientContactProfile?: Partial<IClientContactProfile>;

    // 旧字段（兼容）
    role?: LegacyRole;
    department?: string;
    status?: 'active' | 'inactive';
    enterpriseId?: string;
    enterpriseName?: string;
    departmentId?: string;
    departmentName?: string;
    position?: string;
    company?: string;
    contactPerson?: string;
    address?: string;
    shippingMethod?: string;
    description?: string;
    permissions?: string[];
    permissionGroups?: string[];
}

export interface UserQuery {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: 'active' | 'inactive' | 'all';
    department?: string;
    // 新增查询条件
    userType?: UserType;
    clientId?: string;
    enterpriseId?: string;
}

export interface ResetPasswordRequest {
    newPassword: string;
}

export interface UpdateUserPermissionsRequest {
    permissions: string[];
    permissionGroups: string[];
}

// ========== 工具函数：旧角色到新角色的映射 ==========
export function mapLegacyRoleToNewRoles(legacyRole: LegacyRole): string[] {
    const mapping: Record<LegacyRole, string[]> = {
        '超级管理员': ['owner', 'admin'],
        '项目经理': ['pm'],
        '设计师': ['designer'],
        '员工': ['designer'],
        '客户': ['client_portal']
    };
    return mapping[legacyRole] || [];
}

// ========== 工具函数：判断是否为员工角色 ==========
export function isEmployeeRole(legacyRole: LegacyRole): boolean {
    return ['超级管理员', '项目经理', '设计师', '员工'].includes(legacyRole);
}

// ========== 工具函数：判断是否为客户角色 ==========
export function isClientRole(legacyRole: LegacyRole): boolean {
    return legacyRole === '客户';
}
