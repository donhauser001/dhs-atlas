/**
 * 合同相关工具函数
 */

/**
 * 从文本中提取占位符
 * @param text 包含占位符的文本
 * @returns 占位符数组
 */
export const extractPlaceholdersFromText = (text: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        matches.push(match[0]); // 包含大括号的完整占位符
    }

    return [...new Set(matches)]; // 去重
};

/**
 * 替换文本中的占位符
 * @param text 包含占位符的文本
 * @param data 替换数据
 * @returns 替换后的文本
 */
export const replacePlaceholders = (text: string, data: Record<string, any>): string => {
    let result = text;

    Object.keys(data).forEach(key => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        const value = data[key];

        // 根据数据类型进行适当的格式化
        let formattedValue = '';

        if (value === null || value === undefined) {
            formattedValue = '';
        } else if (typeof value === 'object') {
            if (value instanceof Date) {
                formattedValue = formatDate(value);
            } else if (Array.isArray(value)) {
                formattedValue = value.join('、');
            } else {
                formattedValue = JSON.stringify(value);
            }
        } else {
            formattedValue = String(value);
        }

        result = result.replace(regex, formattedValue);
    });

    return result;
};

/**
 * 格式化日期
 * @param date 日期对象
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * 从表单数据中提取合同相关数据
 * @param formData 表单提交数据
 * @returns 合同数据对象
 */
export const extractContractDataFromForm = (formData: any): Record<string, any> => {
    console.log('🔍 直接使用前端格式化好的表单数据:', JSON.stringify(formData, null, 2));

    // 前端已经按照ValueFormatters格式化好了数据
    // 直接使用这些格式化好的数据作为占位符替换内容
    const contractData: Record<string, any> = { ...formData };

    // 只添加一些基础的时间信息
    contractData['当前日期'] = formatDate(new Date());
    contractData['当前年份'] = new Date().getFullYear().toString();
    contractData['提交日期'] = formatDate(new Date());

    // 设置一些默认的占位符（如果不存在的话）
    if (!contractData['收款账号']) {
        contractData['收款账号'] = '开户行：[请填写]\n户名：[请填写]\n账号：[请填写]';
    }

    if (!contractData['签章']) {
        contractData['签章'] = '甲方（盖章）：\n\n乙方（盖章）：\n\n签署日期：' + formatDate(new Date());
    }

    console.log('📋 最终的合同占位符数据:', contractData);
    return contractData;
};

/**
 * 数字转中文大写
 * @param num 数字
 * @returns 中文大写字符串
 */
export const numberToChinese = (num: number): string => {
    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '万', '亿'];

    if (num === 0) return '零元整';

    const yuan = Math.floor(num);
    const jiao = Math.floor((num - yuan) * 10);
    const fen = Math.floor((num - yuan - jiao / 10) * 100);

    let result = '人民币';

    if (yuan > 0) {
        result += convertIntegerToChinese(yuan) + '元';
    }

    if (jiao > 0) {
        result += digits[jiao] + '角';
    }

    if (fen > 0) {
        result += digits[fen] + '分';
    }

    if (jiao === 0 && fen === 0) {
        result += '整';
    }

    return result;
};

/**
 * 整数转中文
 * @param num 整数
 * @returns 中文字符串
 */
const convertIntegerToChinese = (num: number): string => {
    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];

    if (num === 0) return '零';

    const str = num.toString();
    const len = str.length;
    let result = '';
    let zeroFlag = false;

    for (let i = 0; i < len; i++) {
        const digit = parseInt(str[i]);
        const unitIndex = len - i - 1;

        if (digit === 0) {
            if (!zeroFlag && i < len - 1) {
                if (unitIndex % 4 === 0 && unitIndex > 0) {
                    result += ['', '万', '亿'][Math.floor(unitIndex / 4)];
                }
            }
            zeroFlag = true;
        } else {
            if (zeroFlag && result.length > 0) {
                result += '零';
            }
            result += digits[digit];
            if (unitIndex % 4 !== 0) {
                result += units[unitIndex % 4];
            }
            if (unitIndex % 4 === 0 && unitIndex > 0) {
                result += ['', '万', '亿'][Math.floor(unitIndex / 4)];
            }
            zeroFlag = false;
        }
    }

    return result;
};
