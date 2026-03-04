import type { Config } from 'payload'

import type { PushAdapter } from './types/index.js'

import fcmPushEndpointHandler from './endpoints/fcmPushEndpointHandler.js'
import { payloadPush } from './payloadPush.js'

export type PayloadPushPluginConfig = {
  disabled?: boolean
  pushAdapter: PushAdapter
}

export const payloadPushPlugin =
  (pluginOptions?: PayloadPushPluginConfig) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = []
    }

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions?.disabled) {
      return config
    }

    if (!pluginOptions?.pushAdapter) {
      throw new Error('pushAdapter is missing')
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    config.endpoints.push({
      handler: fcmPushEndpointHandler(pluginOptions),
      method: 'post',
      path: '/test-push/firebase',
    })

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // Ensure we are executing any existing onInit functions before running our own.
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }

      payloadPush.init(payload, pluginOptions.pushAdapter)

      // Optionally inject into payload so user can use: payload.push.sendPush()
      // @ts-ignore
      payload.push = payloadPush

      payload.logger.info('📱 Payload Push initialized with custom adapter')
    }

    return config
  }
