import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadPushPlugin } from 'payload-push'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { firebaseAdapter } from '../src/adapters/push-firebase.js'
import { payloadPush } from '../src/payloadPush.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'
// import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URL = `${memoryDB.getUri()}&retryWrites=true`
  }

  return buildConfig({
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'posts',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'content',
            type: 'text',
          },
        ],
        hooks: {
          afterChange: [
            (doc, previousDoc) => {
              void payloadPush.sendPush({
                body: 'heLLo FroM pLugIn!!',
                title: 'afterChange test',
                options: {
                  topic: 'user-itOjpF2lsdgk1KPW5zeit6fxft02',
                },
              })
              return doc
            },
          ],
        },
      },
      {
        slug: 'media',
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
      },
    ],
    db: mongooseAdapter({
      ensureIndexes: true,
      autoPluralization: true,
      url: 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.7.0',
      //process.env.DATABASE_URL || '',
    }),
    editor: lexicalEditor(),
    email: testEmailAdapter,
    onInit: () => {
      console.log('onInit called')
      // await seed(payload)
    },
    plugins: [
      payloadPushPlugin({
        pushAdapter: firebaseAdapter({
          serviceAccountJSON: {
            // ADD service-account.json data here
          },
        }),
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
