/**
 * AMBIENTAL PRO - VITRINE DE LOW TICKETS
 * Interações minimalistas e utilitários
 */

document.addEventListener('DOMContentLoaded', () => {
  // Efeito sutil de rastreamento do cursor nos cards (Micro-interação tech)
  const cards = document.querySelectorAll('.showcase-card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // Gerenciador de cliques nos botões de CTA
  const ctaButtons = document.querySelectorAll('.btn-cta');

  ctaButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const href = button.getAttribute('href');
      const targetUrl = button.getAttribute('data-product-url');

      // Se for apenas âncora/placeholder interno, exibe feedback visual amigável
      if (href && href.startsWith('#')) {
        e.preventDefault();
        
        // Se houver um targetUrl definido que não seja vazio, podemos redirecionar ou avisar
        showMinimalNotice(`Redirecionando para a página do produto...`, targetUrl);
      }
    });
  });

  /**
   * Notificação minimalista com visual Ambiental Pro
   */
  function showMinimalNotice(message, targetUrl) {
    const existingNotice = document.querySelector('.minimal-notice');
    if (existingNotice) existingNotice.remove();

    const notice = document.createElement('div');
    notice.className = 'minimal-notice';
    notice.innerHTML = `
      <div class="notice-inner">
        <span class="notice-indicator"></span>
        <div class="notice-content">
          <p class="notice-text">${message}</p>
          ${targetUrl ? `<span class="notice-url">${targetUrl}</span>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(notice);

    // Animação de entrada
    requestAnimationFrame(() => {
      notice.classList.add('visible');
    });

    // Se houver URL configurada, redireciona após breve transição
    if (targetUrl && targetUrl.startsWith('http')) {
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 700);
    } else {
      setTimeout(() => {
        notice.classList.remove('visible');
        setTimeout(() => notice.remove(), 400);
      }, 3500);
    }
  }
});
