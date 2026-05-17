import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

export interface RawPublication {
  processNumber: string;
  parties: string;
  publicationDate: string; // YYYY-MM-DD
  content: string;
}

export async function scrapeDJEN(customOab?: string, customState?: string): Promise<RawPublication[]> {
  const oabNumber = customOab || process.env.OAB_NUMBER;
  const oabState = customState || process.env.OAB_STATE;

  if (!oabNumber || !oabState) {
    throw new Error('OAB_NUMBER ou OAB_STATE não configurados');
  }

  console.log(`Iniciando Playwright para OAB ${oabNumber}/${oabState}...`);


  const browser = await chromium.launch({
    headless: true,
    timeout: 30000,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  const publications: RawPublication[] = [];

  try {
    console.log('Acessando portal Comunica PJe...');
    await page.goto('https://comunica.pje.jus.br/consulta', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 2. Aguardar hydration do React
    await page.waitForTimeout(3000);
    await page.waitForSelector('input[formcontrolname="oab"]', { state: 'visible', timeout: 15000 });

    // 3. Preencher campo OAB com OAB_NUMBER
    console.log('Preenchendo número da OAB...');
    await page.fill('input[formcontrolname="oab"]', oabNumber);
    await page.waitForTimeout(2000);

    // 4. Selecionar estado OAB_STATE
    console.log(`Selecionando estado da OAB: ${oabState}...`);
    await page.selectOption('select[formcontrolname="ufOab"]', { label: oabState });
    await page.waitForTimeout(2000);

    // 5. Clicar buscar e aguardar resultados
    console.log('Clicando em Buscar...');
    await page.click('button[type="submit"]');
    
    // Aguarda o carregamento dos resultados
    await page.waitForTimeout(5000);

    const cards = await page.$$('.card, tr.mat-row');

    console.log(`Encontrados ${cards.length} cartões/linhas de resultado.`);

    for (const card of cards) {
      await page.waitForTimeout(2000); // Delay de 2s entre ações (evitar rate limit)

      const textContent = await card.innerText();
      
      // Regex CNJ: \d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}
      const cnjMatch = textContent.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
      const processNumber = cnjMatch ? cnjMatch[0] : 'Número não identificado';

      const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const partiesLine = lines.find(l => l.toLowerCase().includes('polo') || l.toLowerCase().includes('autor') || l.toLowerCase().includes('réu') || l.toLowerCase().includes('advogado') || l.toLowerCase().includes('parte')) || lines[1] || 'Partes não identificadas';

      const dateMatch = textContent.match(/\d{2}\/\d{2}\/\d{4}/);
      let publicationDate = new Date().toISOString().split('T')[0];
      if (dateMatch) {
        const [day, month, year] = dateMatch[0].split('/');
        publicationDate = `${year}-${month}-${day}`;
      }

      const expandBtn = await card.$('button:has-text("Expandir"), button:has-text("Ver mais")');
      if (expandBtn) {
        await expandBtn.click();
        await page.waitForTimeout(1000);
      }

      const fullContent = await card.innerText();

      publications.push({
        processNumber,
        parties: partiesLine.substring(0, 250),
        publicationDate,
        content: fullContent.trim(),
      });
    }

  } catch (error) {
    console.error('Erro durante a execução do Playwright no DJEN:', error);
    throw error;
  } finally {
    console.log('Fechando navegador Playwright...');
    await browser.close();
  }

  return publications;
}
