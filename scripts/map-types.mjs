import fs from 'fs'
import path from 'path'

const mapTypes = (BASE_PATH, typeDefFiles) => {
  const typeMap = {}
  typeDefFiles.forEach(file => {
    const fullPath = path.join(BASE_PATH, file)
    const contents = fs.readFileSync(fullPath, 'utf-8')
    contents.split('\n').forEach((line, idx, lines) => {
      if (/^type \w* {$/.test(line)) {
        let lineIndex = idx
        let nextLine = lines[++lineIndex]
        const fields = []
        const [, type] = line.match(/type (\w+)/)
        while (/\}$/.test(nextLine) === false) {
          // prettier-ignore
          const [field, fieldType] = nextLine.split(': ')
            .map(s => s.trim().replace(/\[|\]|\!/g, ''))
          // console.log('field', { field, fieldType })
          fields.push({ field, fieldType })
          nextLine = lines[++lineIndex]
        }
        typeMap[type] = fields
      }
    })
  })
  return typeMap
}

export default mapTypes
