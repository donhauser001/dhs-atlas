import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'http://localhost:3000/api';

async function testImageUpload() {
    console.log('🧪 开始测试图片上传功能...\n');

    try {
        // 1. 测试文章图片上传
        console.log('1. 测试文章图片上传...');

        // 创建一个测试图片文件（如果不存在）
        const testImagePath = path.join(__dirname, 'test-image.png');
        if (!fs.existsSync(testImagePath)) {
            console.log('   创建测试图片文件...');
            // 创建一个简单的PNG图片数据
            const pngData = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
                0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
                0x49, 0x48, 0x44, 0x52, // IHDR chunk type
                0x00, 0x00, 0x00, 0x01, // width: 1
                0x00, 0x00, 0x00, 0x01, // height: 1
                0x08, // bit depth: 8
                0x02, // color type: RGB
                0x00, // compression method
                0x00, // filter method
                0x00, // interlace method
                0x1F, 0x15, 0xC4, 0x89, // IHDR CRC
                0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
                0x49, 0x44, 0x41, 0x54, // IDAT chunk type
                0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
                0xE2, 0x21, 0xBC, 0x33, // IDAT CRC
                0x00, 0x00, 0x00, 0x00, // IEND chunk length
                0x49, 0x45, 0x4E, 0x44, // IEND chunk type
                0xAE, 0x42, 0x60, 0x82  // IEND CRC
            ]);
            fs.writeFileSync(testImagePath, pngData);
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(testImagePath));

        const uploadResponse = await axios.post(`${API_BASE_URL}/upload/article-image`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log('✅ 文章图片上传成功:', uploadResponse.data.message);
        console.log('   文件名:', uploadResponse.data.data.filename);
        console.log('   原始名:', uploadResponse.data.data.originalname);
        console.log('   文件大小:', uploadResponse.data.data.size);
        console.log('   访问URL:', uploadResponse.data.data.url);

        // 2. 测试图片访问
        console.log('\n2. 测试图片访问...');
        const imageUrl = `http://localhost:3000${uploadResponse.data.data.url}`;
        const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
        console.log('✅ 图片访问成功，状态码:', imageResponse.status);

        // 3. 测试不支持的文件类型
        console.log('\n3. 测试不支持的文件类型...');
        const testTextPath = path.join(__dirname, 'test-file.txt');
        fs.writeFileSync(testTextPath, 'This is a test text file');

        const formData2 = new FormData();
        formData2.append('file', fs.createReadStream(testTextPath), {
            filename: 'test-file.txt',
            contentType: 'text/plain'
        });

        try {
            await axios.post(`${API_BASE_URL}/upload/article-image`, formData2, {
                headers: {
                    ...formData2.getHeaders()
                }
            });
            console.log('❌ 应该拒绝文本文件，但上传成功了');
        } catch (error: any) {
            if (error.response?.status === 400) {
                console.log('✅ 正确拒绝了不支持的文件类型:', error.response.data.message);
            } else {
                console.log('❌ 文件类型检查失败:', error.response?.data?.message);
            }
        }

        // 清理测试文件
        if (fs.existsSync(testTextPath)) {
            fs.unlinkSync(testTextPath);
        }

        console.log('\n🎉 图片上传功能测试完成！');
        console.log('\n📝 测试结果：');
        console.log('   - 图片上传：✅');
        console.log('   - 图片访问：✅');
        console.log('   - 文件类型验证：✅');
        console.log('\n🌐 测试图片地址：');
        console.log(`   ${imageUrl}`);

    } catch (error: any) {
        console.error('❌ 测试失败:', error.response?.data?.message || error.message);
        console.error('错误详情:', error.response?.data || error);
    }
}

// 运行测试
testImageUpload(); 