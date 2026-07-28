 export function formatarMensagemErroQuantidade(mensagem: string): string {
    const numeros = mensagem.match(/\d+/g);
    if (!numeros || numeros.length < 3) {
        return `<div style="font-size:14px; color:#475569; line-height:1.5;">${mensagem}</div>`;
    }

    const [novaQuantidade, qtdAtribuida, diferenca] = numeros;

    return `
    <div style="text-align:left; display:flex; flex-direction:column; gap:12px;">
      <div style="display:flex; gap:12px; background:#fef3c7; border:1px solid #fcd34d; border-radius:12px; padding:16px; align-items:flex-start;">
        <span style="font-size:24px; line-height:1;">⚠️</span>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <p style="font-size:14px; font-weight:600; color:#92400e; margin:0;">
            Não é possível reduzir a quantidade para 
            <strong style="color:#dc2626; background:#fef2f2; padding:2px 8px; border-radius:9999px;">${novaQuantidade}</strong>
          </p>
          <p style="font-size:14px; color:#475569; margin:0;">
            O aluno já possui 
            <strong style="color:#1e293b; background:#fff; padding:2px 6px; border-radius:6px; border:1px solid #e2e8f0;">${qtdAtribuida} projeto(s)</strong> 
            atribuído(s).
          </p>
          <p style="font-size:14px; font-weight:500; color:#334155; background:#fff; border-radius:8px; padding:12px; border:1px solid #f1f5f9; margin:0;">
            Para prosseguir, remova 
            <strong style="color:#dc2626;">${diferenca} projeto(s)</strong> 
            antes de atualizar.
          </p>
        </div>
      </div>
    </div>
  `;
}