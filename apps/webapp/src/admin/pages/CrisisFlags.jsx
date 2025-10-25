'use client';

const FLAGS = [
  {
    id: 'c1',
    user: 'anon-4832',
    chatId: 'c-1001',
    keyword: 'self-harm',
    risk: 0.92,
    createdAt: '2025-10-24T08:55:00Z',
  },
  {
    id: 'c2',
    user: 'bob@example.com',
    chatId: 'c-1002',
    keyword: 'suicide',
    risk: 0.87,
    createdAt: '2025-10-24T13:30:00Z',
  },
];

export default function CrisisFlags() {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Chat ID</th>
            <th>Keyword</th>
            <th>Risk</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {FLAGS.map((f) => (
            <tr key={f.id}>
              <td>{f.user}</td>
              <td>{f.chatId}</td>
              <td>{f.keyword}</td>
              <td>{Math.round(f.risk * 100)}%</td>
              <td>{new Date(f.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
