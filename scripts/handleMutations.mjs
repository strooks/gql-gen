import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
const capitalize = ([first, ...str]) => first.toUpperCase() + str.join('')
const SCALAR_TYPES = ['Int', 'Float', 'String', 'Boolean', 'ID']

const generateMutationDeclarations = BASE_PATH => {
  const mutations = []
  const contents = fs.readFileSync(path.join(BASE_PATH, 'typeDefs.gql'), 'utf8')
  contents.split('\n').forEach((line, idx, lines) => {
    if (line.includes('extend type Mutation ')) {
      let lineIndex = idx
      let mutationLine = lines[++lineIndex]
      while (/\}$/.test(mutationLine) === false) {
        const [mutationName] = mutationLine.match(/\w+/)
        const params = mutationLine
          .match(/(\w+\:)/g)
          .map(p => p.replace(':', ''))
          .filter(p => p !== mutationName)

        let fn = `export const ${mutationName} = (`
        fn += params.length ? `{ ${params.join(', ')} })` : ')'
        fn += ` => gqlClient.request(mutation${capitalize(mutationName)}`
        fn += params.length ? `, { ${params.join(', ')} })` : `)`

        mutations.push({ mutationName, params, fn, mutationLine })
        mutationLine = lines[++lineIndex]
      }
    }
  })

  return mutations
}

const generateMutationFiles = async (BASE_PATH, typeMap, mutations) => {
  await mkdirp(path.join(BASE_PATH, 'mutations'))
  mutations.forEach(({ mutationName, params, fn, mutationLine }) => {
    const [parenthesis] = mutationLine.match(/\(.+\)/) || []
    //prettier - ignore
    let resultParenthesis = (parenthesis || '')
      .replace(/\((\w)/, (_, s) => '($' + s)
      .replace(/\,\s(\w)/g, (_, s) => ', $' + s)

    let [, returnType] = mutationLine.match(/(\w+)(\!|\]|\]\!|\!\]\!)?$/) || []

    const parseFields = (fields, deep = 0) => {
      let arr = []
      fields.forEach((f, idx) => {
        if (f.fieldType in typeMap) {
          const subFields = typeMap[f.fieldType]
          // [TODO] make this recursive so it goes deeper than 2
          // prettier-ignore
          arr.push((idx === 0 ? '' : '    ') + f.field + ` { 
      ${subFields.map(f => f.field).join('\n      ')} 
    }`)
        } else {
          arr.push((idx === 0 ? '' : '    ') + f.field)
        }
      })
      return arr.join('\n')
    }

    let template = `mutation ${mutationName}${resultParenthesis}`
    if (returnType in typeMap) {
      template += `{
  ${mutationName}${params.length ? `(${params.map(p => `${p}: $${p}`).join(', ')})` : ''} {
    ${parseFields(typeMap[returnType])}
  }
}
`
    }

    const filePath = path.join(BASE_PATH, 'mutations', mutationName + '.gql')
    fs.writeFileSync(filePath, template)
    console.log('successfully wrote mutations/', mutationName + '.gql')
  })
}

const handleMutationsFile = (BASE_PATH, mutations) => {
  let template = `import gqlClient from './client'`
  mutations.forEach(m => {
    /* prettier-ignore */
    template += `\nimport mutation${capitalize(m.mutationName)} from './mutations/${m.mutationName}.gql'`
  })

  template += '\n\n' + mutations.map(m => m.fn).join('\n') + '\n'

  fs.writeFileSync(path.join(BASE_PATH, 'mutations.js'), template)
}

const handleMutations = async (BASE_PATH, typeMap) => {
  const mutations = generateMutationDeclarations(BASE_PATH)
  await generateMutationFiles(BASE_PATH, typeMap, mutations)
  handleMutationsFile(BASE_PATH, mutations)

  return { mutations, typeMap }
}

export default handleMutations
