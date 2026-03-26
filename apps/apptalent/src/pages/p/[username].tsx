import { useParams } from 'react-router-dom';
export default function PublicProfile() {
  const { username } = useParams();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg p-8 text-center font-sans">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Public Profile: @{username}</h1>
        <p className="text-slate-500 mt-2">Ini adalah halaman Comp Card digital yang bisa dibagikan ke publik/klien (Tanpa perlu login).</p>
    </div>
  )
}
