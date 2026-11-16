import { useEffect, useRef } from 'react'

/**
 * Renders a list of messages in a chat-bubble style.
 * myId — the current user's id, used to decide left vs right alignment.
 */
export default function EnquiryThread({ messages, myId }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!messages?.length) {
    return <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      {messages.map(msg => {
        const isMe = msg.sender === myId
        return (
          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isMe
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {!isMe && (
                <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</p>
              )}
              <p className="whitespace-pre-wrap">{msg.message}</p>
              <p className={`text-xs mt-1 opacity-60 ${isMe ? 'text-right' : ''}`}>
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
