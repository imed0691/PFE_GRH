import { useLanguage } from '../i18n/LanguageContext';
import './LanguageSwitcher.css';

const langOptions = [
  { code: 'en', label: 'English', sub: 'EN' },
  { code: 'fr', label: 'Français', sub: 'FR' },
  { code: 'ar', label: 'العربية', sub: 'AR' },
];

function LanguageSwitcher({ variant = 'pill' }) {
  const { lang, setLang } = useLanguage();

  if (variant === 'boxed') {
    return (
      <div className="boxed-lang-switcher">
        {langOptions.map((o) => (
          <button
            key={o.code}
            className={`boxed-lang-btn ${lang === o.code ? 'active' : ''}`}
            onClick={() => setLang(o.code)}
          >
            <span className="boxed-lang-code">{o.sub}</span>
            <span className="boxed-lang-label">{o.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mnadm-lang-pill">
      {langOptions.map((o) => (
        <button
          key={o.code}
          className={`lang-pill-item ${lang === o.code ? 'active' : ''}`}
          onClick={() => setLang(o.code)}
        >
          {o.sub}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
