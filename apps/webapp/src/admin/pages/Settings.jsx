'use client';

import { useState } from 'react';

export default function Settings() {
  const [alerts, setAlerts] = useState(true);

  return (
    <div className="panel">
      <div className="panel-head">Admin Settings</div>
      <div className="panel-body">
        <label className="switch">
          <input type="checkbox" checked={alerts} onChange={() => setAlerts(!alerts)} />
          <span> Crisis Alerts Enabled</span>
        </label>
        <p className="hint">Wire this to AdminSettings later.</p>
      </div>
    </div>
  );
}
