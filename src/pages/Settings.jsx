import React, { useState } from 'react';
import translations from '../translations';


const Settings = () => {
  // Removed darkMode state
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const t = translations[language];
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    localStorage.setItem('language', e.target.value);
  };
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('fontSize') || '16', 10));
  // const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Removed handleThemeToggle

  // Handle font size change
  const handleFontSize = (change) => {
    let newSize = fontSize + change;
    if (newSize < 12) newSize = 12;
    if (newSize > 28) newSize = 28;
    setFontSize(newSize);
    document.body.style.fontSize = `${newSize}px`;
    localStorage.setItem('fontSize', newSize);
  };



  return (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: '#e3f2fd', padding: '40px 0' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <h2 style={{
          fontWeight: 700,
          fontSize: 28,
          marginBottom: 28,
          letterSpacing: 1,
          color: '#23272f'
        }}>{t.settings}</h2>
        {/* Accessibility: Font Size */}
        <div style={{ marginBottom: 32, padding: '18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 18, flex: 1 }}>{t.accessibility}</span>
            <button onClick={() => handleFontSize(-2)} style={{ marginRight: 8, fontSize: 20, padding: '4px 12px', borderRadius: 4, border: '1px solid #bbb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label={t.decreaseFont}>
              <span style={{fontSize: 22, fontWeight: 900, lineHeight: 1, display: 'block', color: '#000'}}>-</span>
            </button>
            <span style={{ fontWeight: 500, fontSize: 16 }}>{fontSize}px</span>
            <button onClick={() => handleFontSize(2)} style={{ marginLeft: 8, fontSize: 20, padding: '4px 12px', borderRadius: 4, border: '1px solid #bbb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label={t.increaseFont}>
              <span style={{fontSize: 24, fontWeight: 900, lineHeight: 1, display: 'block', color: '#000'}}>+</span>
            </button>
          </div>
          <div style={{ color: '#23272f', fontSize: 15, marginLeft: 2, marginBottom: 18 }}>
            {t.adjustFont}
          </div>
          {/* Language Selector under Accessibility */}
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 18 }}>{t.language}</span>
            <select value={language} onChange={handleLanguageChange} style={{ fontSize: 16, padding: '4px 12px', borderRadius: 4, border: '1px solid #bbb', marginLeft: 12 }}>
              <option value="en">English</option>
              <option value="tl">Tagalog</option>
            </select>
          </div>
          <div style={{ color: '#23272f', fontSize: 15, marginLeft: 2 }}>
            {language === 'en'
              ? 'Change the app language for easier understanding.'
              : 'Palitan ang wika ng app para mas madaling maintindihan.'}
          </div>
        </div>



        {/* Legal & Info Section */}
  <div style={{ marginTop: 40, padding: '18px 0 0 0', borderTop: '1px solid #e0e0e0' }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, color: '#23272f' }}>{t.userAgreement}</div>
          <div style={{ fontSize: 16, color: '#23272f', marginBottom: 18 }}>
            {t.userAgreementText}<br />
            <ul style={{ margin: '8px 0 8px 24px' }}>
              {t.rules.map((rule, idx) => <li key={idx}>{rule}</li>)}
            </ul>
            {t.punishment}
          </div>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8, color: '#23272f' }}>{t.privacyPolicy}</div>
          <div style={{ fontSize: 16, color: '#23272f', marginBottom: 18, whiteSpace: 'pre-line' }}>
            {t.privacyPolicyText}
          </div>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8, color: '#23272f' }}>{t.dataPolicy}</div>
          <div style={{ fontSize: 16, color: '#23272f', marginBottom: 18, whiteSpace: 'pre-line' }}>
            {t.dataPolicyText}
          </div>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8, color: '#23272f' }}>{t.about}</div>
          <div style={{ fontSize: 16, color: '#23272f', whiteSpace: 'pre-line' }}>
            {t.aboutText}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
