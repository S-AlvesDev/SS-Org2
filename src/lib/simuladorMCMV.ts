import { Request, Response } from 'express';

// Lógica isolada para não poluir o server.ts (Service Layer Pattern)
export const handleSimulacaoMCMV = (req: Request, res: Response) => {
  try {
    const { 
      valor_imovel, 
      renda_bruta_familiar: renda_bruta, 
      prazo_meses = 420, 
      sistema_amortizacao = 'SAC',
      tem_3_anos_fgts = false, 
      tem_dependente = false, 
      saldo_fgts = 0, 
      regiao_imovel = 'Sudeste', 
      subsidio_maximo_municipio = 0,
      idade_comprador_principal = 30
    } = req.body;

    if (!valor_imovel || !renda_bruta || !regiao_imovel || subsidio_maximo_municipio == null) {
      return res.status(422).json({ error: 'Parâmetros obrigatórios ausentes ou inválidos no payload.' });
    }

    if (valor_imovel <= 0 || renda_bruta <= 0 || prazo_meses < 120 || prazo_meses > 420) {
      return res.status(422).json({ error: 'Valores fornecidos fora do range permitido (ex: Prazo 120-420, Renda > 0).' });
    }

    let taxa_juros_anual = 0;
    let limite_imovel = 0;
    let subsidio = 0;

    // Regras Faixas MCMV 2026
    if (renda_bruta <= 3200) { // Faixa 1
      limite_imovel = 275000;
      taxa_juros_anual = (regiao_imovel === 'Norte' || regiao_imovel === 'Nordeste') ? 4.0 : 4.5;
      if (tem_dependente) subsidio = subsidio_maximo_municipio;
    } else if (renda_bruta <= 5000) { // Faixa 2
      limite_imovel = 275000 + ((renda_bruta - 3200) / 1800) * (400000 - 275000); 
      if (limite_imovel > 400000) limite_imovel = 400000;
      const juros_base = 4.75;
      const juros_max = 6.50;
      taxa_juros_anual = juros_base + ((renda_bruta - 3200) / 1800) * (juros_max - juros_base);
      if (tem_dependente) {
        subsidio = Math.max(0, subsidio_maximo_municipio * (1 - ((renda_bruta - 3200) / 1800)));
      }
    } else if (renda_bruta <= 9600) { // Faixa 3
      limite_imovel = 400000;
      taxa_juros_anual = 7.66;
      subsidio = 0;
    } else if (renda_bruta <= 13000) { // Faixa 4
      limite_imovel = 600000;
      taxa_juros_anual = 10.50;
      subsidio = 0;
    } else {
      return res.status(422).json({ error: 'Renda bruta familiar acima do limite máximo permitido pelo programa (R$ 13.000).' });
    }

    if (valor_imovel > limite_imovel) {
      return res.status(400).json({ error: `O valor do imóvel (R$ ${valor_imovel.toFixed(2)}) supera o teto máximo permitido para a sua faixa de renda (R$ ${limite_imovel.toFixed(2)}).` });
    }

    if (tem_3_anos_fgts) {
      taxa_juros_anual = Math.max(0, taxa_juros_anual - 0.5);
    }

    let valor_financiado = valor_imovel * 0.8;
    const taxa_mensal = (taxa_juros_anual / 100) / 12; // Juros simples dividido por 12 (comercial banco) ou composto? No SFH usa juros / 12 nominal
    const teto_parcela = renda_bruta * 0.3;
    
    // Taxas Secundárias
    const TAXA_MIP_MENSAL = 0.00025; // 0.025%
    const TAXA_DFI_MENSAL = 0.00005; // 0.005%
    const TAF = 25.00;
    const valor_dfi_mensal = valor_imovel * TAXA_DFI_MENSAL;

    let parcelas = [];
    let aprovado = false;
    let tentativa_sistema = sistema_amortizacao;
    let teve_mudanca_para_price = false;

    // Iteração para achar o valor_financiado correto que caiba nos 30% da renda.
    // Primeiro tenta o sistema solicitado. Se falhar, e for SAC, tenta PRICE.
    const calcularParcelas = (sis: string, val_fin: number) => {
      let parc = [];
      let saldo = val_fin;
      let amortizacao_sac = val_fin / prazo_meses;
      let pmt_price = 0;
      if (sis === 'PRICE') {
          pmt_price = val_fin * (taxa_mensal * Math.pow(1 + taxa_mensal, prazo_meses)) / (Math.pow(1 + taxa_mensal, prazo_meses) - 1);
      }
      
      for (let m = 1; m <= prazo_meses; m++) {
          let juros = saldo * taxa_mensal;
          let amortizacao = sis === 'SAC' ? amortizacao_sac : pmt_price - juros;
          let mip = saldo * TAXA_MIP_MENSAL;
          let prestacao_total = amortizacao + juros + mip + valor_dfi_mensal + TAF;
          
          parc.push({
            mes: m,
            amortizacao,
            juros,
            seguro_mip: mip,
            seguro_dfi: valor_dfi_mensal,
            taxa_adm: TAF,
            parcela_total: prestacao_total,
            saldo_devedor_atual: saldo
          });
          saldo -= amortizacao;
      }
      return parc;
    };

    do {
       parcelas = calcularParcelas(tentativa_sistema, valor_financiado);
       let primeira_parcela = parcelas[0].parcela_total;

       if (primeira_parcela <= teto_parcela) {
           aprovado = true;
       } else {
           // Se excedeu 30%, nós podemos: 
           // 1. Mudar pra PRICE se estava no SAC e o cliente quer
           if (tentativa_sistema === 'SAC') {
               const parcelas_price_temp = calcularParcelas('PRICE', valor_financiado);
               if (parcelas_price_temp[0].parcela_total <= teto_parcela) {
                   tentativa_sistema = 'PRICE';
                   teve_mudanca_para_price = true;
                   continue;
               }
           }
           
           // 2. Reduz o valor financiado até aprovar
           let diff = primeira_parcela - teto_parcela;
           // ajuste grosso modo
           let slice = diff * 100;
           if (slice < 1000) slice = 1000;
           valor_financiado -= slice;
           
           if (valor_financiado <= 0) {
               valor_financiado = 0;
               aprovado = true; // aprovado com zero financiado (pagou tudo a vista?)
           }
       }
    } while (!aprovado && valor_financiado > 0);

    if (valor_financiado < 0) valor_financiado = 0;

    let entrada_exigida = valor_imovel - valor_financiado;
    let entrada_a_pagar = entrada_exigida - subsidio - (saldo_fgts || 0);
    if (entrada_a_pagar < 0) entrada_a_pagar = 0;

    let total_juros = 0;
    let total_pago = 0;
    parcelas.forEach(p => {
       total_juros += p.juros;
       total_pago += p.parcela_total;
    });

    // Custo cartório
    const custo_itbi_cartorio = valor_imovel * 0.04;

    res.json({
      resumo: {
        valor_imovel: Number(valor_imovel.toFixed(2)),
        valor_financiado: Number(valor_financiado.toFixed(2)),
        entrada_exigida: Number(entrada_exigida.toFixed(2)),
        entrada_a_pagar: Number(entrada_a_pagar.toFixed(2)),
        subsidio: Number(subsidio.toFixed(2)),
        taxa_juros_anual_aplicada: Number(taxa_juros_anual.toFixed(2)),
        sistema_amortizacao_final: tentativa_sistema,
        alerta_mudanca_sistema: teve_mudanca_para_price,
        parcela_1: Number(parcelas[0]?.parcela_total.toFixed(2) || 0),
        ultima_parcela: Number(parcelas[parcelas.length-1]?.parcela_total.toFixed(2) || 0),
        total_juros_pago: Number(total_juros.toFixed(2)),
        total_pago_final: Number(total_pago.toFixed(2)),
        custos: {
           estimativa_itbi_registro: Number(custo_itbi_cartorio.toFixed(2)),
           doc_gratis: false // construtora oferece? (flag fake requirement)
        }
      },
      projecao: parcelas.map(p => ({
        mes: p.mes,
        amortizacao: Number(p.amortizacao.toFixed(2)),
        juros: Number(p.juros.toFixed(2)),
        seguro_mip: Number(p.seguro_mip.toFixed(2)),
        seguro_dfi: Number(p.seguro_dfi.toFixed(2)),
        taxa_adm: Number(p.taxa_adm.toFixed(2)),
        parcela_total: Number(p.parcela_total.toFixed(2)),
        saldo_devedor: Number(Math.max(0, p.saldo_devedor_atual - p.amortizacao).toFixed(2))
      }))
    });
    
  } catch (e: any) {
    res.status(500).json({ error: 'Erro no cálculo atuarial/simulação.', details: e.message });
  }
};
