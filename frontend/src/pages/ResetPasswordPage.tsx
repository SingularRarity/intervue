import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#1E2235] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-primary-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Reset your password</h1>
          <p className="text-dark-400 text-sm leading-relaxed">
            Password reset is handled directly by our team. Email us at{' '}
            <a
              href="mailto:info@singularraritylabs.com"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              info@singularraritylabs.com
            </a>{' '}
            and we'll get you sorted within 24 hours.
          </p>
        </div>

        <a
          href="mailto:info@singularraritylabs.com"
          className="btn-primary-dark w-full justify-center mb-4"
        >
          <Mail className="w-4 h-4" />
          Email info@singularraritylabs.com
        </a>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
