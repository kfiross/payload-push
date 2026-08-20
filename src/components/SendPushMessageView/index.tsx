// import type { AdminViewProps } from 'payload'
import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import React from 'react'
import SendPushForm from './SendPushForm.js'

export const SendPushMessageView: React.FC<AdminViewServerProps> = ({
  initPageResult,
  params,
  searchParams,
  ...props
}) => {

  const { apiBasePath, options: _pluginOptions } =
    props.payload.config.admin.custom.payloadPush ?? {}

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px'}}>
          <h1>Sending a push message</h1>
          <p>Here you can send a notification to user or a group of users</p>
        </div>
        <SendPushForm apiBasePath={apiBasePath} />
      </Gutter>
    </DefaultTemplate>
  )
}

export default SendPushMessageView;