'use client';
import { useEffect } from 'react';
import { useScript } from 'usehooks-ts';

export default function ApiDocs() {
  const scriptStatus = useScript(
    'https://cdn.jsdelivr.net/npm/redoc-try-it-out/dist/try-it-out.min.js'
  );
  useEffect(() => {
    if (scriptStatus === 'ready')
      RedocTryItOut.init(
        '/api/docs/json',
        { title: 'Pet Store' },
        document.getElementById('redoc_container')
      );
  }, [scriptStatus]);
  return <div id="redoc_container"></div>;
}
