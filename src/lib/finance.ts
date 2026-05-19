
export enum AmortizationType {
  SAC = 'SAC',
  PRICE = 'PRICE'
}

export interface Installment {
  numero: number;
  valorTotal: number;
  amortizacao: number;
  juros: number;
  saldoDevedor: number;
  vencimento: string;
  pago: boolean;
}

export function calculateSAC(valorFinanciado: number, taxaMensal: number, numParcelas: number, dataInicio: string): Installment[] {
  const installments: Installment[] = [];
  let saldoDevedor = valorFinanciado;
  const taxa = taxaMensal / 100;
  const amortizacaoFixa = Number((valorFinanciado / numParcelas).toFixed(2));
  
  const startDate = new Date(dataInicio);

  for (let i = 1; i <= numParcelas; i++) {
    const juros = Number((saldoDevedor * taxa).toFixed(2));
    let amortizacao = amortizacaoFixa;
    
    if (i === numParcelas) {
      amortizacao = saldoDevedor;
    }
    
    const valorTotal = Number((amortizacao + juros).toFixed(2));
    saldoDevedor = Number((saldoDevedor - amortizacao).toFixed(2));
    
    const dueDate = new Date(startDate);
    dueDate.setMonth(startDate.getMonth() + i);

    installments.push({
      numero: i,
      valorTotal,
      amortizacao,
      juros,
      saldoDevedor: Math.max(0, saldoDevedor),
      vencimento: dueDate.toISOString().split('T')[0],
      pago: false
    });
  }

  return installments;
}

export function calculatePrice(valorFinanciado: number, taxaMensal: number, numParcelas: number, dataInicio: string): Installment[] {
  const installments: Installment[] = [];
  let saldoDevedor = valorFinanciado;
  const taxa = taxaMensal / 100;
  
  // PMT = PV * [i(1+i)^n] / [(1+i)^n - 1]
  const pmt = valorFinanciado * (taxa * Math.pow(1 + taxa, numParcelas)) / (Math.pow(1 + taxa, numParcelas) - 1);
  const valorParcelaFixa = Number(pmt.toFixed(2));
  
  const startDate = new Date(dataInicio);

  for (let i = 1; i <= numParcelas; i++) {
    const juros = Number((saldoDevedor * taxa).toFixed(2));
    let amortizacao = Number((valorParcelaFixa - juros).toFixed(2));
    
    if (i === numParcelas) {
      amortizacao = saldoDevedor;
    }
    
    saldoDevedor = Number((saldoDevedor - amortizacao).toFixed(2));
    
    const dueDate = new Date(startDate);
    dueDate.setMonth(startDate.getMonth() + i);

    installments.push({
      numero: i,
      valorTotal: Number((amortizacao + juros).toFixed(2)),
      amortizacao,
      juros,
      saldoDevedor: Math.max(0, saldoDevedor),
      vencimento: dueDate.toISOString().split('T')[0],
      pago: false
    });
  }

  return installments;
}
