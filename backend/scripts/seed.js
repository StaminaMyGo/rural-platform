/**
 * 数据库种子脚本 —— 初始化测试用户和示例建言
 * 运行: node scripts/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const User = require('../models/User')
const Article = require('../models/Article')
const Suggestion = require('../models/Suggestion')
const Comment = require('../models/Comment')

const SUGGESTIONS = [
  {
    title: '关于改善村道照明的建议',
    category: '交通',
    content: '村道照明不足，晚上出行不安全，建议增加路灯数量，改善照明条件。特别是村东头的小路，晚上几乎看不见路，老人和孩子出行很危险。希望村委会能够重视这个问题，尽快解决。',
    status: 'approved',
    likesCount: 12
  },
  {
    title: '希望加强农村垃圾处理',
    category: '环境',
    content: '村里垃圾堆积严重，建议增加垃圾收集点，定期清理，改善居住环境。目前村子里的垃圾处理设施严重不足，很多地方都有垃圾乱堆现象。',
    status: 'approved',
    likesCount: 8
  },
  {
    title: '建议增加乡村医疗服务',
    category: '医疗',
    content: '村里医疗设施简陋，希望能增加医疗设备和专业医生，方便村民看病。老年人行动不便，去镇上看病路途遥远，急需完善村级医疗条件。',
    status: 'approved',
    likesCount: 15
  },
  {
    title: '关于修缮村小学操场的建议',
    category: '教育',
    content: '村小学操场年久失修，地面凹凸不平，影响学生活动安全。建议拨付专项资金修缮操场，改善孩子们的学习和活动环境。',
    status: 'approved',
    likesCount: 20
  },
  {
    title: '希望开展农业技术培训',
    category: '其他',
    content: '很多村民对新型农业技术了解不足，希望定期举办农业技术培训班，帮助村民掌握科学种植技术，提高农业产量和收入。',
    status: 'approved',
    likesCount: 6
  },
  {
    title: '关于村庄绿化美化的建议',
    category: '环境',
    content: '建议在村主干道两侧种植行道树和花草，改善村庄环境面貌，打造美丽乡村。可以组织村民共同参与，增强大家的环保意识。',
    status: 'pending',
    likesCount: 3
  }
]

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('已连接到 MongoDB')

  // 清空旧数据
  await User.deleteMany({})
  await Article.deleteMany({})
  await Suggestion.deleteMany({})
  await Comment.deleteMany({})

  // 创建管理员用户
  const admin = await User.create({
    username: 'admin',
    password: '123456',
    role: 'admin',
    realName: '村主任',
    phone: '13800138000',
    address: '太阳村委会'
  })
  console.log('管理员用户创建成功:', admin.username)

  // 创建普通用户（用 create 逐条保存，确保 pre('save') 钩子触发、密码被加密）
  const users = []
  for (const data of [
    { username: 'zhangsan', password: '123456', realName: '张三', phone: '13811111111', address: '东村1组1号' },
    { username: 'lisi',     password: '123456', realName: '李四', phone: '13822222222', address: '西村2组3号' },
    { username: 'wangwu',   password: '123456', realName: '王五', phone: '13833333333', address: '南村3组5号' }
  ]) {
    users.push(await User.create(data))
  }
  console.log(`已创建 ${users.length} 个普通用户`)

  // 创建示例建言
  const userList = [users[0], users[1], users[2], admin, users[0], users[1]]
  for (let i = 0; i < SUGGESTIONS.length; i++) {
    const sug = SUGGESTIONS[i]
    const author = userList[i % userList.length]
    const created = await Suggestion.create({
      ...sug,
      authorId: author._id,
      authorName: author.realName || author.username
    })

    // 给已通过的建言添加官方回复
    if (sug.status === 'approved' && i < 3) {
      created.officialReply = {
        content: `感谢您的建言，村委会已收到并认真研究，将于近期安排处理，感谢您对村庄建设的关心与支持！`,
        authorId: admin._id,
        authorName: admin.realName || admin.username
      }
      await created.save()
    }

    // 添加示例评论
    if (sug.status === 'approved') {
      await Comment.insertMany([
        { suggestion: created._id, authorId: users[1]._id, authorName: users[1].realName, content: '支持这个建议！' },
        { suggestion: created._id, authorId: users[2]._id, authorName: users[2].realName, content: '我们村确实需要解决这个问题。' }
      ])
    }
  }

  console.log(`已创建 ${SUGGESTIONS.length} 条示例建言`)
  console.log('\n种子数据初始化完成！')
  console.log('管理员账号: admin / 123456')
  console.log('普通用户: zhangsan / 123456')
  process.exit(0)
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
