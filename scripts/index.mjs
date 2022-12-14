#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import yargs from 'yargs/yargs'
import generateTypeDefs from './generateTypeDefs.mjs'
import generateSchemaFile from './generateSchemaFile.mjs'
import handleQueries from './handleQueries.mjs'
import handleMutations from './handleMutations.mjs'
import mapTypes from './map-types.mjs'

const argv = yargs(process.argv).argv
const SOURCE = argv.s || argv.source

if (!SOURCE) {
  console.log()
  console.error('ERROR: you must specify source path (-s or --source)')
  console.log()
  console.log('ex: $ gql-gen -s src/gql/schema')
  console.log()
  process.exit(1)
}

const BASE_PATH = path.resolve(SOURCE)

async function generate() {
  const typeDefFiles = await generateTypeDefs(BASE_PATH)
  console.log('successfully wrote typeDefs.gql')
  generateSchemaFile(BASE_PATH)
  console.log('successfully wrote schema/index.js')
  const typeMap = mapTypes(BASE_PATH, typeDefFiles)
  handleQueries(BASE_PATH, typeMap)
  console.log('successfully wrote queries.js')
  handleMutations(BASE_PATH, typeMap)
  console.log('successfully wrote mutations.js')
}

generate()
