import { 
  RootRouter,
  AuthRouter
 } from './routes'
import db from './database'
import User from './models/User'
import express from 'express'
import cors from 'cors'
import 'dotenv/config'

const app = express()

app.use(
  cors({
    origin: [
      'https://id.fragmented.group',
      'http://localhost:8080',
    ],
    credentials: true,
  })
)

new db()

app.use('/', RootRouter)
app.use('/auth', AuthRouter)

app.listen(process.env.PORT, () => console.log('Listening on port', process.env.PORT))