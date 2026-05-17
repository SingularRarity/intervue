import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Mic, MicOff, PhoneOff, Loader2, Volume2, MessageSquare,
  Clock, AlertCircle, CheckCircle 
} from 'lucide-react'
import { useInterviewStore } from '@/lib/store'
import { interviewApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { messages, addMessage, clearMessages, setCurrentSession, setIsRecording } = useInterviewStore()

  const [ws, setWs] = useState<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [audioPlaying, setAudioPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Reconnect bookkeeping — interview state lives server-side, so a dropped
  // socket just needs a fresh connection; the backend replays history on connect.
  const intentionalCloseRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => interviewApi.getSession(sessionId!).then(r => r.data),
    enabled: !!sessionId,
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // WebSocket connection — with auto-reconnect.
  useEffect(() => {
    if (!sessionId) return
    intentionalCloseRef.current = false
    reconnectAttemptsRef.current = 0

    const buildUrl = () => {
      // Prefer ?candidate_token=… (candidate-side flow, no JWT). Else use HR's JWT.
      const urlParams = new URLSearchParams(window.location.search)
      const candidateToken = urlParams.get('candidate_token')
      const stored = localStorage.getItem('auth-storage')
      const parsed = stored ? JSON.parse(stored) : null
      const jwt = parsed?.state?.token
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const qs = candidateToken
        ? `?candidate_token=${encodeURIComponent(candidateToken)}`
        : jwt ? `?token=${encodeURIComponent(jwt)}` : ''
      return `${proto}//${window.location.host}/ws/interview/${sessionId}${qs}`
    }

    let socket: WebSocket

    const connect = () => {
      socket = new WebSocket(buildUrl())

      socket.onopen = () => {
        setConnected(true)
        setCurrentSession(sessionId)
        if (reconnectAttemptsRef.current > 0) {
          addMessage({ role: 'system', content: 'Reconnected — picking up where you left off.' })
        }
        reconnectAttemptsRef.current = 0
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        switch (data.type) {
          case 'system':
            addMessage({ role: 'system', content: data.message })
            break
          case 'history':
            // Backend replays prior messages on (re)connect — rebuild the thread.
            clearMessages()
            for (const m of data.messages ?? []) {
              addMessage({
                role: m.role === 'interviewer' ? 'interviewer' : m.role === 'candidate' ? 'candidate' : 'system',
                content: m.content,
              })
            }
            break
          case 'interviewer_message':
            addMessage({ role: 'interviewer', content: data.text, audioUrl: data.audio })
            if (data.audio) playAudio(data.audio)
            setProcessing(false)
            break
          case 'interview_complete':
            addMessage({ role: 'system', content: 'Interview completed! Generating report...' })
            toast.success('Interview completed!')
            intentionalCloseRef.current = true
            setTimeout(() => navigate(`/results/${sessionId}`), 2000)
            break
          case 'error':
            toast.error(data.message)
            setProcessing(false)
            break
          case 'processing':
            setProcessing(true)
            break
        }
      }

      socket.onclose = () => {
        setConnected(false)
        if (intentionalCloseRef.current) return
        // Reconnect with exponential backoff (1s,2s,4s,8s,10s…), give up after 6 tries
        const attempt = reconnectAttemptsRef.current
        if (attempt >= 6) {
          addMessage({ role: 'system', content: 'Connection lost. Please refresh the page to resume.' })
          return
        }
        const delay = Math.min(10000, 1000 * 2 ** attempt)
        reconnectAttemptsRef.current = attempt + 1
        addMessage({ role: 'system', content: `Connection dropped — reconnecting in ${delay / 1000}s...` })
        reconnectTimerRef.current = setTimeout(connect, delay)
      }

      socket.onerror = () => {
        // onclose fires right after — let it handle the reconnect
      }

      setWs(socket)
    }

    connect()

    return () => {
      intentionalCloseRef.current = true
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      socket?.close()
      setCurrentSession(null)
    }
  }, [sessionId])

  const playAudio = useCallback((audioData: string) => {
    setAudioPlaying(true)
    const audio = new Audio(audioData)
    audioRef.current = audio
    audio.onended = () => setAudioPlaying(false)
    audio.play().catch(() => setAudioPlaying(false))
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()

        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'audio_chunk',
              audio: base64,
            }))
          }
        }

        reader.readAsDataURL(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setRecording(true)
      setIsRecording(true)
    } catch (err) {
      toast.error('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      setIsRecording(false)
      setProcessing(true)
    }
  }

  const sendTextMessage = (text: string) => {
    if (ws && ws.readyState === WebSocket.OPEN && text.trim()) {
      addMessage({ role: 'candidate', content: text })
      ws.send(JSON.stringify({ type: 'text_message', content: text }))
      setProcessing(true)
    }
  }

  const endInterview = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'end_interview' }))
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-dark-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <div>
            <h1 className="text-lg font-semibold text-white">
              {session?.template_title || 'AI Interview'}
            </h1>
            <p className="text-sm text-dark-400">
              {session?.candidate_name || 'Candidate'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-dark-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
          <button
            onClick={endInterview}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            End Interview
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === 'candidate' ? 'justify-end' : 
              msg.role === 'system' ? 'justify-center' : 'justify-start'
            }`}
          >
            {msg.role === 'system' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-dark-800/50 rounded-full text-sm text-dark-400">
                <AlertCircle className="w-4 h-4" />
                {msg.content}
              </div>
            ) : (
              <div
                className={`max-w-[70%] px-5 py-3 rounded-2xl ${
                  msg.role === 'candidate'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-dark-800 text-dark-100 rounded-bl-md border border-dark-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {msg.role === 'interviewer' && msg.audioUrl && (
                    <button
                      onClick={() => playAudio(msg.audioUrl!)}
                      className="mt-1 p-1 bg-primary-600/20 rounded-lg text-primary-400 hover:bg-primary-600/30 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                  <div>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <span className="text-xs opacity-50 mt-1 block">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {processing && (
          <div className="flex justify-start">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl rounded-bl-md px-5 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                <span className="text-sm text-dark-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {audioPlaying && (
          <div className="flex justify-start">
            <div className="bg-primary-600/10 border border-primary-600/20 rounded-2xl rounded-bl-md px-5 py-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary-400 animate-pulse" />
                <span className="text-sm text-primary-400">Playing audio response...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-dark-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {/* Voice Button */}
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={!connected || processing}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              recording
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                : 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-600/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {recording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Text Input Fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement
              sendTextMessage(input.value)
              input.value = ''
            }}
            className="flex-1 flex items-center gap-3"
          >
            <input
              name="message"
              type="text"
              placeholder={recording ? 'Listening...' : 'Type your answer or press the mic button to speak...'}
              disabled={recording || processing}
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={recording || processing}
              className="p-3 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl transition-colors disabled:opacity-50"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-dark-600 mt-3">
          {recording ? 'Recording... Click the red button to stop' : 'Press and hold the mic button to speak, or type your response'}
        </p>
      </div>
    </div>
  )
}
