import React, { useState } from 'react';
import { Activity, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function AdminComissoesPanel({ data, onRefresh }: any) {
  const [modalOpen, setModalOpen] = useState<any>(null);
  const [editForm, setEditForm] = useState({ valor_personalizado: 0, statusFinanceiro: '' });

  const handleEdit = (com: any, contract: any) => {
    setModalOpen({ com, contract });
    setEditForm({
      valor_personalizado: com.valor_personalizado || com.valor_calculado || 0,
      statusFinanceiro: contract.statusFinanceiro || 'Em Pagamento'
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      // 1. Atualizar status financeiro do contrato
      const res1 = await fetch(`/api/contracts/${modalOpen.contract.id}/admin-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusFinanceiro: editForm.statusFinanceiro })
      });

      // 2. Atualizar valor comissão se for Imóvel de Terceiros ou se quiserem alterar
      const res2 = await fetch(`/api/comissoes/${modalOpen.com.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_personalizado: Number(editForm.valor_personalizado) })
      });

      if (res1.ok && res2.ok) {
        toast.success('Dados atualizados com sucesso!');
        setModalOpen(null);
        onRefresh();
      } else {
        toast.error('Erro ao atualizar dados. Verifique sua conexão.');
      }
    } catch {
      toast.error('Erro ao conectar ao servidor.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative">
      <h2 className="font-bold text-gray-800 mb-6 flex items-center"><Activity size={18} className="mr-2 text-blue-600"/> Gestão Operacional e Comissões (Admin)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
                <tr>
                    <th className="px-4 py-3 font-bold text-xs uppercase text-gray-500">ID Contr.</th>
                    <th className="px-4 py-3 font-bold text-xs uppercase text-gray-500">Corretor</th>
                    <th className="px-4 py-3 font-bold text-xs uppercase text-gray-500">Contrato / Imóvel</th>
                    <th className="px-4 py-3 font-bold text-xs uppercase text-gray-500">Valor Imóvel</th>
                    <th className="px-4 py-3 font-bold text-xs uppercase text-gray-500">Comissão (R$)</th>
                    <th className="px-4 py-3 font-bold text-xs uppercase text-gray-500">Status Financ.</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {data.comissoes?.map((com: any) => {
                    const contract = data.contracts.find((c:any) => c.id === com.contrato_id);
                    const prop = contract ? data.properties.find((p:any) => p.id === contract.propertyId) : null;
                    return (
                    <tr key={com.id} className="hover:bg-blue-50">
                        <td className="px-4 py-3 text-xs font-bold">#{contract?.id}</td>
                        <td className="px-4 py-3 font-medium">{data.staff?.find((s:any) => s.matricula === com.corretor_matricula)?.nome || com.corretor_matricula}</td>
                        <td className="px-4 py-3 text-xs">{prop?.nome || 'N/A'} <br/><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{contract?.tipoContrato}</span></td>
                        <td className="px-4 py-3 font-bold text-gray-600">R$ {contract?.valorImovel?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-black text-green-600">
                          {com.valor_personalizado ? (
                            <span>R$ {com.valor_personalizado.toLocaleString()} <br/><span className="text-[10px] text-purple-500 uppercase tracking-widest">(Ajuste Manual)</span></span>
                          ) : com.valor_calculado ? (
                            <span>R$ {com.valor_calculado.toLocaleString()}</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold border ${contract?.statusFinanceiro === 'Atrasado' ? 'bg-red-100 text-red-700 border-red-200' : contract?.statusFinanceiro === 'Financiado' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{contract?.statusFinanceiro || 'Em Pagamento'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                           <button onClick={() => handleEdit(com, contract)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-full transition-colors" title="Editar Status Financeiro e Valor Manual"><Edit3 size={16}/></button>
                        </td>
                    </tr>
                    );
                })}
            </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed top-0 left-0 right-0 bottom-0 z-[100] bg-black/60 flex items-center justify-center p-4 h-screen w-screen">
             <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
                 <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Editar Contrato & Comissão</h3>
                 
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Status Financeiro Manual</label>
                        <select required className="w-full px-3 py-2 border rounded-md outline-none bg-white font-medium text-sm" value={editForm.statusFinanceiro} onChange={e => setEditForm({...editForm, statusFinanceiro: e.target.value})}>
                           <option value="Em Pagamento">Em Pagamento</option>
                           <option value="Financiado">Financiado (Caixa)</option>
                           <option value="Atrasado">Em Atraso (Crítico)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Comissão Devida (R$)</label>
                        <input type="number" required className="w-full px-3 py-2 border rounded-md outline-none font-bold text-sm" value={editForm.valor_personalizado} onChange={e => setEditForm({...editForm, valor_personalizado: Number(e.target.value)})} />
                        <p className="text-[10px] text-gray-400 mt-1">Isso sobrescreverá a regra automática (Lote, MCMV, etc). Usado primariamente para Imóveis de Terceiros.</p>
                    </div>

                    <div className="flex space-x-3 pt-4">
                       <button type="button" onClick={() => setModalOpen(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-md font-bold text-sm">Cancelar</button>
                       <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-sm shadow">Salvar Edição</button>
                    </div>
                 </form>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
