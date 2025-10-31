'use client';

export default function Section({ children, className }) {
  return (
    <section className={`w-full py-16 lg:py-24 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">{children}</div>
    </section>
  );
}
