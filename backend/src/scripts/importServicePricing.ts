import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import ServicePricing from '../models/ServicePricing';

// 连接数据库
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://donhauser-mongodb:27017/donhauser');
        console.log('数据库连接成功');
    } catch (error) {
        console.error('数据库连接失败:', error);
        process.exit(1);
    }
};

// 定义服务数据接口
interface ServiceData {
    id: string;
    name: string;
    alias: string;
    category_id: string;
    price: string;
    unit: string;
    description: string;
    link: string;
    policy: string | null;
    performance_ratio: string;
    auxiliary_performance_ratio: string;
    progress: string;
    initial_proposal_count: string;
    max_proposal_count: string;
    disable_subtasks: string;
}

// 解析流程数据
const parseProgressSteps = (progressStr: string) => {
    try {
        // 处理可能的JSON格式问题
        const cleanStr = progressStr.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
        const steps = JSON.parse(cleanStr);
        return steps;
    } catch (error) {
        console.warn('无法解析流程数据:', progressStr);
        return [];
    }
};

// 映射分类ID到分类名称
const getCategoryName = (categoryId: string): string => {
    const categories: Record<string, string> = {
        '1': '封面设计',
        '2': '版式设计',
        '3': '营销物料',
        '4': '排版服务',
        '5': '配套设计',
        '6': '杂志设计'
    };
    return categories[categoryId] || `分类${categoryId}`;
};

// 导入服务定价数据
const importServicePricing = async () => {
    try {
        console.log('开始导入服务定价数据...');

        // 读取服务数据文件
        const servicesPath = path.join(process.cwd(), 'date/wp_dhs_quote_services.json');
        const servicesData = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));

        // 提取实际的服务数据
        const services: ServiceData[] = servicesData.find((item: any) => item.type === 'table')?.data || [];
        console.log('找到服务数据:', services.length, '条');

        let successCount = 0;
        let errorCount = 0;

        for (const service of services) {
            try {
                // 检查服务是否已存在
                const existingService = await ServicePricing.findOne({
                    $or: [
                        { serviceName: service.name },
                        { alias: service.alias }
                    ]
                });

                if (existingService) {
                    console.log(`服务已存在，跳过: ${service.name}`);
                    continue;
                }

                // 解析流程步骤
                const progressSteps = parseProgressSteps(service.progress);

                // 创建新服务定价
                const newService = new ServicePricing({
                    serviceName: service.name,
                    alias: service.alias,
                    categoryId: service.category_id,
                    categoryName: getCategoryName(service.category_id),
                    unitPrice: parseFloat(service.price) || 0,
                    unit: service.unit,
                    priceDescription: service.description || '',
                    link: service.link || '',
                    status: 'active'
                });

                await newService.save();
                successCount++;
                console.log(`✅ 成功导入服务: ${service.name} (${service.alias}) - ¥${service.price}/${service.unit}`);

            } catch (error) {
                errorCount++;
                console.error(`❌ 导入服务失败: ${service.name}`, error);
            }
        }

        console.log(`服务定价数据导入完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);

    } catch (error) {
        console.error('导入服务数据失败:', error);
        throw error;
    }
};

// 主函数
const main = async () => {
    try {
        await connectDB();
        await importServicePricing();
        console.log('🎉 服务定价数据导入完成！');
    } catch (error) {
        console.error('导入过程中发生错误:', error);
    } finally {
        await mongoose.disconnect();
        console.log('数据库连接已关闭');
    }
};

main();