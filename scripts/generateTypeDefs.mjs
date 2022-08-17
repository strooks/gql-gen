import fs from 'fs'
import path from 'path'

const generateTypeDefs = BASE_PATH => {
  return new Promise((resolve, reject) => {
    const typeDefFiles = []

    const ws = fs.createWriteStream(path.join(BASE_PATH, 'typeDefs.gql'))
    ws.on('close', () => resolve(typeDefFiles))
    ws.write(baseSchema)

    function parseDir(basePath) {
      const fileNames = fs.readdirSync(basePath)
      fileNames.forEach(fileName => {
        const filePath = path.join(basePath, fileName)
        if (path.extname(fileName) === '.gql') {
          if (fileName === '_base-schema.gql') return
          if (fileName === 'typeDefs.gql') return
          const relativePath = filePath.replace(BASE_PATH + '/', '')
          typeDefFiles.push(relativePath)
          ws.write('\n\n# ' + relativePath + ':\n')
          const contents = fs.readFileSync(filePath)
          ws.write(contents)
        }
        if (fs.lstatSync(filePath).isDirectory()) {
          parseDir(filePath)
        }
      })
    }

    parseDir(BASE_PATH)

    ws.close()
  })
}

export default generateTypeDefs

const baseSchema = `# Base Schema:
type Query {
  _: Boolean
}

type Mutation {
  _: Boolean
}

type Subscription {
  _: Boolean
}

`
