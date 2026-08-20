'use client'

import { Button, TextInput, TextareaInput, Select, toast } from '@payloadcms/ui'
import React, { useState } from 'react'

export const SendPushForm = ({ apiBasePath }: { apiBasePath: string }) => {
  const options = [
    {value: 'group', label: 'group'},
    {value: 'user', label: 'user'},
  ]

  const [topic, setTopic] = useState('')
  const [topicType, setTopicType] = useState<any>(options[0])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const topicString = topicType.value == 'group' ? topic : `user-${topic}`
    try {
      const res = await fetch(apiBasePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body: message, topic: topicString }),
      })

      if (!res.ok) {
        toast.error('Sending push failed')
        console.log({res})
      }
      else {
        toast.success('Push send successfully!')

        //TODO: do refresh
      }


      // const res = await fetch('/api/users', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     topic,
      //     title,
      //   }),
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // })
    } catch (error) {
      toast.error('Sending push failed,'+ error)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px'}}>
        <label>Topic</label>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '4px'}}>
          <div style={{ flex: 1}}>
           <Select 
              value={topicType}
              options={options}
              onChange={(op) => setTopicType(op)}
            />
          </div>

          <TextInput
              required
              // label="Topic"
              path="topic"
              placeholder={`Type the name of ${topicType?.value ?? ''}...`}
              value={topic}
              style={{flex: 4}}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
          />
        </div>
      </div>
      
      <TextInput
        required
        label="Title"
        path="title"
        placeholder="Write here the title of the message..."
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
      />
      <TextareaInput
        required
        label="Message"
        path="message"
        placeholder="Write here the body of the message..."
        value={message}
        rows={4}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
      />
      <div style={{marginTop: '12px'}}>
        <Button type="submit">Send push</Button>
      </div>
    </form>
  )
}

export default SendPushForm;