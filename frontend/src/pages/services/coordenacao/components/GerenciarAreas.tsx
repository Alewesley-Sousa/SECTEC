import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, BookOpen, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { getAreas, createArea, updateArea, deleteArea, type Area } from "../areas";

export default function GerenciarAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAreas = async () => {
    setLoading(true);
    try {
      const data = await getAreas();
      setAreas(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro ao carregar",
        text: error instanceof Error ? error.message : "Não foi possível buscar as áreas.",
        confirmButtonColor: "#15803d",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleOpenCreate = () => {
    setEditingArea(null);
    setNome("");
    setDescricao("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (area: Area) => {
    setEditingArea(area);
    setNome(area.nome);
    setDescricao(area.descricao || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingArea) {
        await updateArea(editingArea.id, { nome, descricao });
        Swal.fire({ icon: "success", title: "Área atualizada!", text: "As informações foram salvas.", confirmButtonColor: "#15803d", timer: 2000, showConfirmButton: false });
      } else {
        await createArea({ nome, descricao });
        Swal.fire({ icon: "success", title: "Área criada!", text: "A nova área foi cadastrada.", confirmButtonColor: "#15803d", timer: 2000, showConfirmButton: false });
      }
      setIsModalOpen(false);
      loadAreas();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Erro ao salvar", text: error instanceof Error ? error.message : "Tente novamente.", confirmButtonColor: "#15803d" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (area: Area) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Excluir área?",
      text: `Tem certeza que deseja excluir a área "${area.nome}"?`,
      showCancelButton: true,
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteArea(area.id);
        Swal.fire({ icon: "success", title: "Excluída!", text: "A área foi removida.", confirmButtonColor: "#15803d", timer: 2000, showConfirmButton: false });
        loadAreas();
      } catch (error) {
        Swal.fire({ icon: "error", title: "Erro ao excluir", text: error instanceof Error ? error.message : "A área pode estar em uso.", confirmButtonColor: "#15803d" });
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl flex items-center gap-2">
            <BookOpen className="text-sectec-600" size={24} />
            Gerenciar Áreas
          </h1>
          <p className="mt-1 text-sm text-slate-500">Cadastre e gerencie as áreas temáticas.</p>
        </div>
        <button onClick={handleOpenCreate} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sectec-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-sectec-800 active:scale-[0.98] sm:w-auto">
          <Plus size={16} /> Nova Área
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="animate-spin mr-2" size={20} /> Carregando...</div>
        ) : areas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sectec-50 flex items-center justify-center mb-4"><BookOpen size={24} className="text-sectec-600" /></div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">Nenhuma área cadastrada</h3>
            <p className="text-sm text-slate-400">Clique em "Nova Área" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Descrição</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {areas.map((area) => (
                  <tr key={area.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{area.nome}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{area.descricao || <span className="italic text-slate-300">Sem descrição</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(area)} className="p-2 rounded-lg text-slate-400 hover:bg-sectec-50 hover:text-sectec-600 transition-colors" title="Editar"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(area)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">{editingArea ? "Editar Área" : "Nova Área"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Área *</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Ciências Exatas" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-sectec-600 focus:outline-none focus:ring-2 focus:ring-sectec-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (opcional)</label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Breve descrição..." rows={3} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-sectec-600 focus:outline-none focus:ring-2 focus:ring-sectec-100" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting || !nome.trim()} className="flex items-center gap-2 rounded-lg bg-sectec-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sectec-800 disabled:opacity-50">
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />} {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}