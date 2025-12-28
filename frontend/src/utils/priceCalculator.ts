/**
 * 价格计算工具
 * 从OrderTab中提取的价格计算逻辑，用于生成详细的价格说明
 */

export interface PriceCalculationResult {
    originalPrice: number;
    discountedPrice: number;
    discountAmount: number;
    calculationDetails: string;
}

export interface ServiceForCalculation {
    unitPrice: number;
    quantity: number;
    unit: string;
    priceDescription?: string;
    selectedPricingPolicies?: string[];
    pricingPolicyIds?: string[];
    pricingPolicyNames?: string[];
}

export interface PricingPolicy {
    _id: string;
    name: string;
    alias?: string;
    type: 'uniform_discount' | 'tiered_discount';
    status: 'active' | 'inactive';
    discountRatio?: number;
    tierSettings?: Array<{
        startQuantity?: number;
        endQuantity?: number;
        discountRatio: number;
    }>;
}

/**
 * 计算服务价格和生成详细的计算说明
 * @param service 服务信息
 * @param pricingPolicies 可用的价格政策列表
 * @returns 价格计算结果
 */
export const calculateServicePrice = (
    service: ServiceForCalculation,
    pricingPolicies: PricingPolicy[] = []
): PriceCalculationResult => {
    const originalPrice = service.unitPrice * service.quantity;

    // 如果没有选择定价政策，返回原价
    if (!service.selectedPricingPolicies || service.selectedPricingPolicies.length === 0) {
        return {
            originalPrice,
            discountedPrice: originalPrice,
            discountAmount: 0,
            calculationDetails: service.priceDescription || `按${service.unit}计费`
        };
    }

    // 获取选中的定价政策
    let selectedPolicy: PricingPolicy | null = null;

    if (service.selectedPricingPolicies && service.selectedPricingPolicies.length > 0) {
        const selectedPolicyId = service.selectedPricingPolicies[0];

        // 首先尝试从pricingPolicies中通过ID查找
        selectedPolicy = pricingPolicies.find(p => p._id === selectedPolicyId) || null;

        // 如果从pricingPolicies中找不到，或者找到的政策名称不匹配，则从服务数据中获取
        if (service.pricingPolicyIds && service.pricingPolicyNames) {
            const selectedIndex = service.pricingPolicyIds.indexOf(selectedPolicyId);
            if (selectedIndex !== -1) {
                const expectedPolicyName = service.pricingPolicyNames[selectedIndex];

                // 检查找到的政策名称是否匹配
                if (selectedPolicy && selectedPolicy.name !== expectedPolicyName && selectedPolicy.alias !== expectedPolicyName) {
                    // 通过名称重新查找正确的政策
                    selectedPolicy = pricingPolicies.find(p => p.name === expectedPolicyName || p.alias === expectedPolicyName) || null;
                }
            }
        }
    }

    if (!selectedPolicy || selectedPolicy.status !== 'active') {
        return {
            originalPrice,
            discountedPrice: originalPrice,
            discountAmount: 0,
            calculationDetails: service.priceDescription || `按${service.unit}计费`
        };
    }

    let discountedPrice = originalPrice;
    let calculationDetails = '';

    if (selectedPolicy.type === 'uniform_discount') {
        // 统一折扣
        const discountRatio = selectedPolicy.discountRatio || 100;
        discountedPrice = (originalPrice * discountRatio) / 100;
        const discountAmount = originalPrice - discountedPrice;
        
        calculationDetails = `${service.priceDescription || `按${service.unit}计费`}\n\n优惠说明:\n统一按照${discountRatio}%计费\n小计:￥${service.unitPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×${service.quantity}${service.unit}×${discountRatio}%=￥${discountedPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n优惠：￥${discountAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (selectedPolicy.type === 'tiered_discount' && selectedPolicy.tierSettings) {
        // 阶梯折扣
        const unitPrice = service.unitPrice;
        let totalDiscountedPrice = 0;
        const tierDetails: string[] = [];

        const sortedTiers = [...selectedPolicy.tierSettings].sort((a, b) => (a.startQuantity || 0) - (b.startQuantity || 0));
        let remainingQuantity = service.quantity;

        for (const tier of sortedTiers) {
            if (remainingQuantity <= 0) break;

            const startQuantity = tier.startQuantity || 0;
            const endQuantity = tier.endQuantity || Infinity;
            const discountRatio = tier.discountRatio || 100;

            let tierQuantity = 0;
            if (endQuantity === Infinity) {
                tierQuantity = remainingQuantity;
            } else {
                const tierCapacity = endQuantity - startQuantity + 1;
                tierQuantity = Math.min(remainingQuantity, tierCapacity);
            }

            if (tierQuantity > 0) {
                const tierPrice = unitPrice * tierQuantity;
                const tierDiscountedPrice = (tierPrice * discountRatio) / 100;
                totalDiscountedPrice += tierDiscountedPrice;

                let tierRange = '';
                if (startQuantity === endQuantity) {
                    tierRange = `第${startQuantity}${service.unit}`;
                } else if (endQuantity === Infinity) {
                    tierRange = `${startQuantity}${service.unit}及以上`;
                } else {
                    tierRange = `第${startQuantity}-${endQuantity}${service.unit}`;
                }

                // 生成详细的计算公式
                const tierDetail = `${tierRange}：￥${unitPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × ${tierQuantity}${service.unit} × ${discountRatio}% = ￥${tierDiscountedPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                tierDetails.push(tierDetail);
                remainingQuantity -= tierQuantity;
            }
        }

        discountedPrice = totalDiscountedPrice;

        // 生成优惠说明
        let discountDescription = '';
        for (let i = 0; i < sortedTiers.length; i++) {
            const tier = sortedTiers[i];
            const startQuantity = tier.startQuantity || 0;
            const endQuantity = tier.endQuantity || Infinity;
            const discountRatio = tier.discountRatio || 100;

            if (i > 0) discountDescription += '，';

            if (startQuantity === endQuantity) {
                discountDescription += `第${startQuantity}${service.unit}按${discountRatio}%计费`;
            } else if (endQuantity === Infinity) {
                discountDescription += `${startQuantity}${service.unit}及以上按${discountRatio}%计费`;
            } else {
                discountDescription += `第${startQuantity}-${endQuantity}${service.unit}按${discountRatio}%计费`;
            }
        }

        calculationDetails = `${service.priceDescription || `按${service.unit}计费`}\n\n优惠说明:\n${discountDescription}\n${tierDetails.join('\n')}\n\n小计：${tierDetails.map(detail => detail.split(' = ')[1]).join('+')}=￥${totalDiscountedPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n优惠：￥${(originalPrice - totalDiscountedPrice).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const discountAmount = originalPrice - discountedPrice;

    return {
        originalPrice,
        discountedPrice,
        discountAmount,
        calculationDetails
    };
};
