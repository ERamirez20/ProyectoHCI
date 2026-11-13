import { useCallback, useEffect, useRef, useState } from 'react';

// Tipos mínimos de la Web Speech API (no todos los navegadores los incluyen en lib.dom).
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionResultEvent {
  results: { length: number; [index: number]: RecognitionResult };
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onspeechend: (() => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => Recognition;

function getRecognitionConstructor(): RecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Se prueba el siguiente idioma solo si el navegador no admite el anterior. */
const LANGUAGES = ['es-CR', 'es-419', 'es-MX', 'es-ES'];

export type SpeechStatus = 'idle' | 'starting' | 'listening' | 'processing';
export type SpeechAvailability = 'available' | 'unsupported' | 'insecure';

export interface SpeechProblem {
  message: string;
  offerManual: boolean;
}

export const AVAILABILITY_PROBLEMS: Record<Exclude<SpeechAvailability, 'available'>, SpeechProblem> = {
  unsupported: {
    message:
      'Este navegador no admite dictado por voz. Probá con Chrome, Edge o Safari, o escribí el recordatorio.',
    offerManual: true,
  },
  insecure: {
    message: 'El dictado necesita una conexión segura (https). Abrí la app desde su dirección https o escribí el recordatorio.',
    offerManual: true,
  },
};

const ERRORS: Record<string, SpeechProblem> = {
  'not-allowed': {
    message:
      'No hay permiso para usar el micrófono. Permitilo desde el candado junto a la dirección del sitio y volvé a intentar, o escribí el recordatorio.',
    offerManual: true,
  },
  'service-not-allowed': {
    message: 'El navegador no permite usar el reconocimiento de voz en este momento. Podés escribir el recordatorio.',
    offerManual: true,
  },
  'audio-capture': {
    message: 'No se encontró un micrófono disponible. Revisá que esté conectado o escribí el recordatorio.',
    offerManual: true,
  },
  'no-speech': {
    message: 'No escuché nada. Tocá el micrófono e intentá de nuevo.',
    offerManual: true,
  },
  network: {
    message:
      'El reconocimiento de voz del navegador necesita internet y no pudo conectarse. Intentá de nuevo o escribí el recordatorio.',
    offerManual: true,
  },
  'language-not-supported': {
    message: 'El navegador no reconoce voz en español. Podés escribir el recordatorio.',
    offerManual: true,
  },
};

const GENERIC_ERROR: SpeechProblem = {
  message: 'No se pudo completar el dictado. Intentá de nuevo o escribí el recordatorio.',
  offerManual: true,
};

function detach(rec: Recognition) {
  rec.onstart = null;
  rec.onresult = null;
  rec.onspeechend = null;
  rec.onerror = null;
  rec.onend = null;
}

export function useSpeechRecognition(onFinal: (transcript: string) => void) {
  const [availability] = useState<SpeechAvailability>(() => {
    if (!getRecognitionConstructor()) return 'unsupported';
    if (!window.isSecureContext) return 'insecure';
    return 'available';
  });
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [problem, setProblem] = useState<SpeechProblem | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const cancel = useCallback(() => {
    const rec = recognition.current;
    if (!rec) return;
    recognition.current = null;
    detach(rec);
    try {
      rec.abort();
    } catch {
      // ya estaba detenido
    }
    setStatus('idle');
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) cancel();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      cancel();
    };
  }, [cancel]);

  const start = useCallback(() => {
    if (recognition.current) return;
    const Ctor = getRecognitionConstructor();
    if (!Ctor) return setProblem(AVAILABILITY_PROBLEMS.unsupported);
    if (!window.isSecureContext) return setProblem(AVAILABILITY_PROBLEMS.insecure);

    setProblem(null);
    setTranscript('');
    let languageIndex = 0;

    const run = () => {
      const rec = new Ctor();
      rec.lang = LANGUAGES[languageIndex];
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      let finalText = '';
      let latestText = '';
      let errorCode: string | null = null;

      rec.onstart = () => setStatus('listening');
      rec.onresult = (e) => {
        let final = '';
        let interim = '';
        for (let i = 0; i < e.results.length; i++) {
          const result = e.results[i];
          if (result.isFinal) final += result[0].transcript;
          else interim += result[0].transcript;
        }
        finalText = final.trim();
        latestText = `${final} ${interim}`.replace(/\s+/g, ' ').trim();
        setTranscript(latestText);
      };
      rec.onspeechend = () => setStatus('processing');
      rec.onerror = (e) => {
        errorCode = e.error;
      };
      rec.onend = () => {
        if (recognition.current !== rec) return;
        recognition.current = null;
        detach(rec);

        if (errorCode === 'language-not-supported' && languageIndex < LANGUAGES.length - 1) {
          languageIndex += 1;
          run();
          return;
        }

        setStatus('idle');
        if (errorCode === 'aborted') return;
        if (errorCode) {
          setProblem(ERRORS[errorCode] ?? GENERIC_ERROR);
          return;
        }
        const text = finalText || latestText;
        if (!text) {
          setProblem(ERRORS['no-speech']);
          return;
        }
        onFinalRef.current(text);
      };

      recognition.current = rec;
      setStatus('starting');
      try {
        rec.start();
      } catch {
        recognition.current = null;
        detach(rec);
        setStatus('idle');
        setProblem(GENERIC_ERROR);
      }
    };

    run();
  }, []);

  const stop = useCallback(() => {
    const rec = recognition.current;
    if (!rec) return;
    setStatus('processing');
    rec.stop();
  }, []);

  const clearProblem = useCallback(() => setProblem(null), []);

  return { availability, status, transcript, problem, start, stop, cancel, clearProblem };
}
