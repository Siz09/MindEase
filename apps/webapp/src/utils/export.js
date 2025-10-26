// apps/webapp/src/utils/export.js
export function toCSV(rows, filename, columns) {
  // columns: array of { key, title }
  const header = columns.map((c) => c.title).join(',');
  const csvRows = rows.map((row) =>
    columns
      .map((c) => {
        let v = row?.[c.key];
        if (v == null) return '';
        if (v instanceof Date) v = v.toISOString();
        if (typeof v === 'string') {
          return '"' + v.replace(/"/g, '""') + '"';
        }
        return String(v);
      })
      .join(',')
  );
  const csv = [header, ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
