import mongoose from 'mongoose'
import FormData from '../models/FormData'

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/donhauser')
        console.log('MongoDB 连接成功')
    } catch (error) {
        console.error('MongoDB 连接失败:', error)
        process.exit(1)
    }
}

// 检查表单提交数据
const checkFormSubmissions = async () => {
    try {
        console.log('\n=== 检查表单提交数据 ===')

        // 查找特定ID的提交数据
        const specificSubmission = await FormData.findById('68a206034b64ea6724f477cc')
        if (specificSubmission) {
            console.log('\n=== 特定提交数据（ID: 68a206034b64ea6724f477cc） ===')
            console.log(`表单ID: ${specificSubmission.formId}`)
            console.log(`表单名称: ${specificSubmission.formName}`)
            console.log(`提交者: ${specificSubmission.submitterName}`)
            console.log(`提交时间: ${specificSubmission.submittedAt}`)
            console.log(`数据ID: ${specificSubmission._id}`)

            console.log('\n--- 完整提交数据 ---')
            console.log(JSON.stringify(specificSubmission.submissionData, null, 2))

            // 重点检查任务列表相关数据
            Object.keys(specificSubmission.submissionData).forEach(key => {
                const value = specificSubmission.submissionData[key]
                console.log(`\n字段: ${key}`)
                console.log('数据类型:', typeof value)
                console.log('是否为数组:', Array.isArray(value))

                if (key.includes('任务') || key.includes('task') || key.toLowerCase().includes('task') ||
                    (Array.isArray(value) && value.length > 0 && value[0] && (value[0].任务名称 || value[0].taskName))) {
                    console.log('*** 这是任务列表数据 ***')
                    console.log('内容:', JSON.stringify(value, null, 2))
                }
            })
        } else {
            console.log('未找到ID为 68a206034b64ea6724f477cc 的提交数据')
        }

        // 获取所有提交数据，寻找任务列表相关的
        const allSubmissions = await FormData.find({})
            .sort({ submittedAt: -1 })

        console.log(`\n总共有 ${allSubmissions.length} 个提交`)

        // 查找所有可能的任务列表数据
        allSubmissions.forEach((submission, index) => {
            console.log(`\n=== 提交 ${index + 1} (${submission._id}) ===`)
            console.log(`表单名称: ${submission.formName}`)
            console.log(`提交者: ${submission.submitterName}`)
            console.log(`提交时间: ${submission.submittedAt}`)

            const data = submission.submissionData
            let foundTaskList = false

            Object.keys(data).forEach(key => {
                const value = data[key]
                // 检查是否为任务列表
                if (key.includes('任务') || key.includes('task') ||
                    (Array.isArray(value) && value.length > 0 && value[0] && (value[0].任务名称 || value[0].taskName))) {
                    console.log(`*** 发现任务列表字段: ${key} ***`)
                    console.log('数据类型:', typeof value)
                    console.log('是否为数组:', Array.isArray(value))
                    console.log('内容:', JSON.stringify(value, null, 2))
                    foundTaskList = true
                }
            })

            if (!foundTaskList) {
                // 显示所有字段名，看看是否有类似的
                console.log('所有字段:', Object.keys(data).join(', '))
            }
        })

        // 获取最新的几个提交数据
        const submissions = allSubmissions.slice(0, 3)

        console.log(`表单提交总数: ${submissions.length}`)

        if (submissions.length > 0) {
            submissions.forEach((submission, index) => {
                console.log(`\n=== 提交 ${index + 1} ===`)
                console.log(`表单ID: ${submission.formId}`)
                console.log(`表单名称: ${submission.formName}`)
                console.log(`提交者: ${submission.submitterName}`)
                console.log(`提交时间: ${submission.submittedAt}`)
                console.log(`数据ID: ${submission._id}`)

                // 重点检查任务列表数据
                if (submission.submissionData && submission.submissionData['任务列表']) {
                    console.log('\n--- 任务列表数据详情 ---')
                    const taskListData = submission.submissionData['任务列表']
                    console.log('数据类型:', typeof taskListData)
                    console.log('是否为数组:', Array.isArray(taskListData))

                    if (typeof taskListData === 'string') {
                        console.log('字符串内容:', taskListData)
                    } else if (Array.isArray(taskListData)) {
                        console.log('数组长度:', taskListData.length)
                        console.log('数组内容:', JSON.stringify(taskListData, null, 2))
                    } else {
                        console.log('其他类型数据:', JSON.stringify(taskListData, null, 2))
                    }
                } else {
                    console.log('无任务列表数据')
                }

                // 打印完整的提交数据
                console.log('\n--- 完整提交数据 ---')
                console.log(JSON.stringify(submission.submissionData, null, 2))
                console.log('='.repeat(60))
            })
        } else {
            console.log('没有找到表单提交数据')
        }

    } catch (error) {
        console.error('检查表单提交数据失败:', error)
    }
}

const main = async () => {
    await connectDB()
    await checkFormSubmissions()
    process.exit(0)
}

main()
