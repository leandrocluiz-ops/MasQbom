/* ===========================================================
   MasQbom — Precificação de Bolos (pote, caseiro, aniversário)
   Toda a base de dados fica salva no localStorage do navegador.
   =========================================================== */

const STORAGE_KEY = "masqbom_dados_v2";

/* Configuração de cada categoria de bolo.
   Isso é o que muda entre "Bolo de Pote", "Bolo Caseiro" e "Bolo de Aniversário". */
const CATEGORIAS = {
  potes: {
    titulo: "Bolo de Pote",
    dica: "Monte a receita de um sabor, informe quantos potes ela rende e os custos extras. O sistema calcula o custo real e sugere o preço de venda.",
    nomePlaceholder: "Ex: Ninho com Nutella",
    rendimentoLabel: "Quantos potes essa receita rende?",
    unidadeProduto: "pote(s)",
    custosTitulo: "Custos extras por pote",
    custos: [
      { key: "custo1", label: "Pote + tampa + colher (R$)" },
      { key: "custo2", label: "Etiqueta / rótulo (R$)" },
      { key: "custo3", label: "Outros (gás, luz, entrega) (R$)" }
    ]
  },
  caseiro: {
    titulo: "Bolo Caseiro",
    dica: "Monte a receita do bolo caseiro (aquele de forma, vendido inteiro ou por fatia), informe quantas fatias ele rende e os custos extras.",
    nomePlaceholder: "Ex: Bolo de fubá com goiabada",
    rendimentoLabel: "Quantas fatias/porções esse bolo rende?",
    unidadeProduto: "fatia(s)",
    custosTitulo: "Custos extras por fatia",
    custos: [
      { key: "custo1", label: "Embalagem / forma descartável (R$)" },
      { key: "custo2", label: "Cobertura / decoração simples (R$)" },
      { key: "custo3", label: "Outros (gás, luz, entrega) (R$)" }
    ]
  },
  aniversario: {
    titulo: "Bolo de Aniversário",
    dica: "Monte a receita do bolo (massa + recheios), informe quantas fatias ele rende e os custos de decoração para calcular o preço da encomenda.",
    nomePlaceholder: "Ex: Bolo 2 andares chocolate com morango",
    rendimentoLabel: "Quantas fatias esse bolo rende?",
    unidadeProduto: "fatia(s)",
    custosTitulo: "Custos extras da encomenda (total, não por fatia)",
    custos: [
      { key: "custo1", label: "Recheio extra / cobertura (R$)" },
      { key: "custo2", label: "Decoração / topo de bolo (R$)" },
      { key: "custo3", label: "Aluguel de utensílios / entrega (R$)" }
    ]
  }
};

/* Para bolo de pote e caseiro os custos extras são "por unidade".
   Para bolo de aniversário, como normalmente é uma encomenda única,
   os custos extras são lançados como valor TOTAL da encomenda. */
const CUSTO_EXTRA_E_TOTAL = { potes: false, caseiro: false, aniversario: true };

let dados = carregarDados();
const produtoEditando = { potes: null, caseiro: null, aniversario: null };

function carregarDados(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(!parsed.produtos || Array.isArray(parsed.produtos)){
        // formato antigo (v1): produtos era uma lista única -> migra para "potes"
        const antigos = Array.isArray(parsed.produtos) ? parsed.produtos : [];
        parsed.produtos = { potes: antigos, caseiro: [], aniversario: [] };
      }
      parsed.ingredientes = parsed.ingredientes || [];
      Object.keys(CATEGORIAS).forEach(cat => { parsed.produtos[cat] = parsed.produtos[cat] || []; });
      return parsed;
    }
  }catch(e){ console.warn("Falha ao ler dados salvos", e); }
  return { ingredientes: [], produtos: { potes: [], caseiro: [], aniversario: [] } };
}

function salvarDados(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function gerarId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatarMoeda(valor){
  return (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function mostrarToast(msg){
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(mostrarToast._t);
  mostrarToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------------- Abas ---------------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected","false"); });
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    btn.setAttribute("aria-selected","true");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* =========================================================
   INGREDIENTES (compartilhados entre todas as categorias)
   ========================================================= */
const formIngrediente = document.getElementById("form-ingrediente");

formIngrediente.addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = document.getElementById("ing-nome").value.trim();
  const unidade = document.getElementById("ing-unidade").value;
  const qtdComprada = parseFloat(document.getElementById("ing-qtd-comprada").value);
  const precoComprado = parseFloat(document.getElementById("ing-preco-comprado").value);

  if(!nome || !qtdComprada || qtdComprada <= 0 || isNaN(precoComprado) || precoComprado < 0){
    mostrarToast("Preencha os dados do ingrediente corretamente.");
    return;
  }

  dados.ingredientes.push({ id: gerarId(), nome, unidade, qtdComprada, precoComprado });
  salvarDados();
  formIngrediente.reset();
  document.getElementById("ing-unidade").value = "g";
  renderIngredientes();
  Object.keys(CATEGORIAS).forEach(atualizarSelectsDaCategoria);
  mostrarToast("Ingrediente adicionado!");
});

function custoPorUnidade(ing){
  return ing.qtdComprada > 0 ? ing.precoComprado / ing.qtdComprada : 0;
}

function ingredienteEmUso(id){
  return Object.values(dados.produtos).some(lista => lista.some(p => p.itens.some(i => i.ingredienteId === id)));
}

function renderIngredientes(){
  const tbody = document.querySelector("#tabela-ingredientes tbody");
  const vazio = document.getElementById("ingredientes-vazio");
  tbody.innerHTML = "";
  vazio.style.display = dados.ingredientes.length === 0 ? "block" : "none";

  dados.ingredientes.forEach(ing => {
    const tr = document.createElement("tr");
    const custo = custoPorUnidade(ing);
    tr.innerHTML = `
      <td>${escapeHtml(ing.nome)}</td>
      <td>${ing.qtdComprada} ${ing.unidade}</td>
      <td>${formatarMoeda(ing.precoComprado)}</td>
      <td>${formatarMoeda(custo)} / ${ing.unidade}</td>
      <td><button class="icon-btn" title="Remover">🗑️</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () => removerIngrediente(ing.id));
    tbody.appendChild(tr);
  });
}

function removerIngrediente(id){
  if(ingredienteEmUso(id) && !confirm("Esse ingrediente está sendo usado em um bolo salvo. Remover mesmo assim?")) return;
  dados.ingredientes = dados.ingredientes.filter(i => i.id !== id);
  salvarDados();
  renderIngredientes();
  Object.keys(CATEGORIAS).forEach(atualizarSelectsDaCategoria);
}

/* =========================================================
   PAINEL DE CADA CATEGORIA (Bolo de Pote / Caseiro / Aniversário)
   ========================================================= */
function montarPainelCategoria(catId){
  const cfg = CATEGORIAS[catId];
  const painel = document.getElementById(catId);

  const linhasCusto = cfg.custos.map(c => `
    <div class="field">
      <label>${c.label}</label>
      <input type="number" min="0" step="0.01" value="0" data-role="custo-${c.key}">
    </div>
  `).join("");

  painel.innerHTML = `
    <div class="panel-head">
      <h2>${cfg.titulo}</h2>
      <p class="hint">${cfg.dica}</p>
    </div>

    <div class="builder-grid">
      <div class="card">
        <div class="field">
          <label>Nome do bolo</label>
          <input type="text" data-role="nome" placeholder="${cfg.nomePlaceholder}">
        </div>

        <div class="field">
          <label>${cfg.rendimentoLabel}</label>
          <input type="number" min="1" step="1" value="1" data-role="rendimento">
        </div>

        <h3 class="sub-title">Ingredientes da receita</h3>
        <div class="recipe-list" data-role="recipe-list"></div>
        <button type="button" class="btn btn-ghost" data-role="add-ingrediente">+ Adicionar ingrediente à receita</button>

        <h3 class="sub-title">${cfg.custosTitulo}</h3>
        <div class="form-grid form-grid-3">${linhasCusto}</div>

        <h3 class="sub-title">Mão de obra e lucro</h3>
        <div class="form-grid form-grid-3">
          <div class="field">
            <label>Tempo total de preparo (min)</label>
            <input type="number" min="0" step="1" value="0" data-role="tempo-preparo">
          </div>
          <div class="field">
            <label>Quanto vale sua hora de trabalho (R$)</label>
            <input type="number" min="0" step="0.01" value="15" data-role="valor-hora">
          </div>
          <div class="field">
            <label>Margem de lucro desejada (%)</label>
            <input type="number" min="0" max="95" step="1" value="40" data-role="margem-lucro">
          </div>
        </div>

        <div class="builder-actions">
          <button type="button" class="btn btn-primary" data-role="salvar">💾 Salvar bolo</button>
          <button type="button" class="btn btn-ghost" data-role="limpar">Limpar formulário</button>
        </div>
      </div>

      <aside class="card resultado-card">
        <div class="resultado-selo"><span>Resultado</span></div>
        <dl class="resultado-lista">
          <div><dt>Custo dos ingredientes (total)</dt><dd data-role="res-custo-ing">R$ 0,00</dd></div>
          <div><dt>Custos extras (total)</dt><dd data-role="res-custo-extra">R$ 0,00</dd></div>
          <div><dt>Mão de obra (total)</dt><dd data-role="res-mao-obra">R$ 0,00</dd></div>
          <div class="divider"></div>
          <div><dt>Custo por ${cfg.unidadeProduto}</dt><dd data-role="res-custo-unitario" class="destaque">R$ 0,00</dd></div>
          <div><dt>Preço sugerido de venda</dt><dd data-role="res-preco-sugerido" class="destaque destaque-rosa">R$ 0,00</dd></div>
          <div class="divider"></div>
          <div><dt>Lucro por ${cfg.unidadeProduto}</dt><dd data-role="res-lucro-unitario">R$ 0,00</dd></div>
        </dl>
        <div class="ribbon">Feito com amor 🤍</div>
      </aside>
    </div>

    <div class="panel-head panel-head-spaced"><h2>Meus bolos salvos</h2></div>
    <div class="table-wrap card">
      <table data-role="tabela-produtos">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Rende</th>
            <th>Custo/${cfg.unidadeProduto}</th>
            <th>Preço sugerido</th>
            <th>Lucro/${cfg.unidadeProduto}</th>
            <th></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <p class="empty-state" data-role="produtos-vazio">Nenhum bolo salvo ainda.</p>
    </div>
  `;

  cablearPainelCategoria(catId);
}

function cablearPainelCategoria(catId){
  const painel = document.getElementById(catId);

  painel.querySelector('[data-role="add-ingrediente"]').addEventListener("click", () => {
    if(dados.ingredientes.length === 0){
      mostrarToast("Cadastre ao menos um ingrediente primeiro.");
      return;
    }
    novaLinhaReceita(catId);
  });

  painel.querySelectorAll('[data-role^="custo-"], [data-role="rendimento"], [data-role="tempo-preparo"], [data-role="valor-hora"], [data-role="margem-lucro"]')
    .forEach(input => input.addEventListener("input", () => calcularResultado(catId)));

  painel.querySelector('[data-role="salvar"]').addEventListener("click", () => salvarProduto(catId));
  painel.querySelector('[data-role="limpar"]').addEventListener("click", () => limparFormularioProduto(catId));

  limparFormularioProduto(catId);
  renderProdutos(catId);
}

function atualizarSelectsDaCategoria(catId){
  const painel = document.getElementById(catId);
  painel.querySelectorAll('[data-role="recipe-list"] .receita-ingrediente').forEach(sel => {
    const atual = sel.value;
    preencherSelectIngredientes(sel);
    sel.value = atual;
  });
}

function preencherSelectIngredientes(select){
  select.innerHTML = `<option value="">Selecione o ingrediente…</option>` +
    dados.ingredientes.map(i => `<option value="${i.id}">${escapeHtml(i.nome)} (${i.unidade})</option>`).join("");
}

function novaLinhaReceita(catId, ingredienteId = "", quantidade = ""){
  const painel = document.getElementById(catId);
  const lista = painel.querySelector('[data-role="recipe-list"]');

  const row = document.createElement("div");
  row.className = "recipe-row";
  row.innerHTML = `
    <select class="receita-ingrediente"></select>
    <input type="number" class="receita-qtd" min="0" step="0.01" placeholder="Qtd usada" value="${quantidade}">
    <button type="button" class="icon-btn" title="Remover">✖</button>
  `;
  const select = row.querySelector(".receita-ingrediente");
  preencherSelectIngredientes(select);
  if(ingredienteId) select.value = ingredienteId;

  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    calcularResultado(catId);
  });
  row.querySelector(".receita-qtd").addEventListener("input", () => calcularResultado(catId));
  select.addEventListener("change", () => calcularResultado(catId));

  lista.appendChild(row);
  calcularResultado(catId);
}

function lerReceitaAtual(catId){
  const painel = document.getElementById(catId);
  const itens = [];
  painel.querySelectorAll(".recipe-row").forEach(row => {
    const ingredienteId = row.querySelector(".receita-ingrediente").value;
    const quantidade = parseFloat(row.querySelector(".receita-qtd").value) || 0;
    if(ingredienteId && quantidade > 0) itens.push({ ingredienteId, quantidade });
  });
  return itens;
}

function lerCustosExtras(catId, painel){
  const cfg = CATEGORIAS[catId];
  const custos = {};
  cfg.custos.forEach(c => {
    custos[c.key] = parseFloat(painel.querySelector(`[data-role="custo-${c.key}"]`).value) || 0;
  });
  return custos;
}

/* Motor de cálculo — igual para as três categorias, só muda se o custo extra
   é "por unidade" (pote/caseiro) ou "total da encomenda" (aniversário). */
function calcularCustos(catId, itens, rendimento, custosExtras, tempoMin, valorHora, margem){
  const custoIngredientesTotal = itens.reduce((soma, item) => {
    const ing = dados.ingredientes.find(i => i.id === item.ingredienteId);
    if(!ing) return soma;
    return soma + item.quantidade * custoPorUnidade(ing);
  }, 0);

  const somaCustosExtras = Object.values(custosExtras).reduce((a,b) => a + b, 0);
  const rend = rendimento && rendimento > 0 ? rendimento : 1;

  const custoExtraTotal = CUSTO_EXTRA_E_TOTAL[catId] ? somaCustosExtras : somaCustosExtras * rend;
  const custoExtraPorUnidade = custoExtraTotal / rend;

  const maoDeObraTotal = ((tempoMin || 0) / 60) * (valorHora || 0);

  const custoPorUnidadeProduto = (custoIngredientesTotal / rend) + custoExtraPorUnidade + (maoDeObraTotal / rend);

  const margemFrac = Math.min(Math.max((margem || 0) / 100, 0), 0.95);
  const precoSugerido = margemFrac < 1 ? custoPorUnidadeProduto / (1 - margemFrac) : custoPorUnidadeProduto;
  const lucroPorUnidade = precoSugerido - custoPorUnidadeProduto;

  return { custoIngredientesTotal, custoExtraTotal, maoDeObraTotal, custoPorUnidadeProduto, precoSugerido, lucroPorUnidade };
}

function calcularResultado(catId){
  const painel = document.getElementById(catId);
  const itens = lerReceitaAtual(catId);
  const rendimento = parseFloat(painel.querySelector('[data-role="rendimento"]').value) || 1;
  const custosExtras = lerCustosExtras(catId, painel);
  const tempoMin = parseFloat(painel.querySelector('[data-role="tempo-preparo"]').value) || 0;
  const valorHora = parseFloat(painel.querySelector('[data-role="valor-hora"]').value) || 0;
  const margem = parseFloat(painel.querySelector('[data-role="margem-lucro"]').value) || 0;

  const r = calcularCustos(catId, itens, rendimento, custosExtras, tempoMin, valorHora, margem);

  painel.querySelector('[data-role="res-custo-ing"]').textContent = formatarMoeda(r.custoIngredientesTotal);
  painel.querySelector('[data-role="res-custo-extra"]').textContent = formatarMoeda(r.custoExtraTotal);
  painel.querySelector('[data-role="res-mao-obra"]').textContent = formatarMoeda(r.maoDeObraTotal);
  painel.querySelector('[data-role="res-custo-unitario"]').textContent = formatarMoeda(r.custoPorUnidadeProduto);
  painel.querySelector('[data-role="res-preco-sugerido"]').textContent = formatarMoeda(r.precoSugerido);
  painel.querySelector('[data-role="res-lucro-unitario"]').textContent = formatarMoeda(r.lucroPorUnidade);

  return r;
}

function limparFormularioProduto(catId){
  const painel = document.getElementById(catId);
  produtoEditando[catId] = null;
  painel.querySelector('[data-role="nome"]').value = "";
  painel.querySelector('[data-role="rendimento"]').value = 1;
  CATEGORIAS[catId].custos.forEach(c => { painel.querySelector(`[data-role="custo-${c.key}"]`).value = 0; });
  painel.querySelector('[data-role="tempo-preparo"]').value = 0;
  painel.querySelector('[data-role="valor-hora"]').value = 15;
  painel.querySelector('[data-role="margem-lucro"]').value = 40;
  painel.querySelector('[data-role="recipe-list"]').innerHTML = "";
  painel.querySelector('[data-role="salvar"]').textContent = "💾 Salvar bolo";
  calcularResultado(catId);
}

function salvarProduto(catId){
  const painel = document.getElementById(catId);
  const nome = painel.querySelector('[data-role="nome"]').value.trim();
  const itens = lerReceitaAtual(catId);

  if(!nome){ mostrarToast("Dê um nome para o bolo."); return; }
  if(itens.length === 0){ mostrarToast("Adicione ao menos um ingrediente à receita."); return; }

  const produto = {
    id: produtoEditando[catId] || gerarId(),
    nome,
    itens,
    rendimento: parseFloat(painel.querySelector('[data-role="rendimento"]').value) || 1,
    custosExtras: lerCustosExtras(catId, painel),
    tempoMin: parseFloat(painel.querySelector('[data-role="tempo-preparo"]').value) || 0,
    valorHora: parseFloat(painel.querySelector('[data-role="valor-hora"]').value) || 0,
    margem: parseFloat(painel.querySelector('[data-role="margem-lucro"]').value) || 0,
  };

  const lista = dados.produtos[catId];
  if(produtoEditando[catId]){
    const idx = lista.findIndex(p => p.id === produtoEditando[catId]);
    lista[idx] = produto;
    mostrarToast("Bolo atualizado!");
  } else {
    lista.push(produto);
    mostrarToast("Bolo salvo!");
  }

  salvarDados();
  limparFormularioProduto(catId);
  renderProdutos(catId);
}

function editarProduto(catId, id){
  const painel = document.getElementById(catId);
  const p = dados.produtos[catId].find(p => p.id === id);
  if(!p) return;

  produtoEditando[catId] = id;
  painel.querySelector('[data-role="nome"]').value = p.nome;
  painel.querySelector('[data-role="rendimento"]').value = p.rendimento;
  CATEGORIAS[catId].custos.forEach(c => {
    painel.querySelector(`[data-role="custo-${c.key}"]`).value = p.custosExtras[c.key] || 0;
  });
  painel.querySelector('[data-role="tempo-preparo"]').value = p.tempoMin;
  painel.querySelector('[data-role="valor-hora"]').value = p.valorHora;
  painel.querySelector('[data-role="margem-lucro"]').value = p.margem;
  painel.querySelector('[data-role="recipe-list"]').innerHTML = "";
  p.itens.forEach(item => novaLinhaReceita(catId, item.ingredienteId, item.quantidade));
  painel.querySelector('[data-role="salvar"]').textContent = "💾 Atualizar bolo";

  document.querySelector(`.tab-btn[data-tab="${catId}"]`).click();
  calcularResultado(catId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function removerProduto(catId, id){
  if(!confirm("Remover este bolo salvo?")) return;
  dados.produtos[catId] = dados.produtos[catId].filter(p => p.id !== id);
  salvarDados();
  renderProdutos(catId);
}

function renderProdutos(catId){
  const painel = document.getElementById(catId);
  const tbody = painel.querySelector('[data-role="tabela-produtos"] tbody');
  const vazio = painel.querySelector('[data-role="produtos-vazio"]');
  const lista = dados.produtos[catId];
  const unidade = CATEGORIAS[catId].unidadeProduto;
  tbody.innerHTML = "";
  vazio.style.display = lista.length === 0 ? "block" : "none";

  lista.forEach(p => {
    const r = calcularCustos(catId, p.itens, p.rendimento, p.custosExtras, p.tempoMin, p.valorHora, p.margem);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p.nome)}</td>
      <td>${p.rendimento} ${unidade}</td>
      <td>${formatarMoeda(r.custoPorUnidadeProduto)}</td>
      <td><strong>${formatarMoeda(r.precoSugerido)}</strong></td>
      <td>${formatarMoeda(r.lucroPorUnidade)}</td>
      <td>
        <button class="icon-btn" title="Editar" data-action="editar">✏️</button>
        <button class="icon-btn" title="Remover" data-action="remover">🗑️</button>
      </td>
    `;
    tr.querySelector('[data-action="editar"]').addEventListener("click", () => editarProduto(catId, p.id));
    tr.querySelector('[data-action="remover"]').addEventListener("click", () => removerProduto(catId, p.id));
    tbody.appendChild(tr);
  });
}

/* =========================================================
   BACKUP DE DADOS
   ========================================================= */
document.getElementById("btn-exportar").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `masqbom-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  mostrarToast("Backup exportado!");
});

document.getElementById("input-importar").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try{
      const novo = JSON.parse(ev.target.result);
      if(!novo.ingredientes) throw new Error("formato inválido");
      if(!novo.produtos || Array.isArray(novo.produtos)){
        const antigos = Array.isArray(novo.produtos) ? novo.produtos : [];
        novo.produtos = { potes: antigos, caseiro: [], aniversario: [] };
      }
      Object.keys(CATEGORIAS).forEach(cat => { novo.produtos[cat] = novo.produtos[cat] || []; });
      dados = novo;
      salvarDados();
      atualizarTudo();
      mostrarToast("Backup importado com sucesso!");
    }catch(err){
      mostrarToast("Arquivo inválido. Verifique o backup.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

document.getElementById("btn-apagar").addEventListener("click", () => {
  if(!confirm("Isso vai apagar TODOS os ingredientes e bolos salvos neste navegador. Tem certeza?")) return;
  dados = { ingredientes: [], produtos: { potes: [], caseiro: [], aniversario: [] } };
  salvarDados();
  atualizarTudo();
  mostrarToast("Todos os dados foram apagados.");
});

function atualizarTudo(){
  renderIngredientes();
  Object.keys(CATEGORIAS).forEach(catId => {
    atualizarSelectsDaCategoria(catId);
    limparFormularioProduto(catId);
    renderProdutos(catId);
  });
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
Object.keys(CATEGORIAS).forEach(montarPainelCategoria);
renderIngredientes();

/* =========================================================
   LOGIN
   Atenção: como o site é estático (sem servidor), esse login só
   esconde a tela. Serve para uso pessoal; para proteção de verdade
   na Hostinger, use também "Pastas protegidas por senha" no hPanel.
   A senha NÃO fica escrita no código: só o hash SHA-256 dela.
   ========================================================= */
const AUTH_KEY = "masqbom_sessao_ok";
const AUTH_HASH = "8959eb269b2d81292a550f0965bd7a56f1c7feddbbdc2c3dcd4e7fe5723ce45e";

async function gerarHash(usuario, senha){
  const texto = `masqbom|${usuario.trim().toLowerCase()}|${senha}`;
  const bytes = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function liberarAcesso(){
  document.body.classList.remove("locked");
}

function bloquearAcesso(){
  sessionStorage.removeItem(AUTH_KEY);
  document.body.classList.add("locked");
}

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const erro = document.getElementById("login-erro");
  const usuario = document.getElementById("login-usuario").value;
  const senha = document.getElementById("login-senha").value;
  erro.textContent = "";

  if(!(window.crypto && crypto.subtle)){
    erro.textContent = "Seu navegador não suporta o login neste modo. Abra por http://localhost ou pelo site publicado (https).";
    return;
  }

  const hash = await gerarHash(usuario, senha);
  if(hash === AUTH_HASH){
    sessionStorage.setItem(AUTH_KEY, "1");
    document.getElementById("form-login").reset();
    liberarAcesso();
  } else {
    erro.textContent = "Usuário ou senha incorretos.";
    document.getElementById("login-senha").value = "";
  }
});

document.getElementById("btn-sair").addEventListener("click", bloquearAcesso);

if(sessionStorage.getItem(AUTH_KEY) === "1") liberarAcesso();
