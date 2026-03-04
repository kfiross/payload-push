import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { payloadPush } from '../../../../src/payloadPush.js'

export const GET = async (request: Request) => {
  const payload = await getPayload({
    config: configPromise,
  })

  try {
    await payloadPush.sendPush({
      body: 'hello from Payload Push Plugin!!',
      title: 'title test',
      options: {
        topic: 'user-itOjpF2lsdgk1KPW5zeit6fxft02',
      },
    })
  } catch (error: Error) {
    return Response.json({
      error: error.message,
    })
  }


  return Response.json({
    message: 'This is an example of a custom route.',
  })
}
