'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createRecognizer, isSpeechSupported } from '@/lib/voice/webspeech'
import { acceptPrivacy, hasAcceptedPrivacy } from '@/lib/voice/storage'

interface VoiceDictationProps {
  onTranscript: (text: string, isFinal: boolean) => void
  onError?: (message: string) => void
  disabled?: boolean
  hideIfNoPermission?: boolean
}

export function VoiceDictation({ onTranscript, onError, disabled }: VoiceDictationProps) {
  const [listening, setListening] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const clearSilence = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const startSilenceTimer = () => {
    clearSilence()
    silenceTimerRef.current = setTimeout(() => {
      try {
        recognitionRef.current?.stop()
      } catch {}
    }, 2000)
  }

  const start = useCallback(async () => {
    if (disabled || listening) return
    if (!isSpeechSupported()) {
      onError?.('Este navegador no permite dictar. Puedes escribir los materiales.')
      return
    }
    if (!hasAcceptedPrivacy()) {
      setShowPrivacy(true)
      return
    }

    try {
      const recog = createRecognizer('es-ES')
      if (!recog) {
        onError?.('Este navegador no permite dictar. Puedes escribir los materiales.')
        return
      }
      recognitionRef.current = recog

      recog.onresult = (event: any) => {
        clearSilence()
        startSilenceTimer()
        let finalText = ''
        let interimText = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalText += transcript
          } else {
            interimText += transcript
          }
        }
        if (interimText) {
          setLiveTranscript(interimText)
        }
        if (finalText) {
          setLiveTranscript('')
          onTranscript(finalText, true)
        }
      }

      recog.onerror = (event: any) => {
        setListening(false)
        clearSilence()
        setLiveTranscript('')
        if (event.error === 'not-allowed') {
          onError?.('Sin permiso para el micrófono. Actívalo en la configuración del navegador.')
        } else if (event.error === 'no-speech') {
          // ignore
        } else if (event.error === 'aborted') {
          // ignore
        } else {
          onError?.('No se ha podido dictar. Inténtalo de nuevo.')
        }
      }

      recog.onend = () => {
        setListening(false)
        clearSilence()
        setLiveTranscript('')
      }

      await recog.start()
      setListening(true)
      setLiveTranscript('')
      startSilenceTimer()
    } catch (e: any) {
      setListening(false)
      clearSilence()
      setLiveTranscript('')
      if (e?.name === 'NotAllowedError') {
        onError?.('Sin permiso para el micrófono. Actívalo en la configuración del navegador.')
      } else {
        onError?.('No se ha podido dictar. Inténtalo de nuevo.')
      }
    }
  }, [disabled, listening, onError, onTranscript])

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {}
    setListening(false)
    clearSilence()
    setLiveTranscript('')
  }, [])

  useEffect(() => {
    const handler = () => {
      stop()
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
      stop()
    }
  }, [stop])

  const accept = () => {
    acceptPrivacy()
    setShowPrivacy(false)
    void start()
  }

  useEffect(() => {
    const details = document.getElementById('command-bar-details') as HTMLDetailsElement | null
    const onToggle = () => {
      if (details && !details.open) {
        stop()
      }
    }
    if (details) details.addEventListener('toggle', onToggle)
    return () => {
      if (details) details.removeEventListener('toggle', onToggle)
      clearSilence()
      try {
        recognitionRef.current?.stop()
      } catch {}
    }
  }, [stop])

  if (!isSpeechSupported()) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        Este navegador no permite dictar. Puedes escribir los materiales.
      </p>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          className="btn-secondary min-h-[44px] min-w-[44px]"
          disabled={disabled}
          onClick={() => (listening ? stop() : void start())}
          aria-label={listening ? 'Detener dictado' : 'Dictar materiales'}
        >
          {listening ? 'Detener' : 'Dictar'}
        </button>
        <button
          type="button"
          className="text-xs text-brand-dark hover:underline"
          onClick={() => alert('El audio lo procesa el proveedor del navegador. La aplicación no guarda ni envía audio al servidor. Solo se envía el texto que confirmes al añadir.')}
          aria-label="Qué pasa con mi voz"
        >
          ¿Qué pasa con mi voz?
        </button>
        {listening && <span className="text-xs text-slate-500">Escuchando…</span>}
      </div>
      {listening && liveTranscript && (
        <div
          className="mt-2 w-full rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600"
          aria-live="polite"
        >
          {liveTranscript}
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg" role="dialog" aria-modal="true" aria-labelledby="voice-privacy-title">
            <h3 id="voice-privacy-title" className="text-lg font-medium">Dictado por voz</h3>
            <p className="mt-2 text-sm text-slate-600">
              El audio se procesa por el proveedor del navegador (puede enviarse a sus servidores). La aplicación no guarda ni graba el audio. Solo se envía el texto que confirmes al añadir.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-primary" onClick={accept}>Aceptar y dictar</button>
              <button type="button" className="btn-secondary" onClick={() => setShowPrivacy(false)}>Ahora no</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
