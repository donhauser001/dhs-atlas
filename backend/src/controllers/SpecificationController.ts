import { Request, Response } from 'express'
import SpecificationService from '../services/SpecificationService'

export class SpecificationController {
  /**
   * 获取规格列表
   */
  async getSpecifications(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, search, category, isDefault } = req.query

      const result = await SpecificationService.getSpecifications({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        category: category as string,
        isDefault: isDefault === 'true'
      })

      res.json({
        success: true,
        data: result.specifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          pages: Math.ceil(result.total / Number(limit))
        }
      })
    } catch (error) {
      console.error('获取规格列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取规格列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 获取规格详情
   */
  async getSpecificationById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const specification = await SpecificationService.getSpecificationById(id)
      if (!specification) {
        return res.status(404).json({
          success: false,
          message: '规格不存在'
        })
      }

      return res.json({
        success: true,
        data: specification
      })
    } catch (error) {
      console.error('获取规格详情失败:', error)
      return res.status(500).json({
        success: false,
        message: '获取规格详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 创建规格
   */
  async createSpecification(req: Request, res: Response) {
    try {
      const {
        name,
        length,
        width,
        height,
        unit,
        resolution,
        description,
        isDefault,
        category
      } = req.body

      const createdBy = req.user?.userId || 'system'

      const specification = await SpecificationService.createSpecification({
        name,
        length,
        width,
        height,
        unit,
        resolution,
        description,
        isDefault,
        category,
        createdBy
      })

      return res.status(201).json({
        success: true,
        data: specification,
        message: '规格创建成功'
      })
    } catch (error) {
      console.error('创建规格失败:', error)
      return res.status(500).json({
        success: false,
        message: '创建规格失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 更新规格
   */
  async updateSpecification(req: Request, res: Response) {
    try {
      const { id } = req.params
      const updateData = req.body
      const updatedBy = req.user?.userId || 'system'

      const specification = await SpecificationService.updateSpecification(id, {
        ...updateData,
        updatedBy
      })

      if (!specification) {
        return res.status(404).json({
          success: false,
          message: '规格不存在'
        })
      }

      return res.json({
        success: true,
        data: specification,
        message: '规格更新成功'
      })
    } catch (error) {
      console.error('更新规格失败:', error)
      return res.status(500).json({
        success: false,
        message: '更新规格失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 删除规格
   */
  async deleteSpecification(req: Request, res: Response) {
    try {
      const { id } = req.params

      await SpecificationService.deleteSpecification(id)

      return res.json({
        success: true,
        message: '规格删除成功'
      })
    } catch (error) {
      console.error('删除规格失败:', error)
      return res.status(500).json({
        success: false,
        message: '删除规格失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 获取默认规格列表
   */
  async getDefaultSpecifications(req: Request, res: Response) {
    try {
      const specifications = await SpecificationService.getDefaultSpecifications()

      return res.json({
        success: true,
        data: specifications
      })
    } catch (error) {
      console.error('获取默认规格失败:', error)
      return res.status(500).json({
        success: false,
        message: '获取默认规格失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 设置默认规格
   */
  async setDefaultSpecification(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { isDefault } = req.body
      const updatedBy = req.user?.userId || 'system'

      const specification = await SpecificationService.setDefaultSpecification(id, isDefault, updatedBy)

      if (!specification) {
        return res.status(404).json({
          success: false,
          message: '规格不存在'
        })
      }

      return res.json({
        success: true,
        data: specification,
        message: isDefault ? '规格已设为默认' : '规格已取消默认'
      })
    } catch (error) {
      console.error('设置默认规格失败:', error)
      return res.status(500).json({
        success: false,
        message: '设置默认规格失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
}