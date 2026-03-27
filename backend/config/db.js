const mongoose = require('mongoose')

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB 连接成功: ${conn.connection.host}`)
  } catch (err) {
    console.error('MongoDB 连接失败:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
