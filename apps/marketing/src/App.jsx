import * as Sentry from '@sentry/react';

function App() {
  return (
    <div>
      <h1>Hello from Webapp</h1>
      <button onClick={() => Sentry.captureException(new Error('Test error'))}>
        Trigger Sentry Error
      </button>
    </div>
  );
}

export default App;
