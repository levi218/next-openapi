'use client';
import { useEffect } from 'react';
import { RedocTryItOut } from '../../../../../libs/redoc-try-it-out-main/src/module';

export default function ApiDocs() {
  useEffect(() => {
    RedocTryItOut.init(
      '/api/docs/json',
      {
        tryItOutEnabled: true,
        authBtn: {
          posSelector: '#section\\/Authentication > div:first-child',
          text: 'Authorizations config',
        },
      },
      document.getElementById('redoc_container') ?? undefined
    );
  }, []);
  return <div id="redoc_container"></div>;
}
