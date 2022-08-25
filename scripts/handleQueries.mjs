import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
const capitalize = ([first, ...str]) => first.toUpperCase() + str.join('')

const generateQueryDeclarations = BASE_PATH => {
  const queries = []
  const contents = fs.readFileSync(path.join(BASE_PATH, 'typeDefs.gql'), 'utf8')
  contents.split('\n').forEach((line, idx, lines) => {
    if (line.includes('extend type Query ')) {
      let lineIndex = idx
      let queryLine = lines[++lineIndex]
      while (/\}$/.test(queryLine) === false) {
        const [queryName] = queryLine.match(/\w+/)
        const params = queryLine
          .match(/(\w+\:)/g)
          .map(p => p.replace(':', ''))
          .filter(p => p !== queryName)

        let fn = `export const ${queryName} = (`
        fn += params.length ? `{ ${params.join(', ')} })` : ')'
        fn += ` => gqlClient.request(query${capitalize(queryName)}`
        fn += params.length ? `, { ${params.join(', ')} })` : `)`
        queries.push({ queryName, params, fn, queryLine })
        queryLine = lines[++lineIndex]
      }
    }
  })

  return queries
}

const generateQueryFiles = async (BASE_PATH, typeMap, queries) => {
  await mkdirp(path.join(BASE_PATH, 'queries'))
  queries.forEach(({ queryName, params, fn, queryLine }) => {
    const [parenthesis] = queryLine.match(/\(.+\)/) || []
    //prettier - ignore
    let resultParenthesis = (parenthesis || '')
      .replace(/\((\w)/, (_, s) => '($' + s)
      .replace(/\,\s(\w)/g, (_, s) => ', $' + s)

    let [, returnType] = queryLine.match(/(\w+)(\!|\]|\]\!|\!\]\!)?$/) || []

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

    let template = `query ${queryName}${resultParenthesis} {
  ${queryName}${params.length ? `(${params.map(p => `${p}: $${p}`).join(', ')})` : ''}`
    if (returnType in typeMap)
      template += ` {
    ${parseFields(typeMap[returnType])}
  }`
    template += `
}
`
    const filePath = path.join(BASE_PATH, 'queries', queryName + '.gql')
    fs.writeFileSync(filePath, template)
    console.log('successfully wrote queries/', queryName + '.gql')
  })
}

const handleQueriesFile = (BASE_PATH, queries) => {
  let template = `import gqlClient from './client'`
  queries.forEach(q => {
    /* prettier-ignore */
    template += `\nimport query${capitalize(q.queryName)} from './queries/${q.queryName}.gql'`
  })

  template += '\n\n' + queries.map(q => q.fn).join('\n') + '\n'

  fs.writeFileSync(path.join(BASE_PATH, 'queries.js'), template)
}

const handleQueries = async (BASE_PATH, typeMap) => {
  const queries = generateQueryDeclarations(BASE_PATH)
  await generateQueryFiles(BASE_PATH, typeMap, queries)
  handleQueriesFile(BASE_PATH, queries)

  return { queries, typeMap }
}

export default handleQueries
