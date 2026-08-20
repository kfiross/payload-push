import type { Payload } from 'payload'

import type { PushAdapter, SchedulePushOptions, SendPushJobPayload } from './types/index.js'

type PayloadPushMessage = {
  body: string
  data?: Record<string, any>
  options?: Record<string, any>
  title: string
}

class PayloadPush {
  private adapter?: ReturnType<PushAdapter>
  private payload?: Payload

  init(payload: Payload, adapterFactory: PushAdapter) {
    this.payload = payload
    this.adapter = adapterFactory({ payload })

    // Register Jobs Queue handler if available on the Payload instance
    const jobsAPI = (payload as any).jobs
    if (jobsAPI && typeof jobsAPI.register === 'function') {
      try {
        jobsAPI.register('sendPushJob', async (job: any) => {
          const jobData: SendPushJobPayload = job?.data || job?.payload || {}
          const scheduledId = jobData.scheduledNotificationId || jobData.scheduledNotificationId

          if (!scheduledId) {
            payload.logger.error('sendPushJob invoked without scheduledNotificationId')
            return
          }

          await this.processScheduledJob(scheduledId, job)
        })

        payload.logger.info('Registered sendPushJob handler with Payload Jobs API')
      } catch (err: any) {
        payload.logger.warn('Could not register jobs handler for sendPushJob', err.toString())
      }
    }
  }

  private async processScheduledJob(scheduledNotificationId: string, job?: any) {
    if (!this.payload) return
    if (!this.adapter) return

    try {
      // mark processing
      await this.payload.update({
        collection: 'scheduledNotifications',
        id: scheduledNotificationId,
        data: { status: 'processing', attempts: (await this.getAttempts(scheduledNotificationId)) + 1 },
      })

      const doc: any = await this.payload.findByID({ collection: 'scheduledNotifications', id: scheduledNotificationId })
      const pushOptions: SchedulePushOptions | undefined = doc?.pushOptions || doc?.data?.pushOptions

      if (!pushOptions) {
        throw new Error('No pushOptions found on scheduled notification')
      }

      await this.sendPush({
        title: doc.title || pushOptions.title,
        body: doc.body || pushOptions.body,
        data: doc.data || pushOptions.data,
        options: pushOptions.options || undefined,
      })

      await this.payload.update({
        collection: 'scheduledNotifications',
        id: scheduledNotificationId,
        data: { status: 'sent', sentAt: new Date().toISOString() },
      })
    } catch (err: any) {
      await this.payload.update({
        collection: 'scheduledNotifications',
        id: scheduledNotificationId,
        data: { status: 'failed', lastError: String(err?.message || err) },
      })
      this.payload.logger.error('sendPushJob failed', err)
      // rethrow so Jobs Queue can record failure if applicable
      throw err
    }
  }

  private async getAttempts(id: string) {
    if (!this.payload) return 0
    try {
      const doc: any = await this.payload.findByID({ collection: 'scheduledNotifications', id })
      return (doc?.attempts as number) || 0
    } catch (e) {
      return 0
    }
  }

  /**
   * Persist a scheduled push and (optionally) enqueue a Jobs Queue job.
   */
  async schedulePush(options: SchedulePushOptions & { title?: string }) {
    if (!this.payload) {
      throw new Error('PayloadPush not initialized')
    }

    // create scheduledNotifications doc for audit / admin UI
    const doc = await this.payload.create({
      collection: 'scheduledNotifications',
      data: {
        title: options.title || options.title,
        body: options.body,
        data: options.data || {},
        pushOptions: { ...options },
        scheduledAt: options.scheduledAt || null,
        status: 'scheduled',
        attempts: 0,
      },
    })

    // If scheduledAt is missing or in the past, send immediately
    if (!options.scheduledAt || new Date(options.scheduledAt) <= new Date()) {
      try {
        await this.sendPush({ title: options.title || '', body: options.body, data: options.data, options: options.options })
        await this.payload.update({ collection: 'scheduledNotifications', id: (doc as any).id, data: { status: 'sent', sentAt: new Date().toISOString() } })
        return doc
      } catch (err: any) {
        await this.payload.update({ collection: 'scheduledNotifications', id: (doc as any).id, data: { status: 'failed', lastError: String(err?.message || err) } })
        throw err
      }
    }

    // Otherwise, try to enqueue a job with Payload Jobs API if available
    const jobsAPI = (this.payload as any).jobs
    if (jobsAPI && typeof jobsAPI.create === 'function') {
      try {
        const job = await jobsAPI.create({
          name: 'sendPushJob',
          data: { scheduledNotificationId: (doc as any).id },
          runAt: new Date(options.scheduledAt),
        })

        // mark queued
        await this.payload.update({ collection: 'scheduledNotifications', id: (doc as any).id, data: { status: 'queued', jobId: job?.id || job?._id || null } })
        return doc
      } catch (err: any) {
        // failed to enqueue, keep scheduled status and record error
        await this.payload.update({ collection: 'scheduledNotifications', id: (doc as any).id, data: { status: 'scheduled', lastError: String(err?.message || err) } })
        this.payload.logger.warn('Failed to enqueue sendPushJob', err)
        return doc
      }
    }

    // Jobs API not available — leaving doc in scheduled state for external worker / polling
    this.payload.logger.info('Payload Jobs API not available; scheduledNotifications doc created for external processing')
    return doc
  }

  async sendPush(message: PayloadPushMessage) {
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