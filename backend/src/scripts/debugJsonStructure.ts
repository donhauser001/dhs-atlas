import fs from 'fs';
import path from 'path';

// 读取JSON文件
const filePath = path.join(__dirname, '../../../date/wp_dhs_customer_contacts.json');
const fileContent = fs.readFileSync(filePath, 'utf-8');
const jsonData = JSON.parse(fileContent);

console.log('JSON数据结构:');
console.log('总长度:', jsonData.length);
console.log('类型:', typeof jsonData);

jsonData.forEach((item: any, index: number) => {
    console.log(`\n索引 ${index}:`);
    console.log('类型:', item.type);
    console.log('键:', Object.keys(item));

    if (item.data) {
        console.log('数据长度:', item.data.length);
        if (item.data.length > 0) {
            console.log('第一条数据示例:', item.data[0]);
        }
    }
}); 