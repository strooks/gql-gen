import mongoose from '../db'

const User =
  mongoose.models.User ||
  mongoose.model(
    'User',
    new mongoose.Schema(
      {
        firstName: {
          type: String,
          required: true,
        },
        lastName: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ['Founder', 'Stakeholder', 'Investor', 'Admin', 'God'],
          required: true,
        },
        image: {
          type: String,
        },
        email: {
          type: String,
          unique: true,
        },
        password: {
          type: String,
          required: true,
        },
        active: {
          type: Boolean,
          default: true,
        },
        verified: {
          type: Boolean,
          default: false,
        },
        verificationCode: String,
      },
      {
        timestamps: true,
      }
    )
  )

export default User
