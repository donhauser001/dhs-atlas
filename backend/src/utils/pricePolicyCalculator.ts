/**
 * 价格政策计算工具 - 后端版本
 * 与前端 PricePolicyCalculator 保持一致的计算逻辑
 */

export interface PriceCalculationResult {
    originalPrice: number
    discountedPrice: number
    discountAmount: number
    discountRatio: number
    appliedPolicy: any | null
    calculationDetails: string
}

/**
 * 计算价格政策折扣
 * @param originalPrice 原价
 * @param quantity 数量
 * @param policies 可用的价格政策列表
 * @param selectedPolicyIds 选中的政策ID列表（通常只包含一个ID）
 * @param unit 单位（如"天"、"个"、"次"等）
 * @returns 计算结果
 */
export const calculatePriceWithPolicies = (
    originalPrice: number,
    quantity: number,
    policies: any[],
    selectedPolicyIds: string[],
    unit: string = '件'
): PriceCalculationResult => {
    let bestResult: PriceCalculationResult | null = null

    // 如果没有选择任何政策，返回原价
    if (selectedPolicyIds.length === 0) {
        return {
            originalPrice,
            discountedPrice: originalPrice,
            discountAmount: 0,
            discountRatio: 0,
            appliedPolicy: null,
            calculationDetails: '未应用价格政策'
        }
    }

    // 遍历所有选中的政策，找到最佳折扣
    for (const policyId of selectedPolicyIds) {
        const policy = policies.find(p => p._id === policyId)
        if (!policy || policy.status !== 'active') {
            continue
        }

        let currentResult: PriceCalculationResult

        if (policy.type === 'uniform_discount') {
            // 统一折扣 - discountRatio 是计费比例
            let discountRatio = policy.discountRatio || 0

            // 如果 discountRatio 是小数形式（如 0.85），转换为百分比形式（如 85）
            if (discountRatio <= 1 && discountRatio > 0) {
                discountRatio = discountRatio * 100
            }

            const discountedPrice = (originalPrice * discountRatio) / 100
            const discountAmount = originalPrice - discountedPrice

            // 构建完整的计算详情
            const fullCalculationDetails = `计费方式:\n按${discountRatio}%计费\n\n原价: ¥${originalPrice.toLocaleString()}\n优惠金额: ¥${discountAmount.toLocaleString()}\n最终价格: ¥${discountedPrice.toLocaleString()}`

            currentResult = {
                originalPrice,
                discountedPrice,
                discountAmount,
                discountRatio,
                appliedPolicy: policy,
                calculationDetails: fullCalculationDetails
            }
        } else if (policy.type === 'tiered_discount' && policy.tierSettings) {
            // 阶梯折扣 - 分段计算
            currentResult = calculateTieredDiscount(originalPrice, quantity, policy, unit)
        } else {
            continue
        }

        // 如果这个政策的折扣更好（即最终价格更低），更新最佳折扣
        if (!bestResult || currentResult.discountedPrice < bestResult.discountedPrice) {
            bestResult = currentResult
        }
    }

    return bestResult || {
        originalPrice,
        discountedPrice: originalPrice,
        discountAmount: 0,
        discountRatio: 0,
        appliedPolicy: null,
        calculationDetails: '未找到适用的价格政策'
    }
}

/**
 * 计算阶梯折扣价格（分段计算）
 * @param originalPrice 原价
 * @param quantity 数量
 * @param policy 价格政策
 * @param unit 单位
 * @returns 计算结果
 */
const calculateTieredDiscount = (
    originalPrice: number,
    quantity: number,
    policy: any,
    unit: string = '件'
): PriceCalculationResult => {
    if (!policy.tierSettings || policy.tierSettings.length === 0) {
        return {
            originalPrice,
            discountedPrice: originalPrice,
            discountAmount: 0,
            discountRatio: 0,
            appliedPolicy: policy,
            calculationDetails: '阶梯设置无效'
        }
    }

    const unitPrice = originalPrice / quantity // 单价
    let totalDiscountedPrice = 0
    let calculationDetails = ''
    let totalDiscountRatio = 0

    // 按阶梯设置排序
    const sortedTiers = [...policy.tierSettings].sort((a: any, b: any) => (a.startQuantity || 0) - (b.startQuantity || 0))

    let remainingQuantity = quantity // 剩余需要计算的数量

    for (let i = 0; i < sortedTiers.length; i++) {
        const tier = sortedTiers[i]
        const startQuantity = tier.startQuantity || 0
        const endQuantity = tier.endQuantity || Infinity
        const discountRatio = tier.discountRatio || 0

        if (remainingQuantity <= 0) break // 如果没有剩余数量，则停止计算

        // 计算当前阶梯适用的数量
        let tierQuantityApplicable = 0
        if (endQuantity === Infinity) {
            // 最后一个阶梯（无上限）
            tierQuantityApplicable = remainingQuantity
        } else {
            // 有上限的阶梯
            const tierCapacity = endQuantity - startQuantity + 1
            tierQuantityApplicable = Math.min(remainingQuantity, tierCapacity)
        }

        // Ensure tierQuantityApplicable is not negative
        tierQuantityApplicable = Math.max(0, tierQuantityApplicable)

        if (tierQuantityApplicable > 0) {
            const tierPrice = unitPrice * tierQuantityApplicable
            const tierDiscountedPrice = (tierPrice * discountRatio) / 100
            totalDiscountedPrice += tierDiscountedPrice

            // 构建计算详情
            let tierRange = ''
            if (startQuantity === endQuantity) {
                tierRange = `第${startQuantity}${unit}`
            } else if (endQuantity === Infinity) {
                tierRange = `${startQuantity}${unit}以上`
            } else {
                tierRange = `第${startQuantity}-${endQuantity}${unit}`
            }
            calculationDetails += `${tierRange}按${discountRatio}%计费: ¥${tierDiscountedPrice.toLocaleString()}\n`
            remainingQuantity -= tierQuantityApplicable // 更新剩余数量
        }
    }

    const discountAmount = originalPrice - totalDiscountedPrice
    totalDiscountRatio = ((originalPrice - totalDiscountedPrice) / originalPrice) * 100

    // 构建完整的计算详情，包含汇总信息
    const fullCalculationDetails = `计费方式:\n${calculationDetails.trim()}\n\n原价: ¥${originalPrice.toLocaleString()}\n优惠金额: ¥${discountAmount.toLocaleString()}\n最终价格: ¥${totalDiscountedPrice.toLocaleString()}`

    return {
        originalPrice,
        discountedPrice: totalDiscountedPrice,
        discountAmount,
        discountRatio: 100 - totalDiscountRatio, // 计费比例
        appliedPolicy: policy,
        calculationDetails: fullCalculationDetails
    }
}