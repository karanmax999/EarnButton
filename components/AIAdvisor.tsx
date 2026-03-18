'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_QUESTIONS = [
  'Which vault should I pick?',
  'Is this safe to use?',
  'How does yield work?',
]

function SparkleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2" aria-label="AI is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-neutral-400"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  )
}

export default function AIAdvisor() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pulse, setPulse] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Periodic attention pulse every 5s when closed
  useEffect(() => {
    if (open) return
    const id = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 400)
    }, 5000)
    return () => clearInterval(id)
  }, [open])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.text || `Error: ${data.error || 'Something went wrong.'}`
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t connect. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* Bounce keyframe */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes advisor-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 230, 184, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(0, 230, 184, 0); }
        }
      `}</style>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 w-80 rounded-2xl border border-neutral-200 bg-white shadow-strong flex flex-col overflow-hidden"
          style={{ height: '420px' }}
          role="dialog"
          aria-label="AI Vault Advisor"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600">
            <div className="flex items-center gap-2 text-white">
              <SparkleIcon />
              <span className="text-sm font-semibold">AI Vault Advisor</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close AI advisor"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500 text-center pt-2">
                  Ask me anything about YO Protocol vaults
                </p>
                <div className="space-y-2">
                  {STARTER_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="w-full text-left rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2
                                 text-xs text-neutral-700 hover:bg-primary-50 hover:border-primary-200
                                 hover:text-primary-700 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed
                    ${m.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-sm'
                      : 'bg-neutral-100 text-neutral-800 rounded-bl-sm'}`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 rounded-2xl rounded-bl-sm">
                  <ThinkingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-neutral-100 p-2 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs
                         outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100
                         transition-all disabled:opacity-50"
              aria-label="Message input"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="rounded-xl bg-primary-500 px-3 py-2 text-white hover:bg-primary-600
                         transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full
                   bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3
                   text-sm font-semibold text-white shadow-strong
                   hover:from-primary-400 hover:to-primary-500 transition-all
                   ${pulse ? 'ai-attention' : ''}`}
        style={{ animation: open || pulse ? 'none' : 'advisor-pulse 2s ease-in-out infinite', willChange: 'transform' }}
        aria-label={open ? 'Close AI advisor' : 'Open AI advisor'}
      >
        <SparkleIcon />
        <span>Ask AI</span>
      </button>
    </>
  )
}
