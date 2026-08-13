import React, { useState, useEffect } from 'react';
import { Film, Mail, Phone, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface CastingQuestion {
  question: string;
  type: 'text' | 'multiple_choice' | 'textarea';
  options?: string[];
}

interface CastingBoardInfo {
  board_id: string;
  project_name: string;
  role_title: string;
  role_description?: string;
  casting_director_name?: string;
  casting_director_email?: string;
  allow_guests: boolean;
  guest_questions?: CastingQuestion[];
  expires_at?: string;
}

interface CastingGuestSubmitProps {
  boardInfo: CastingBoardInfo;
  onSubmitSuccess?: (submissionId: string) => void;
}

export function CastingGuestSubmit({ boardInfo, onSubmitSuccess }: CastingGuestSubmitProps) {
  const [step, setStep] = useState<'info' | 'questions' | 'choice' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    create_account: false,
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissionId, setSubmissionId] = useState('');

  const isExpired = boardInfo.expires_at && new Date(boardInfo.expires_at) < new Date();

  if (isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Casting Ditutup</h3>
        <p className="text-red-700">Maaf, periode pendaftaran untuk casting call ini telah berakhir.</p>
      </div>
    );
  }

  const handleInfoSubmit = () => {
    if (!formData.full_name.trim()) {
      setError('Masukkan nama lengkap Anda');
      return;
    }
    if (!formData.email.trim()) {
      setError('Masukkan email Anda');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Masukkan nomor telepon');
      return;
    }
    setError('');
    
    if (boardInfo.guest_questions && boardInfo.guest_questions.length > 0) {
      setStep('questions');
    } else {
      setStep('choice');
    }
  };

  const handleQuestionsSubmit = () => {
    const unanswered = boardInfo.guest_questions?.filter(q => !answers[q.question]);
    if (unanswered && unanswered.length > 0) {
      setError('Jawab semua pertanyaan terlebih dahulu');
      return;
    }
    setError('');
    setStep('choice');
  };

  const handleGuestSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        board_id: boardInfo.board_id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        create_account: false,
        answers,
      };

      const res: any = await api.post('/api/v1/casting/guest-submit', payload);

      if (res.status === 'ok') {
        setSubmissionId(res.submission_id);
        setStep('success');
        onSubmitSuccess?.(res.submission_id);
      } else {
        setError(res.message || 'Terjadi kesalahan saat submit');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountRegistration = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        board_id: boardInfo.board_id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        create_account: true,
        answers,
      };

      const res: any = await api.post('/api/v1/casting/guest-submit', payload);

      if (res.status === 'ok') {
        setSubmissionId(res.submission_id);
        setStep('success');
        // Redirect to registration page
        window.location.href = `/register?casting=${boardInfo.board_id}&email=${formData.email}`;
      } else {
        setError(res.message || 'Terjadi kesalahan saat submit');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step Info
  if (step === 'info') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Film className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="font-bold text-lg">{boardInfo.role_title}</h2>
            <p className="text-sm text-gray-600">{boardInfo.project_name}</p>
          </div>
        </div>

        {boardInfo.role_description && (
          <p className="text-sm text-gray-700 mb-6 p-3 bg-gray-50 rounded-lg">
            {boardInfo.role_description}
          </p>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleInfoSubmit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline w-4 h-4 mr-1" />
              Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan nama Anda"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline w-4 h-4 mr-1" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline w-4 h-4 mr-1" />
              Nomor Telepon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+62812345678"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Lanjutkan
          </button>
        </form>
      </div>
    );
  }

  // Step Questions
  if (step === 'questions') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-bold text-lg mb-6">Pertanyaan Casting</h2>

        <form onSubmit={(e) => { e.preventDefault(); handleQuestionsSubmit(); }} className="space-y-4">
          {boardInfo.guest_questions?.map((q, idx) => (
            <div key={idx}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {q.question}
              </label>

              {q.type === 'text' && (
                <input
                  type="text"
                  value={answers[q.question] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.question]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}

              {q.type === 'textarea' && (
                <textarea
                  value={answers[q.question] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.question]: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}

              {q.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {q.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={q.question}
                        value={opt}
                        checked={answers[q.question] === opt}
                        onChange={() => setAnswers({ ...answers, [q.question]: opt })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep('info')}
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Kembali
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Lanjutkan
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Step Choice (Guest or Account)
  if (step === 'choice') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-bold text-lg mb-6">Pilihan Akun</h2>

        <div className="space-y-3">
          <button
            onClick={handleGuestSubmit}
            disabled={isSubmitting}
            className="w-full p-4 border-2 border-indigo-200 hover:border-indigo-600 rounded-lg text-left transition-all hover:bg-indigo-50"
          >
            <p className="font-medium text-gray-900">Daftar sebagai Guest</p>
            <p className="text-xs text-gray-600 mt-1">
              Link edit profil akan dikirim ke email. Bisa daftar akun lengkap nanti.
            </p>
          </button>

          <button
            onClick={handleAccountRegistration}
            disabled={isSubmitting}
            className="w-full p-4 border-2 border-emerald-200 hover:border-emerald-600 rounded-lg text-left transition-all hover:bg-emerald-50"
          >
            <p className="font-medium text-gray-900">Buat Akun Sekarang</p>
            <p className="text-xs text-gray-600 mt-1">
              Set password dan selesaikan profil untuk karir entertainment Anda.
            </p>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setStep('questions')}
          className="w-full mt-4 text-sm text-gray-600 hover:text-gray-900 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  // Step Success
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6 text-center">
      <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
      <h2 className="font-bold text-lg text-gray-900 mb-2">Pendaftaran Berhasil</h2>
      <p className="text-gray-600 mb-4">
        Terima kasih telah mendaftar untuk casting <span className="font-medium">{boardInfo.role_title}</span>.
      </p>
      <p className="text-sm text-gray-500">
        ID Submission: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{submissionId}</code>
      </p>
      <p className="text-sm text-gray-600 mt-4">
        Kami akan menghubungi Anda jika terpilih untuk audisi. Pantau email Anda terus.
      </p>
    </div>
  );
}