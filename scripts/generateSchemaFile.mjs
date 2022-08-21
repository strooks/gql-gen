import fs from 'fs'
import path from 'path'

const generateSchemaFile = BASE_PATH => {
  const imports = []
  const resolvers = []

  function parseDir(basePath) {
    const fileNames = fs.readdirSync(basePath)
    fileNames.forEach(fileName => {
      const filePath = path.join(basePath, fileName)
      if (fileName.endsWith('.resolvers.js')) {
        const constName = fileName.replace('.resolvers.js', 'Resolvers')
        imports.push(`import ${constName} from '${`${filePath.replace(BASE_PATH, '.')}`}'`)
        resolvers.push(constName)
      }
      if (fs.lstatSync(filePath).isDirectory()) {
        parseDir(filePath)
      }
    })
  }
  parseDir(BASE_PATH)

  const template = `// auto-generated
import typeDefs from './typeDefs.gql'
${imports.join('\n')}

const schema = {
  resolvers: [
    ${resolvers.join(',\n    ')}
  ],
  typeDefs,
}

export default schema
`

  fs.writeFileSync(path.join(BASE_PATH, 'schema.js'), template, 'utf-8')
}

export default generateSchemaFile
