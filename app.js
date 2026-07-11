(function () {
  // 部署 Google Apps Script 後，把拿到的網址貼在這裡（設定步驟見 README.md）
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1RJbNrIhgjzM7div_fRPFTWMLpxJIC7n0wOyf708Octv4vaN_dGx4HDSU9cl-WyXm/exec';

  let currentLang = 'zh-TW';

  function t(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || I18N['zh-TW'][key] || '';
  }

  function fillSelect(select, values, placeholder) {
    select.innerHTML = '';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = placeholder;
    opt0.disabled = true;
    opt0.selected = true;
    select.appendChild(opt0);
    values.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  function daysInMonth(year, month) {
    const lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2) {
      if (!year) return 29;
      const y = Number(year);
      const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      return isLeap ? 29 : 28;
    }
    return lengths[month - 1];
  }

  function updateDaySelect() {
    const yearSel = document.getElementById('birthYear');
    const monthSel = document.getElementById('birthMonth');
    const daySel = document.getElementById('birthDay');
    const month = Number(monthSel.value) || null;
    const currentDay = daySel.value;
    const maxDays = month ? daysInMonth(yearSel.value, month) : 31;
    const days = [];
    for (let d = 1; d <= maxDays; d++) days.push(String(d).padStart(2, '0'));
    fillSelect(daySel, days, t('day_placeholder'));
    if (currentDay && Number(currentDay) <= maxDays) daySel.value = currentDay;
  }

  function refreshBirthSelects() {
    const yearSel = document.getElementById('birthYear');
    const monthSel = document.getElementById('birthMonth');
    const currentYear = yearSel.value;
    const currentMonth = monthSel.value;
    const thisYear = new Date().getFullYear();
    const years = [];
    for (let y = thisYear; y >= thisYear - 100; y--) years.push(String(y));
    const months = [];
    for (let m = 1; m <= 12; m++) months.push(String(m).padStart(2, '0'));

    fillSelect(yearSel, years, t('year_placeholder'));
    if (currentYear) yearSel.value = currentYear;
    fillSelect(monthSel, months, t('month_placeholder'));
    if (currentMonth) monthSel.value = currentMonth;
    updateDaySelect();
  }

  function initBirthSelects() {
    document.getElementById('birthYear').addEventListener('change', updateDaySelect);
    document.getElementById('birthMonth').addEventListener('change', updateDaySelect);
    refreshBirthSelects();
  }

  function initRegionSelects() {
    const countySel = document.getElementById('county');
    const districtSel = document.getElementById('district');
    fillSelect(countySel, Object.keys(TW_REGIONS), t('county_placeholder'));
    fillSelect(districtSel, [], t('district_placeholder'));

    countySel.addEventListener('change', () => {
      const districts = TW_REGIONS[countySel.value] || [];
      fillSelect(districtSel, districts, t('district_placeholder'));
    });
  }

  function initGenderPills() {
    const pills = document.querySelectorAll('#genderPills .pill');
    const hidden = document.getElementById('gender');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        hidden.value = pill.dataset.value;
      });
    });
  }

  function initCountryPicker() {
    const countrySel = document.getElementById('addressCountry');
    countrySel.addEventListener('change', () => {
      const isTW = countrySel.value === 'TW';
      document.getElementById('addressTW').classList.toggle('hidden', !isTW);
      document.getElementById('addressINTL').classList.toggle('hidden', !(countrySel.value === 'OTHER'));
    });
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key === 'consent_text' || key === 'privacy_link') return;
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });

    const consentText = document.getElementById('consentText');
    consentText.innerHTML = '';
    consentText.appendChild(document.createTextNode(t('consent_prefix')));
    const link = document.createElement('a');
    link.href = 'https://www.bkhuntington.com/policies/privacy-policy';
    link.target = '_blank';
    link.textContent = t('privacy_link');
    consentText.appendChild(link);
    consentText.appendChild(document.createTextNode(t('consent_suffix')));

    const countySel = document.getElementById('county');
    const districtSel = document.getElementById('district');
    const currentCounty = countySel.value;
    fillSelect(countySel, Object.keys(TW_REGIONS), t('county_placeholder'));
    if (currentCounty) countySel.value = currentCounty;
    fillSelect(districtSel, TW_REGIONS[currentCounty] || [], t('district_placeholder'));

    refreshBirthSelects();
  }

  function initLangSwitcher() {
    const toggle = document.getElementById('langToggle');
    const menu = document.getElementById('langMenu');
    const label = document.getElementById('langLabel');

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => menu.classList.add('hidden'));

    menu.querySelectorAll('button[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentLang = btn.dataset.lang;
        label.textContent = LANG_NAMES[currentLang];
        document.documentElement.lang = currentLang;
        menu.classList.add('hidden');
        applyTranslations();
      });
    });
  }

  function showError(msg) {
    const el = document.getElementById('formError');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function clearError() {
    document.getElementById('formError').classList.add('hidden');
  }

  function initForm() {
    const form = document.getElementById('intakeForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      const name = document.getElementById('name').value.trim();
      const dialCode = document.getElementById('phoneCountryCode').value;
      const phoneNumber = document.getElementById('phoneNumber').value.trim();
      const consent = document.getElementById('consent').checked;

      if (!name) return showError(t('error_name_required'));
      if (!dialCode) return showError(t('error_dialcode_required'));
      if (!phoneNumber) return showError(t('error_phone_required'));
      if (!consent) return showError(t('error_consent_required'));

      const countryChoice = document.getElementById('addressCountry').value;
      const isTW = countryChoice === 'TW';
      const addressType = isTW ? 'TW' : 'INTL';

      const payload = {
        name,
        gender: document.getElementById('gender').value || null,
        phone_country_code: dialCode,
        phone_number: phoneNumber,
        birth_year: document.getElementById('birthYear').value || null,
        birth_month: document.getElementById('birthMonth').value || null,
        birth_day: document.getElementById('birthDay').value || null,
        email: document.getElementById('email').value.trim() || null,
        address_type: addressType,
        county: isTW ? (document.getElementById('county').value || null) : null,
        district: isTW ? (document.getElementById('district').value || null) : null,
        address_detail: isTW
          ? (document.getElementById('addressDetail').value.trim() || null)
          : (document.getElementById('addressDetailIntl').value.trim() || null),
        marketing_consent: consent,
        language: currentLang,
      };

      const submitBtn = form.querySelector('.submit-btn');
      submitBtn.disabled = true;

      try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!result.ok) throw new Error('submit_failed');

        form.classList.add('hidden');
        document.getElementById('successPanel').classList.remove('hidden');
      } catch (err) {
        showError(t('error_generic'));
        submitBtn.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initBirthSelects();
    initRegionSelects();
    initCountryPicker();
    initGenderPills();
    initLangSwitcher();
    initForm();
    applyTranslations();
  });
})();
