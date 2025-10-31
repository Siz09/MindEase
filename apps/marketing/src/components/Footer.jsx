export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} MindEase. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
