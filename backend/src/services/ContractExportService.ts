import puppeteer from 'puppeteer';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, convertInchesToTwip } from 'docx';
import GeneratedContract from '../models/GeneratedContract';

/**
 * 合同导出服务
 * 负责生成PDF和Word格式的合同文件
 */
export class ContractExportService {
    /**
     * 导出合同为PDF
     */
    static async exportToPDF(contractId: string): Promise<Buffer> {
        // 获取合同数据
        const contract = await GeneratedContract.findById(contractId)
            .populate('templateId', 'name category');
        
        if (!contract) {
            throw new Error('合同不存在');
        }

        // 生成HTML内容
        const htmlContent = this.generatePDFHtml(contract);

        // 使用puppeteer生成PDF
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        try {
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                    top: '20mm',
                    bottom: '20mm',
                    left: '15mm',
                    right: '15mm'
                },
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: `
                    <div style="font-size: 10px; color: #999; width: 100%; text-align: center; padding: 5px 0;">
                        ${contract.contractNumber || ''}
                    </div>
                `,
                footerTemplate: `
                    <div style="font-size: 10px; color: #999; width: 100%; text-align: center; padding: 5px 0;">
                        第 <span class="pageNumber"></span> 页 / 共 <span class="totalPages"></span> 页
                    </div>
                `
            });

            return Buffer.from(pdfBuffer);
        } finally {
            await browser.close();
        }
    }

    /**
     * 导出合同为Word文档
     */
    static async exportToWord(contractId: string): Promise<Buffer> {
        // 获取合同数据
        const contract = await GeneratedContract.findById(contractId)
            .populate('templateId', 'name category');
        
        if (!contract) {
            throw new Error('合同不存在');
        }

        // 解析HTML内容为Word元素
        const sections = this.parseHtmlToWordElements(contract.content || '');

        // 创建Word文档
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1),
                            right: convertInchesToTwip(1)
                        }
                    }
                },
                children: [
                    // 合同标题
                    new Paragraph({
                        text: contract.name,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    // 合同编号
                    ...(contract.contractNumber ? [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `合同编号：${contract.contractNumber}`,
                                    size: 20,
                                    color: '666666'
                                })
                            ],
                            alignment: AlignmentType.RIGHT,
                            spacing: { after: 400 }
                        })
                    ] : []),
                    // 合同内容
                    ...sections
                ]
            }]
        });

        // 生成Word文件
        const buffer = await Packer.toBuffer(doc);
        return buffer;
    }

    /**
     * 生成PDF用的HTML
     */
    private static generatePDFHtml(contract: any): string {
        const templateName = typeof contract.templateId === 'object' 
            ? contract.templateId.name 
            : '';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${contract.name}</title>
                <style>
                    body {
                        font-family: "SimSun", "宋体", serif;
                        font-size: 14px;
                        line-height: 1.8;
                        color: #333;
                        padding: 20px;
                    }
                    h1 {
                        text-align: center;
                        font-size: 24px;
                        margin-bottom: 30px;
                    }
                    .contract-number {
                        text-align: right;
                        color: #666;
                        font-size: 12px;
                        margin-bottom: 20px;
                    }
                    .contract-content {
                        text-align: justify;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    table th,
                    table td {
                        border: 1px solid #ddd;
                        padding: 8px 12px;
                        text-align: left;
                    }
                    table th {
                        background-color: #f5f5f5;
                        font-weight: bold;
                    }
                    p {
                        margin: 10px 0;
                        text-indent: 2em;
                    }
                    .signature-area {
                        margin-top: 50px;
                    }
                </style>
            </head>
            <body>
                <h1>${contract.name}</h1>
                ${contract.contractNumber ? `<div class="contract-number">合同编号：${contract.contractNumber}</div>` : ''}
                <div class="contract-content">
                    ${contract.content || ''}
                </div>
            </body>
            </html>
        `;
    }

    /**
     * 将HTML内容解析为Word元素
     * 简化版解析器，处理基本的HTML结构
     */
    private static parseHtmlToWordElements(htmlContent: string): Paragraph[] {
        const elements: Paragraph[] = [];
        
        // 移除HTML标签，保留文本
        // 这是一个简化的实现，复杂的HTML需要更完善的解析器
        
        // 处理段落
        const paragraphs = htmlContent
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .split(/\n\n+/)
            .filter(p => p.trim());

        for (const para of paragraphs) {
            const lines = para.split('\n').filter(l => l.trim());
            
            for (const line of lines) {
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: line.trim(),
                                size: 24 // 12pt
                            })
                        ],
                        spacing: { after: 200 }
                    })
                );
            }
        }

        return elements;
    }

    /**
     * 获取合同文件名
     */
    static getFileName(contract: any, extension: string): string {
        const name = contract.name || '合同';
        const number = contract.contractNumber ? `_${contract.contractNumber}` : '';
        const date = new Date().toISOString().split('T')[0];
        
        // 清理文件名中的非法字符
        const cleanName = name.replace(/[\\/:*?"<>|]/g, '_');
        
        return `${cleanName}${number}_${date}.${extension}`;
    }
}

