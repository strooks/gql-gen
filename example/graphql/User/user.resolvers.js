import User from './model'

const resolvers = {
  Query: {
    me: async (_, __, { session }) => {
      if (!session) return null
      const { email } = session.user
      return User.findOne({ email })
    },
    users: async (_, __, { session }) => {
      console.log(session)
      return User.find()
    },
    usersByRole: async (_, { role }) => {
      return User.find({ role })
    },
    userById: async (_, { _id }) => {
      return User.findOne(u => c._id === _id)
    },
    userByEmail: async (_, { email }) => {
      return User.findOne({ email })
    },
  },
  Mutation: {
    updateUser: async (_, { user }, { session }) => {
      console.log('updateUser resolver')
      const dbUser = await User.findByIdAndUpdate(user._id, { ...user })
      return true
    },
  },
  User: {
    name: user => `${user.firstName} ${user.lastName}`,
  },
}

export default resolvers
