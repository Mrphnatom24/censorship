'use client';
import { useState } from 'react';

const LABEL_COLORS: Record<string, string> = {
  DNI: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  NIE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  CIF: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  IBAN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  TARJETA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  EMAIL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  TELÉFONO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  URL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  IP: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  NOMBRE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  LUGAR: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  ORGANIZACIÓN: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  MATRÍCULA: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  PASAPORTE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  NSS: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  FECHA: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export default function Page() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const procesar = async () => {
    if (!input.trim()) {
      setError('Por favor, introduce algún texto para censurar');
      return;
    }

    setLoading(true);
    setError(null);
    setOutput('');
    setSummary({});

    try {
      const res = await fetch('/redact', {
        method: 'POST',
        body: JSON.stringify({ text: input }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}: ${data.message || 'Error desconocido'}`);
      }

      setOutput(data.censored);
      setSummary(data.summary ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el texto');
      console.error('Error en censura:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalEntities = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Taurus Redactor</h2>

      <textarea
        className="w-full h-40 p-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed"
        onChange={(e) => setInput(e.target.value)}
        placeholder="Escribe aquí el texto que quieres anonimizar..."
        disabled={loading}
      />

      <button
        onClick={procesar}
        className={`mt-4 px-6 py-3 text-lg font-medium rounded-lg transition-colors
                   ${loading
                     ? 'bg-gray-400 cursor-not-allowed'
                     : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                   } text-white`}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </span>
        ) : 'Censurar Ahora'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <strong className="text-red-800 dark:text-red-300">Error:</strong>
          </div>
          <p className="mt-1 text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {output && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">Resultado:</h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                        rounded-lg whitespace-pre-wrap break-words font-mono">
            {output}
          </div>

          <div className="mt-2 flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Caracteres: {output.length}</span>
            <span>Entidades detectadas: {totalEntities}</span>
          </div>

          {totalEntities > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Desglose por categoría:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary).map(([label, count]) => (
                  <span
                    key={label}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${LABEL_COLORS[label] ?? 'bg-gray-100 text-gray-800'}`}
                  >
                    {label}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function countPlaceholders(text: string): number {
  const matches = text.match(/\[[A-ZÁÉÍÓÚÑ]+\]/g);
  return matches ? matches.length : 0;
}
