import bcrypt from 'bcrypt'
import bodyParser from 'body-parser'
import User from '../models/User'
import 'dotenv/config'
import express, { Router } from 'express'
import { sendEmailVerification } from '../utils/Mail'

const UsersRouter = Router()
UsersRouter
  .use(express.json())
  .use(express.urlencoded())

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
    password: hashedPassword
  })
  await user.save()
  res.status(200).json({
    success: true,
    message: 'Check your email for more information.'
  })
  await sendEmailVerification(
    user,
    user.name,
    `${process.env.BASE_URL}/auth/verify_email?k=${user.emailVerificationToken}`
  )
})


export default UsersRouter