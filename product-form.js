import './product-form.css';

const products = {
  manualrac: 'Manual Prático de Remediação de Áreas Contaminadas',
  manualnovalei: 'Manual da Nova Lei de Licenciamento Ambiental',
  portfoliomapas: 'Seu Portfólio de Mapas Pronto em 30 Minutos'
};
const slug = document.body.dataset.product || 'manualrac';
const productName = products[slug] || 'Manual Prático de Remediação de Áreas Contaminadas';

// Endpoint da planilha Google Sheets (backup/destino complementar de cadastros)
const endpoint = 'https://script.google.com/macros/s/AKfycbzoQQtPl_TazLAIbacOSLYyq_fCulFa10Dv_Wd1DOR96Xsurd9_HeSKgsv9axxm9l4PTg/exec';

// Configure o destino individual quando o checkout estiver disponível.
const checkoutUrls = { manualrac: '', manualnovalei: '', portfoliomapas: '' };

// Helper para capturar e persistir UTMs da URL
function getUtms() {
  const utms = {};
  try {
    const cached = sessionStorage.getItem('ap_utms');
    if (cached) Object.assign(utms, JSON.parse(cached));
  } catch (e) {
    console.debug('SessionStorage error:', e);
  }

  const searchParams = new URLSearchParams(window.location.search);
  let updated = false;

  searchParams.forEach((val, key) => {
    const lowerKey = key.toLowerCase();
    const upperKey = key.toUpperCase();

    if (lowerKey.startsWith('utm_')) {
      utms[lowerKey] = val;
      updated = true;
    } else if (upperKey.includes('UTM_SOURCE') && !utms.utm_source) {
      utms.utm_source = val; updated = true;
    } else if (upperKey.includes('UTM_MEDIUM') && !utms.utm_medium) {
      utms.utm_medium = val; updated = true;
    } else if (upperKey.includes('UTM_CAMPAIGN') && !utms.utm_campaign) {
      utms.utm_campaign = val; updated = true;
    } else if (upperKey.includes('UTM_CONTENT') && !utms.utm_content) {
      utms.utm_content = val; updated = true;
    } else if (upperKey.includes('UTM_TERM') && !utms.utm_term) {
      utms.utm_term = val; updated = true;
    }
  });

  if (updated) {
    try {
      sessionStorage.setItem('ap_utms', JSON.stringify(utms));
    } catch (e) {
      console.debug('SessionStorage save error:', e);
    }
  }

  return utms;
}

// Inicializa a captura imediata de UTMs na carga da página
getUtms();

const dialog = document.createElement('dialog');
dialog.className = 'product-dialog';
dialog.setAttribute('aria-labelledby', 'product-form-title');
dialog.innerHTML = `
  <button class="form-close" type="button" aria-label="Fechar formulário">×</button>
  <h2 id="product-form-title">Preencha suas informações</h2>
  <p class="form-intro">Cadastre seu interesse em <strong>${productName}</strong>. As vendas ainda não estão disponíveis.</p>
  <form class="product-lead-form">
    <label>Nome completo<input name="nome" autocomplete="name" required maxlength="150" placeholder="Seu nome"></label>
    <div class="form-row">
      <label>E-mail<input type="email" name="email" autocomplete="email" required maxlength="254" placeholder="Seu e-mail"></label>
      <label>WhatsApp com DDD<input type="tel" name="telefone" autocomplete="tel-national" inputmode="tel" required placeholder="(11) 99999-9999"></label>
    </div>
    <label>Possui graduação completa?<select name="formacao" required><option value="">Selecione</option><option>Sim</option><option>Não</option></select></label>
    <label class="education-area" hidden>Qual é a sua área de formação?<input name="area" maxlength="150" placeholder="Sua profissão ou curso" disabled></label>
    <p class="form-consent">Ao enviar, você autoriza a Ambiental Pro a entrar em contato sobre este produto.</p>
    <p class="form-feedback" role="status" aria-live="polite"></p>
    <button class="btn form-submit" type="submit">CADASTRAR INTERESSE →</button>
  </form>`;
document.body.append(dialog);

const form = dialog.querySelector('form');
const phone = form.elements.telefone;
const educationArea = form.querySelector('.education-area');

form.elements.formacao.addEventListener('change', () => {
  const graduated = form.elements.formacao.value === 'Sim';
  educationArea.hidden = !graduated;
  form.elements.area.disabled = !graduated;
  form.elements.area.required = graduated;
  if (!graduated) form.elements.area.value = '';
});

let trigger;
function close() { dialog.close(); document.body.style.overflow = ''; trigger?.focus(); }
dialog.querySelector('.form-close').addEventListener('click', close);
dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
  }
});

phone.addEventListener('input', () => {
  phone.value = phone.value.replace(/[^\d()+\s-]/g, '').slice(0, 20);
  phone.setCustomValidity('');
});

document.querySelectorAll('a.btn[href="#oferta"], #purchase').forEach(button => {
  button.removeAttribute('disabled');
  if (button.id === 'purchase') button.textContent = 'QUERO TER ACESSO →';
  button.addEventListener('click', event => {
    event.preventDefault();
    trigger = button;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const digits = phone.value.replace(/\D/g, '');
  if (!/^\d{10,11}$/.test(digits)) {
    phone.setCustomValidity('Informe um WhatsApp com DDD, com 10 ou 11 números.');
    phone.reportValidity();
    return;
  }

  const submit = form.querySelector('[type="submit"]');
  const feedback = form.querySelector('.form-feedback');
  const utms = getUtms();
  const formData = Object.fromEntries(new FormData(form));

  const payload = {
    ...formData,
    name: formData.nome,
    nome: formData.nome,
    telefone: digits,
    phone: digits,
    whatsapp: digits,
    formacao: formData.formacao,
    education: formData.formacao,
    area: formData.area || '',
    education_area: formData.area || '',
    course: slug,
    slug: slug,
    product: productName,
    ...utms
  };

  // Disparo de evento Lead no Meta Pixel (se existir na página)
  if (typeof window.fbq === 'function') {
    try {
      window.fbq('track', 'Lead');
    } catch (e) {
      console.debug('Pixel error:', e);
    }
  }

  // Disparo de evento no GTM dataLayer (se existir na página)
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: 'lead',
      product: slug,
      product_name: productName
    });
  }

  submit.disabled = true;
  submit.textContent = 'ENVIANDO...';
  feedback.textContent = '';

  try {
    // 1. Envio para a API ActiveCampaign (/api/subscribe) com tags e UTMs
    const subscribePromise = fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async res => {
      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[API Subscribe]', res.status, errorText);
      }
      return res;
    }).catch(err => {
      console.warn('[API Subscribe Error]:', err);
      return null;
    });

    // 2. Envio paralelo para o endpoint da planilha Google Sheets
    const sheetPromise = fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn('[Google Sheets Error]:', err);
      return null;
    });

    await Promise.allSettled([subscribePromise, sheetPromise]);

    if (checkoutUrls[slug]) {
      const checkoutUrlObj = new URL(checkoutUrls[slug], window.location.href);
      Object.entries(utms).forEach(([k, v]) => checkoutUrlObj.searchParams.set(k, v));
      location.assign(checkoutUrlObj.toString());
      return;
    }

    feedback.textContent = 'Solicitação enviada. As vendas ainda não estão disponíveis.';
    submit.textContent = 'SOLICITAÇÃO ENVIADA';
  } catch {
    feedback.textContent = 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.';
    submit.disabled = false;
    submit.textContent = 'TENTAR NOVAMENTE →';
  }
});
