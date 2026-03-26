import { Link } from 'react-router-dom';
export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg p-4">
      <div className="bg-white dark:bg-dark-card p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Form Wizard (Segera Hadir)</h2>
        <p className="text-slate-500 mb-6">Di sinilah form step-by-step Zod + React Hook Form akan diletakkan.</p>
        <Link to="/login" className="text-brand-600 font-medium hover:underline">Kembali ke Login</Link>
      </div>
    </div>
  )
}
