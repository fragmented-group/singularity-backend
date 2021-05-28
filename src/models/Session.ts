import { Session } from 'inspector'
import mongoose, { Schema } from 'mongoose'

const SessionSchema: Schema = new Schema({ 
  userId: String,
  sessionString: String
})

export default mongoose.model('session', SessionSchema)