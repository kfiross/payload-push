import type { CollectionConfig } from 'payload'

const ScheduledNotifications: CollectionConfig = {
  slug: 'scheduledNotifications',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'data',
      type: 'json',
      admin: { description: 'Arbitrary data included with the push' },
    },
    {
      name: 'pushOptions',
      type: 'json',
      admin: { description: 'Adapter-specific options used to send the push' },
    },
    {
      name: 'scheduledAt',
      type: 'date',
      admin: { description: 'When the job should run (UTC)' },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Queued', value: 'queued' },
        { label: 'Processing', value: 'processing' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Canceled', value: 'canceled' },
      ],
      defaultValue: 'scheduled',
    },
    {
      name: 'attempts',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'lastError',
      type: 'text',
    },
    {
      name: 'sentAt',
      type: 'date',
    },
  ],
}


export default ScheduledNotifications