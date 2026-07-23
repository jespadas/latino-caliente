import { languages } from './i18n';

export function LanguageSwitcher({ language, onLanguageChange, variant = 'dark' }) {
  return (
    <div className={`language-switcher ${variant}`} aria-label="Language selector">
      {languages.map((item) => (
        <button
          className={language === item.code ? 'active' : ''}
          key={item.code}
          onClick={() => onLanguageChange(item.code)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
