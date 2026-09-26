import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', gap: 'var(--space-6)', padding: 'var(--space-20)' }}>
      <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>404</p>
      <h1 style={{ fontSize: 'clamp(56px, 6.94vw, 120px)', letterSpacing: '-0.04em', lineHeight: 1 }}>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <Link to="/">{t('notFound.back')}</Link>
    </main>
  );
}
