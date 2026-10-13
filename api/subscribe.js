/**
 * Endpoint serverless para inscrição e trackeamento de leads no ActiveCampaign
 * Compatível com Vercel Serverless Functions e middleware de desenvolvimento Vite
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    name,
    nome,
    email,
    phone,
    telefone,
    whatsapp,
    formacao,
    education,
    area,
    education_area,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    slug = 'manualrac'
  } = req.body || {};

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return res.status(400).json({ message: 'Email é obrigatório' });
  }

  const API_KEY = process.env.ACTIVE_API_KEY || process.env.API_KEY_ACTIVE;
  if (!API_KEY) {
    console.error('[API Subscribe Error] ACTIVE_API_KEY não configurada nas variáveis de ambiente.');
    return res.status(500).json({ message: 'Erro de configuração no servidor: ACTIVE_API_KEY ausente.' });
  }

  const API_URL = 'https://ambientalpro.api-us1.com/api/3';

  // Configuração por produto com IDs de tags e campos customizados no ActiveCampaign
  const PRODUCT_MAPPINGS = {
    manualrac: {
      tagId: '492', // [LOWTICKET][REMEDIACAO] Lead
      fields: {
        content: '926',      // [LOWTICKET][REMEDIACAO] UTM Content
        term: '927',         // [LOWTICKET][REMEDIACAO] UTM Term
        subscribeDate: '928',// [LOWTICKET][REMEDIACAO] UTM Data de Inscrição
        education: '929',    // [LOWTICKET][REMEDIACAO] UTM Possui Graduação
        educationArea: '930',// [LOWTICKET][REMEDIACAO] UTM Área de Formação
        campaign: '931',     // [LOWTICKET][REMEDIACAO] UTM Campaign
        source: '932',       // [LOWTICKET][REMEDIACAO] UTM Source
        medium: '933'        // [LOWTICKET][REMEDIACAO] UTM Medium
      }
    },
    manualnovalei: {
      tagId: '494', // [LOWTICKET][MANUALNOVALEI] Lead
      fields: {
        content: '934',
        term: '935',
        subscribeDate: '936',
        education: '937',
        educationArea: '938',
        campaign: '939',
        source: '940',
        medium: '941'
      }
    },
    portfoliomapas: {
      tagId: '497', // [LOWTICKET][PORTFOLIODEMAPAS] Lead
      fields: {
        content: '942',
        term: '943',
        subscribeDate: '944',
        education: '945',
        educationArea: '946',
        campaign: '947',
        source: '948',
        medium: '949'
      }
    }
  };

  const productConfig = PRODUCT_MAPPINGS[slug];
  if (!productConfig) {
    return res.status(400).json({ message: 'Produto não configurado para cadastro' });
  }

  // Sanitização de telefone: DDD + número (10 ou 11 dígitos, sem DDI 55)
  const rawPhone = (phone || telefone || whatsapp || '').toString().trim();
  let digitsOnly = rawPhone.replace(/\D/g, '');
  let cleanPhone = digitsOnly;
  if (digitsOnly.startsWith('55') && (digitsOnly.length === 12 || digitsOnly.length === 13)) {
    cleanPhone = digitsOnly.substring(2);
  }

  // Separação de nome em primeiro nome e sobrenome
  const rawName = (nome || name || '').trim();
  const nameParts = rawName ? rawName.split(/\s+/) : [''];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  // Data e hora de inscrição formatada (America/Sao_Paulo)
  const now = new Date();
  const dateBR = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/');
  const timeBR = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false });
  const currentDateTime = dateBR.length === 3 
    ? `${dateBR[2]}-${dateBR[1].padStart(2, '0')}-${dateBR[0].padStart(2, '0')}T${timeBR}-03:00`
    : now.toISOString();

  // Helper para adicionar campo aos fieldValues somente se houver valor
  const fieldValues = [];
  const addField = (fieldId, value) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      fieldValues.push({ field: String(fieldId), value: String(value).trim() });
    }
  };

  // Mapeamento dos campos UTM e de formulário
  const gradVal = formacao || education || '';
  const areaVal = area || education_area || '';

  addField(productConfig.fields.content, utm_content);
  addField(productConfig.fields.term, utm_term);
  addField(productConfig.fields.subscribeDate, currentDateTime);
  addField(productConfig.fields.education, gradVal);
  addField(productConfig.fields.educationArea, areaVal);
  addField(productConfig.fields.campaign, utm_campaign);
  addField(productConfig.fields.source, utm_source);
  addField(productConfig.fields.medium, utm_medium);

  const contactPayload = {
    contact: {
      email: cleanEmail,
      firstName,
      lastName,
      phone: cleanPhone,
      fieldValues
    }
  };

  try {
    // 1. Sincroniza ou cria contato no ActiveCampaign
    const contactResponse = await fetch(`${API_URL}/contact/sync`, {
      method: 'POST',
      headers: {
        'Api-Token': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactPayload)
    });

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error('[ActiveCampaign Sync Error]:', errorText);
      return res.status(contactResponse.status).json({
        message: 'Falha ao sincronizar contato no ActiveCampaign',
        details: errorText
      });
    }

    const contactData = await contactResponse.json();
    const contactId = contactData.contact?.id;

    // 2. Aplica a tag no contato
    if (contactId && productConfig.tagId) {
      const tagPayload = {
        contactTag: {
          contact: contactId,
          tag: productConfig.tagId
        }
      };

      const tagResponse = await fetch(`${API_URL}/contactTags`, {
        method: 'POST',
        headers: {
          'Api-Token': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tagPayload)
      });

      if (!tagResponse.ok) {
        const tagError = await tagResponse.text();
        console.warn('[ActiveCampaign Tag Warning]:', tagError);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Lead registrado com sucesso!',
      contactId
    });

  } catch (error) {
    console.error('[Subscribe Error]:', error);
    return res.status(500).json({
      message: 'Erro interno ao processar cadastro',
      error: error.message
    });
  }
}
