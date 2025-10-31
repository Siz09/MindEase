'use client';

export default function FeatureIcon({ icon }) {
  return (
    <div className="w-12 h-12 bg-gradient-to-br from-accent/30 to-accent/10 rounded-lg flex items-center justify-center text-accent flex-shrink-0">
      {icon}
    </div>
  );
}
