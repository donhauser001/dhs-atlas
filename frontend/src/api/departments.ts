import axios from 'axios';

// 部门接口
export interface Department {
  _id: string;
  name: string;
  code: string;
  enterpriseId: string;
  enterpriseName?: string;
  parentId?: string;
  parentName?: string;
  manager?: string;
  managerName?: string;
  description?: string;
  status: 'active' | 'inactive';
  order?: number;
  createTime: string;
  updateTime: string;
}

// 部门树节点
export interface DepartmentTreeNode extends Department {
  children?: DepartmentTreeNode[];
}

// 部门查询参数
export interface DepartmentQueryParams {
  enterpriseId?: string;
  status?: string;
  search?: string;
}

// 创建部门数据
export interface CreateDepartmentData {
  name: string;
  code: string;
  enterpriseId: string;
  parentId?: string;
  manager?: string;
  description?: string;
  order?: number;
}

// 更新部门数据
export interface UpdateDepartmentData {
  name?: string;
  code?: string;
  parentId?: string;
  manager?: string;
  description?: string;
  order?: number;
  status?: 'active' | 'inactive';
}

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * 获取部门列表
 */
export const getDepartments = async (
  params: DepartmentQueryParams = {}
): Promise<{ success: boolean; data: Department[] }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/departments`, { params });
    return response.data;
  } catch (error) {
    console.error('获取部门列表失败:', error);
    throw error;
  }
};

/**
 * 根据ID获取部门
 */
export const getDepartmentById = async (
  id: string
): Promise<{ success: boolean; data: Department }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/departments/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取部门详情失败:', error);
    throw error;
  }
};

/**
 * 创建部门
 */
export const createDepartment = async (
  data: CreateDepartmentData
): Promise<{ success: boolean; data: Department }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/departments`, data);
    return response.data;
  } catch (error) {
    console.error('创建部门失败:', error);
    throw error;
  }
};

/**
 * 更新部门
 */
export const updateDepartment = async (
  id: string,
  data: UpdateDepartmentData
): Promise<{ success: boolean; data: Department }> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/departments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('更新部门失败:', error);
    throw error;
  }
};

/**
 * 删除部门
 */
export const deleteDepartment = async (
  id: string
): Promise<{ success: boolean }> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/departments/${id}`);
    return response.data;
  } catch (error) {
    console.error('删除部门失败:', error);
    throw error;
  }
};

/**
 * 获取上级部门选项
 */
export const getParentDepartmentOptions = async (
  enterpriseId: string
): Promise<{ success: boolean; data: Department[] }> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/departments/parent-options/${enterpriseId}`
    );
    return response.data;
  } catch (error) {
    console.error('获取上级部门选项失败:', error);
    throw error;
  }
};

/**
 * 切换部门状态
 */
export const toggleDepartmentStatus = async (
  id: string
): Promise<{ success: boolean; data: Department }> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/departments/${id}/toggle-status`
    );
    return response.data;
  } catch (error) {
    console.error('切换部门状态失败:', error);
    throw error;
  }
};
