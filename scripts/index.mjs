import fs from 'fs'
import path from 'path'
import yargs from 'yargs/yargs'
import generateTypeDefs from './generateTypeDefs.mjs'
import generateSchemaFile from './generateSchemaFile.mjs'
import handleQueries from './handleQueries.mjs'
import mapTypes from './map-types.mjs'

const argv = yargs(process.argv).argv
const SOURCE = argv.s || argv.source
const API_URL = argv.u || argv.url

if (!SOURCE || !API_URL) {
  console.log()
  console.error('ERROR: you must specify url (-u or --url) and source path (-s or --source)')
  console.log()
  console.log('ex: $ gql-gen -s src/gql/schema -u http://localhost:3000/api/graphql')
  console.log()
  process.exit(1)
}

const BASE_PATH = path.resolve(SOURCE)

async function generate() {
  const typeDefFiles = await generateTypeDefs(BASE_PATH)
  console.log('successfully wrote typeDefs.gql')
  generateSchemaFile()
  console.log('successfully wrote schema/index.js')
  const typeMap = mapTypes(BASE_PATH, typeDefFiles)
  handleQueries(BASE_PATH, API_URL, typeMap)
  console.log('successfully wrote queries/index.js')
}

generate()
