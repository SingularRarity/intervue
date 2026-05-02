import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Video, VideoOff, Mic, MicOff, PhoneOff, Camera } from 'lucide-react'

export default function VideoInterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [status, setStatus] = useState<'connecting' | 'live' | 'ended'>('connecting')
  const [tabWarnings, setTabWarnings] = useState(0)

  useEffect(() => {
    startCamera()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const handleVisibilityChange = () => {
    if (document.hidden) {
      setTabWarnings((w) => w + 1)
      logProctoringEvent('tab_away')
    } else {
      logProctoringEvent('tab_return')
    }
  }

  const logProctoringEvent = async (eventType: string) => {
    try {
      await fetch(`/api/v1/sessions/${sessionId}/proctoring/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventType }),
      })
    } catch {
      // non-blocking
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setStream(mediaStream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream
      }
      setStatus('live')
    } catch {
      setStatus('live') // proceed without camera if denied
    }
  }

  const toggleVideo = () => {
    stream?.getVideoTracks().forEach((t) => (t.enabled = !videoEnabled))
    setVideoEnabled((v) => !v)
  }

  const toggleAudio = () => {
    stream?.getAudioTracks().forEach((t) => (t.enabled = !audioEnabled))
    setAudioEnabled((a) => !a)
  }

  const endSession = () => {
    stream?.getTracks().forEach((t) => t.stop())
    navigate(`/results/${sessionId}`)
  }

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <div className="bg-dark-900 border-b border-dark-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-primary-400" />
          <span className="text-white font-semibold">Video Interview</span>
          {status === 'live' && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        {tabWarnings > 0 && (
          <span className="text-yellow-400 text-sm">
            Warning: {tabWarnings} tab switch{tabWarnings > 1 ? 'es' : ''} detected
          </span>
        )}
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 grid grid-cols-2 gap-4 max-w-5xl mx-auto w-full">
        {/* AI Interviewer */}
        <div className="bg-dark-900 rounded-2xl border border-dark-800 flex flex-col items-center justify-center p-8 aspect-video">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <p className="text-dark-300 font-medium">AI Interviewer</p>
          <p className="text-dark-500 text-sm mt-1">Listening...</p>
        </div>

        {/* Candidate Camera */}
        <div className="bg-dark-900 rounded-2xl border border-dark-800 overflow-hidden relative aspect-video">
          {videoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoOff className="w-12 h-12 text-dark-500" />
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-dark-950/80 px-2 py-1 rounded text-xs text-dark-300">
            You
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-dark-900 border-t border-dark-800 px-6 py-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-colors ${
            audioEnabled ? 'bg-dark-800 text-white hover:bg-dark-700' : 'bg-red-600 text-white'
          }`}
        >
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${
            videoEnabled ? 'bg-dark-800 text-white hover:bg-dark-700' : 'bg-red-600 text-white'
          }`}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button
          onClick={endSession}
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
