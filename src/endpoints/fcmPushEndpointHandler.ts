import type { PayloadHandler, PayloadRequest } from 'payload'

import type { PayloadPushPluginConfig } from '../index.js'

import { payloadPush } from '../payloadPush.js'

const fcmPushEndpointHandler = (pluginOptions: PayloadPushPluginConfig) => {
  const handler: PayloadHandler = async (req: PayloadRequest) => {
    const adapterName = pluginOptions.pushAdapter.name
    try {
      if (!req) {
        return Response.json({})
      }
      const { payload } = req

      // @ts-ignore
      const data = await req.json()

      payload.logger.info({ data })

      const { body, title, topic } = data as Record<string, string>

      if (!req.user) {
        return Response.json({ error: 'Unauthorized', success: false }, { status: 401 })
      }

      // 2️⃣ Optional: restrict to admin users
      // if (!req.user.roles?.some(r => r === 'admin')) {
      //   return Response.json({ success: false, error: 'Forbidden'  }, { status: 403 })
      // }

      payloadPush.init(payload, pluginOptions.pushAdapter)

      payload.logger.info(`Sending Push sent via ${adapterName}...`)
      payload.logger.info('title=' + title)
      payload.logger.info('body=' + body)
      payload.logger.info('topic=' + topic)

      await payloadPush.sendPush({
        body,
        title,
        // data,
        options: { topic },
      })

      payload.logger.info(`📱 Push sent via ${adapterName}`)

      return Response.json({ success: true }, { status: 200 })
    } catch (err) {
      return Response.json({ error: 'Push failed', success: false }, { status: 500 })
    }
  }

  return handler;
}

export default fcmPushEndpointHandler
