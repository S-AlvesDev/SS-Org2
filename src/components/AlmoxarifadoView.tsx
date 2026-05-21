import React, { useState } from 'react';
import { PackageMinus, PackagePlus, Clock, PackageSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Fundação e Estrutura',
  'Alvenaria e Vedação',
  'Instalações Elétricas/Hidráulicas',
  'Acabamento e Revestimento'
];

export default function AlmoxarifadoView({ data, user, onRefresh }: any) {
  const [form, setForm] = useState({ material_id: '', tipo_operacao: 'SAIDA', quantidade: '', funcionario_matricula: '', justificativa: '' });
  const [activeTab, setActiveTab] = useState(CATEGORIES[0]);
  const [historyModal, setHistoryModal] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantidade <= 0) return toast.error('Quantidade deve ser maior que zero.');
    try {
      const res = await fetch(`/api/materials/${form.material_id}/movement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...form, funcionario_matricula: user.matricula}) 
      });
      if (res.ok) {
        toast.success('Movimentação registrada com sucesso!');
        setForm({ ...form, quantidade: 0, justificativa: '', funcionario_matricula: '' });
        onRefresh();
      } else {
        const err = await res.json();
        toast.error('Erro: ' + (err.details || err.error));
      }
    } catch {
      toast.error('Erro ao conectar ao servidor.');
    }
  };

  const filteredMaterials = data.materials?.filter((m: any) => m.categoria === activeTab) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
         <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center"><PackageSearch className="mr-2 text-blue-600"/> Painel do Almoxarifado</h2>
            <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Gestão Setorizada de Materiais</p>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar space-x-2 pb-2">
         {CATEGORIES.map(cat => (
           <button
             key={cat}
             onClick={() => { setActiveTab(cat); setForm({...form, material_id: ''}); }}
             className={`whitespace-nowrap px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
           >
             {cat}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Form */}
         <AnimatePresence mode="wait">
           <motion.div 
             key={activeTab}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100"
           >
              <h3 className="font-bold text-gray-700 mb-4 uppercase tracking-widest text-xs border-b pb-2">Registrar Movimentação</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <button type="button" onClick={() => setForm({...form, tipo_operacao: 'SAIDA'})} className={`py-3 rounded-lg text-xs font-bold uppercase transition-all flex flex-col items-center justify-center ${form.tipo_operacao === 'SAIDA' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                      <PackageMinus className="mb-1" size={18} /> Saída
                    </button>
                    <button type="button" onClick={() => setForm({...form, tipo_operacao: 'DEVOLUCAO'})} className={`py-3 rounded-lg text-xs font-bold uppercase transition-all flex flex-col items-center justify-center ${form.tipo_operacao === 'DEVOLUCAO' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                      <PackagePlus className="mb-1" size={18} /> Devolução
                    </button>
                  </div>
                  
                  <div>
                     <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1">Material em {activeTab}</label>
                     <select required className="w-full px-3 py-3 sm:py-2 border rounded-md outline-none bg-white text-sm" value={form.material_id} onChange={e => setForm({...form, material_id: e.target.value})}>
                        <option value="">Selecione o material...</option>
                        {filteredMaterials.map((m: any) => (
                           <option key={m.id} value={m.id}>{m.nome} (Estoque: {m.saldo_unidades})</option>
                        ))}
                     </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                       <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1">Qtd (Unidades)</label>
                       <input type="number" required min="1" className="w-full px-3 py-3 sm:py-2 border rounded-md outline-none text-sm" value={form.quantidade} onChange={e => setForm({...form, quantidade: Number(e.target.value)})} />
                    </div>
                    <div>
                       <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1">Matrícula (Responsável)</label>
                       <input required className="w-full px-3 py-3 sm:py-2 border rounded-md outline-none text-sm" placeholder="Ex: E1001" value={form.funcionario_matricula} onChange={e => setForm({...form, funcionario_matricula: e.target.value})} />
                    </div>
                  </div>

                  <div>
                     <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1">Finalidade da Retirada / Onde será usado</label>
                     <textarea required className="w-full px-3 py-3 sm:py-2 border rounded-md outline-none text-sm" rows={3} value={form.justificativa} onChange={e => setForm({...form, justificativa: e.target.value})}></textarea>
                  </div>

                  <button type="submit" className={`w-full text-white font-bold py-3 pt-4 pb-4 sm:py-3 rounded-md text-sm uppercase transition-all shadow-md ${form.tipo_operacao === 'SAIDA' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                     CONFIRMAR {form.tipo_operacao}
                  </button>
              </form>
           </motion.div>
         </AnimatePresence>

         {/* Extrato / List of Materials */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-[600px]">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-700 text-xs uppercase tracking-widest">Estoque: {activeTab}</h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
               {filteredMaterials.map((m: any) => {
                 const isCritico = m.saldo_unidades <= m.estoque_minimo;
                 return (
                   <div key={m.id} className={`group relative p-3 border-l-4 rounded-lg bg-gray-50 flex items-start justify-between overflow-hidden ${isCritico ? 'border-amber-400 bg-amber-50' : 'border-blue-400'}`}>
                      <div>
                         <p className="font-bold text-gray-800 text-sm">{m.nome}</p>
                         <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">Min: {m.estoque_minimo} | Fator: {m.fator_multiplicador}</p>
                      </div>
                      <div className="text-right">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${isCritico ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {m.saldo_unidades} {m.unidade_medida}
                         </span>
                         {isCritico && <p className="text-[10px] font-black text-amber-600 uppercase mt-1">Estoque Baixo</p>}
                      </div>
                      
                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 rounded-lg px-2">
                         <button 
                           onClick={() => { setForm({...form, material_id: m.id, tipo_operacao: 'SAIDA'}); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                           className="flex items-center space-x-1 px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-md text-xs font-bold uppercase transition-colors"
                         >
                           <PackageMinus size={14} /> <span>Saída</span>
                         </button>
                         <button 
                           onClick={() => { setForm({...form, material_id: m.id, tipo_operacao: 'DEVOLUCAO'}); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                           className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-xs font-bold uppercase transition-colors"
                         >
                           <PackagePlus size={14} /> <span>Devolução</span>
                         </button>
                         <button 
                           onClick={() => setHistoryModal(m)}
                           className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-xs font-bold uppercase transition-colors"
                         >
                           <Clock size={14} /> <span>Histórico</span>
                         </button>
                      </div>
                   </div>
                 );
               })}
               {filteredMaterials.length === 0 && (
                 <p className="text-center text-xs text-gray-400 italic mt-10">Nenhum material cadastrado nesta categoria.</p>
               )}
            </div>
         </div>
      </div>
      <AnimatePresence>
        {historyModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
             <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center mb-4 border-b pb-2">
                   <h3 className="text-lg font-bold text-gray-800 flex items-center"><Clock className="mr-2 text-blue-600" size={20}/> Histórico: {historyModal.nome}</h3>
                   <button onClick={() => setHistoryModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {data.materialMovements?.filter((mov: any) => mov.material_id === historyModal.id).map((mov: any) => (
                       <div key={mov.id} className="p-4 border rounded-lg bg-gray-50 flex items-start justify-between">
                          <div className="flex-1 mr-4">
                             <div className="flex items-center space-x-2 mb-2">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${mov.tipo_operacao === 'SAIDA' ? 'bg-amber-100 text-amber-700' : mov.tipo_operacao === 'DEVOLUCAO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {mov.tipo_operacao}
                               </span>
                               <span className="text-[10px] text-gray-400">{new Date(mov.created_at).toLocaleString()}</span>
                             </div>
                             <p className="text-sm text-gray-700 font-medium break-words leading-relaxed">{mov.justificativa || 'Sem justificativa detalhada'}</p>
                             <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold">Res.: {data.staff?.find((s:any) => s.matricula === mov.funcionario_matricula)?.nome || mov.funcionario_matricula}</p>
                          </div>
                          <div className="text-right whitespace-nowrap">
                             <p className={`text-lg font-black ${mov.tipo_operacao === 'SAIDA' ? 'text-amber-600' : mov.tipo_operacao === 'DEVOLUCAO' ? 'text-green-600' : 'text-blue-600'}`}>
                                {mov.tipo_operacao === 'SAIDA' ? '-' : '+'}{mov.quantidade} <span className="text-xs font-medium text-gray-500">{historyModal.unidade_medida}</span>
                             </p>
                          </div>
                       </div>
                    ))}
                    {(!data.materialMovements || data.materialMovements.filter((mov: any) => mov.material_id === historyModal.id).length === 0) && (
                       <p className="text-center text-sm text-gray-400 italic py-10">Nenhuma movimentação para este material.</p>
                    )}
                 </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
