import { useLanguage } from '../i18n/LanguageContext';
import './LanguageSwitcher.css';

const langOptions = [
  { code: 'en', label: 'English', sub: 'EN' },
  { code: 'fr', label: 'Français', sub: 'FR' },
  { code: 'ar', label: 'العربية', sub: 'AR' },
];

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="modern-lang-switcher">
      {langOptions.map((o) => (
        <button
          key={o.code}
          className={`lang-btn ${lang === o.code ? 'active' : ''}`}
          onClick={() => setLang(o.code)}
        >
          <span className="lang-code">{o.sub}</span>
          <span className="lang-label">{o.label}</span>
          {lang === o.code && <span className="active-dot"></span>}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
