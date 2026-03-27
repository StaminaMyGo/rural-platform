const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, '用户名不能为空'],
      unique: true,
      trim: true,
      minlength: [2, '用户名至少 2 个字符'],
      maxlength: [20, '用户名最多 20 个字符']
    },
    password: {
      type: String,
      required: [true, '密码不能为空'],
      minlength: [6, '密码至少 6 位'],
      select: false
    },
    realName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

// 保存前自动加密密码
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

module.exports = mongoose.model('User', userSchema)
