import type { Config } from 'payload'

import type { PushAdapter } from './types/index.js'

import fcmPushEndpointHandler from './endpoints/fcmPushEndpointHandler.js'
import { payloadPush } from './payloadPush.js'

import { firebaseAdapter } from './adapters/push-firebase.js'
import ScheduledNotifications from './collections/scheduledNotifications.js'

type PayloadPushPluginConfig = {
  disabled?: boolean
  pushAdapter: PushAdapter
}

const apiBasePath = '/api/push-scheduler'

const payloadPushPlugin =
  (pluginOptions?: PayloadPushPluginConfig) =>
  (config: Config): Config => {
    const adminRoute = '/send-push'

    if (!config.collections) {
      config.collections = []
    }

    // Register scheduledNotifications collection for admin UI / audit
    config.collections.push(ScheduledNotifications)
    
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

    if (!config.admin.components.views) {
      config.admin.components.views = {}
    }

    if (!config.admin.custom) {
      config.admin.custom = {}
    }

    config.admin.custom.payloadPush = {
      apiBasePath,
      options: pluginOptions,
    }

    config.endpoints.push({
      handler: fcmPushEndpointHandler(pluginOptions),
      method: 'post',
      path: apiBasePath,
    })

    config.admin.components.views.payloadPushDashbaord = {
        // Payload v3 resolves this as a module#exportName path.
        // The RSC wrapper reads plugin options from config.custom
        // so no secrets end up in the client bundle.
        Component: '@kfiross44/payload-push/rsc#SendPushMessageView',
        meta: {
          description: `Payload Push Dashboard`,
          title: 'Payload Push Dashboard',
        },
        //@ts-ignore
        serverProps: {
          apiBasePath,
          options: pluginOptions,
        },
        //@ts-ignore
        path: adminRoute,
    }

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


export {
  payloadPushPlugin,
  type PayloadPushPluginConfig,
  firebaseAdapter,
}  