'use client';
import { useState } from 'react';

export default function Page() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const procesar = async () => {
    const res = await fetch('/redact', {
      method: 'POST',
      body: JSON.stringify({ text: input }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    setOutput(data.censored || data.error);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Taurus Redactor Quick-Start</h2>
      <textarea 
        style={{ width: '100%', height: '100px', color: 'white' }}
        onChange={(e) => setInput(e.target.value)} 
        placeholder="Escribe aquí..."
      />
      <button onClick={procesar} style={{ marginTop: '10px' }}>
        Censurar Ahora
      </button>
      {output && <p style={{ color: "white" }}><strong>Resultado:</strong> {output}</p>}
    </div>
  );
}