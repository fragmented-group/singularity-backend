import mongoose, { Schema } from 'mongoose'

const UserSchema: Schema = new Schema({ 
  name: String, 
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: String,
  verificationToken: {
    type: String,
    required: true
  },
  emailVerified: Boolean,
  joinedAt: Date
})

export default mongoose.model('user', UserSchema)