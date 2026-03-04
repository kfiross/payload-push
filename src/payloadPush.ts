import type { Payload } from 'payload'

import type { PushAdapter } from './types/index.js'

class PayloadPush {
  private adapter?: ReturnType<PushAdapter>
  private payload?: Payload

  init(payload: Payload, adapterFactory: PushAdapter) {
    this.payload = payload
    this.adapter = adapterFactory({ payload })
  }

  async sendPush(message: {
    body: string
    data?: Record<string, any>
    options?: Record<string, any>
    title: string
  }) {
    if (!this.payload) {
      throw new Error('PayloadPush not initialized')
    }
    if (!this.adapter) {
      throw new Error('Push adapter not initialized')
    }

    if (typeof this.adapter.sendPush !== 'function') {
      throw new Error('Push adapter missing sendPush() method')
    }

    try {
      const result = await this.adapter.sendPush(message)
      this.payload.logger.info(`📤 Push sent via ${this.adapter.name}`)
      return result
    } catch (err: any) {
      this.payload.logger.error('❌ Push send failed', err)
      throw err
    }
  }
}

export const payloadPush = new PayloadPush()
