import typeDefs from './typeDefs'
import Dog from './Dog'

export default {
  resolvers: [Dog.resolvers],
  typeDefs: [Dog.typeDefs, baseSchema],
}
