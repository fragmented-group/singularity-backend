import bcrypt from 'bcrypt'
import crypto from 'crypto'
import User from '../models/User'
import 'dotenv/config'
import express, { Router } from 'express'
import { verifyEmailSuccessTemplate, sendEmailVerification, sendMail } from '../utils/Mail'
import Session from '../models/Session'

const UsersRouter = Router()
UsersRouter.use(express.json())

const usernameRegex = /^[a-z0-9]+$/i
const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

UsersRouter.route('/register').post(async (req, res) => {
  let errors = []
  if (!req.body) errors.push('No body')
  if (!req.body.username) errors.push('You must supply a username')
  if (!req.body.email) errors.push('You must supply a email')
  if (!req.body.password) errors.push('You must supply a password')
  if (!req.body.username.match(usernameRegex)) errors.push('Your username must be alphanumeric')
  if (!req.body.email.match(emailRegex)) errors.push('Your email is invalid')
  let emails = await User.find({
    email: req.body.email,
  }).exec()
  let usernames = await User.find({
    name: req.body.username,
  }).exec()
  if (usernames.length > 0) errors.push('This username is already in use')
  if (emails.length > 0) errors.push('This email is already in use')
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors
    })
  }
  const hashedPassword = bcrypt.hashSync(req.body.password, 12)
  let user = new User({
    name: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    verificationToken: crypto.randomBytes(18).toString('hex'),
    joinedAt: new Date(),
    emailVerified: false
  })
  await user.save()
  res.status(200).json({
    success: true,
    message: 'Check your email for more information.'
  })
  await sendEmailVerification(
    user,
    user.name,
    `${process.env.BASE_URL}/users/verify?token=${user.verificationToken}`
  )
})

UsersRouter.route('/verify').get(async (req, res) => {
  if (!req.query.token) return res.send('You did not provide an email verification token.')
  let user = await User.find({
    verificationToken: req.query.token,
    emailVerified: false,
  }).exec()
  if (!user[0]) return res.send('Could not find a user with that verification key. Perhaps your account is already verified?')
  user[0].emailVerified = true
  await user[0].save()
  await sendMail(
    user[0].email, 
    'Your email was successfully verified, thank you for using our service!',
    verifyEmailSuccessTemplate(user[0].name)
  )
  return res.send('Your email was successfully verified!')
})

UsersRouter.route('/login').post(async (req, res) => {
  let errors: Array<String> = []
  if (!req.body) return errors.push('Invalid body')
  if (!req.body.username) return errors.push('Invalid username')
  if (!req.body.password) return errors.push('Invalid password')
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors
    })
  }
  let user = await User.find({
    name: req.body.username,
  }).exec()
  if (!user[0]) errors.push('Invalid user')
  let comparison = bcrypt.compareSync(req.body.password, user[0].password)
  if (!comparison) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors: ['Invalid username/password'],
    })
  }
  if (!user[0].emailVerified) {
    return res.status(400).json({
      success: false,
      message: 'errors',
      errors: ['Your account isn\'t email verified, please check your email.'],
    })
  }
  const sessionToken = 'Bearer ' + crypto.randomBytes(96).toString('base64')
  let session = new Session({
    sessionString: sessionToken,
    userId: user[0]._id
  })
  await session.save()
  return res.status(200).json({
    success: true,
    message: 'Successfully logged in!',
    session: session.sessionString
  })
})


export default UsersRouter