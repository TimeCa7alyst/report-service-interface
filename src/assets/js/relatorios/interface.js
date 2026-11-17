const alertCard = document.getElementById("alert-card");
const alertText = document.getElementById("alert-text");

const filtrosContainer = document.getElementById("filtros-container");
const kpisContainer = document.getElementById("kpis-container");
const tableHead = document.getElementById("analise-table-head");
const tableBody = document.getElementById("analise-table-body");

const formatarMoeda = (val) =>
    Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatarData = (iso) => {
    if (!iso) return "-";
    const [ano, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${ano}`;
};

const renderBadgeStatus = (status) => {
    if (!status) return "-";
    const s = status.toUpperCase();
    let classe = "badge-neutral";
    if (["APROVADO", "PAGO", "CONCLUIDO", "ATIVO", "PROMOTOR"].includes(s)) classe = "badge-success";
    else if (["PENDENTE", "NEUTRO"].includes(s)) classe = "badge-warning";
    else if (["EXPIRADO", "REPROVADO", "INATIVO", "DETRATOR"].includes(s)) classe = "badge-danger";
    return `<span class="status-badge ${classe}">${s}</span>`;
};

export const CONFIG_TEMPLATES = {
    "vendas": {
        filtros: [
            { name: "dataInicio", label: "Data Início", type: "date" },
            { name: "dataFim", label: "Data Fim", type: "date" },
            {
                name: "status", label: "Status Pagamento", type: "select",
                options: [
                    { value: "", label: "Todos" },
                    { value: "APROVADO", label: "Aprovado" },
                    { value: "PAGO", label: "Pago" },
                    { value: "PENDENTE", label: "Pendente" }
                ]
            },
            { name: "cidade", label: "Cidade", type: "text", placeholder: "Ex: São Paulo" }
        ],
        kpis: [
            { key: "faturamentoTotal", label: "Faturamento Total", format: formatarMoeda },
            { key: "ticketMedio", label: "Ticket Médio", format: formatarMoeda },
            { key: "vendasPagas", label: "Vendas Pagas", format: (v) => String(v ?? 0).padStart(2, "0") }
        ],
        colunas: ["Código", "Cliente", "Cidade", "Data", "Status", "Valor Final", "Nota"],
        renderLinha: (item) => `
            <td>#${item.vendaId}</td>
            <td><strong>${item.clienteNome}</strong></td>
            <td>${item.clienteCidade || "-"}</td>
            <td>${formatarData(item.dataCriacao)}</td>
            <td>${renderBadgeStatus(item.statusPagamento)}</td>
            <td><strong>${formatarMoeda(item.valorFinal)}</strong></td>
            <td>${item.notaAvaliacao != null ? item.notaAvaliacao.toFixed(1) : "-"}</td>
        `
    },
    "conversao-orcamentos": {
        filtros: [
            { name: "dataInicio", label: "Emissão Início", type: "date" },
            { name: "dataFim", label: "Emissão Fim", type: "date" },
            {
                name: "status", label: "Status Orçamento", type: "select",
                options: [
                    { value: "", label: "Todos" },
                    { value: "APROVADO", label: "Aprovado" },
                    { value: "EXPIRADO", label: "Expirado" },
                    { value: "REPROVADO", label: "Reprovado" }
                ]
            }
        ],
        kpis: [
            { key: "taxaConversao", label: "Taxa de Conversão", format: (v) => `${v ?? 0}%` },
            { key: "totalOrcado", label: "Total Orçado", format: formatarMoeda },
            { key: "valorPerdido", label: "Valor Perdido", format: formatarMoeda }
        ],
        colunas: ["Código", "Cliente", "Emissão", "Validade", "Status", "Valor Total", "Conversão"],
        renderLinha: (item) => `
            <td>#${item.orcamentoId}</td>
            <td><strong>${item.clienteNome}</strong></td>
            <td>${formatarData(item.dataCriacao)}</td>
            <td>${formatarData(item.dataValidade)}</td>
            <td>${renderBadgeStatus(item.statusOrcamento)}</td>
            <td><strong>${formatarMoeda(item.valorTotal)}</strong></td>
            <td>${item.convertidoEmVenda ? `<span class="status-badge badge-success">Venda #${item.vendaId}</span>` : "Não convertido"}</td>
        `
    },
    "desempenho-clientes": {
        filtros: [
            {
                name: "status", label: "Status Cliente", type: "select",
                options: [
                    { value: "", label: "Todos" },
                    { value: "ATIVO", label: "Ativo" },
                    { value: "INATIVO", label: "Inativo" }
                ]
            },
            { name: "cidade", label: "Cidade", type: "text", placeholder: "Ex: São Paulo" },
            {
                name: "apenasInativos", label: "Recorrência", type: "select",
                options: [
                    { value: "", label: "Todos" },
                    { value: "true", label: "Sem compra +60 dias" }
                ]
            }
        ],
        kpis: [
            { key: "totalClientesAnalisados", label: "Clientes Analisados", format: (v) => String(v ?? 0).padStart(2, "0") },
            { key: "clientesSemCompra60Dias", label: "Inativos (+60d)", format: (v) => String(v ?? 0).padStart(2, "0") },
            { key: "receitaAcumuladaCarteira", label: "Receita Acumulada", format: formatarMoeda }
        ],
        colunas: ["Cliente", "Cidade/UF", "Status", "Orç. / Vendas", "Total Comprado", "Ticket Médio", "Última Compra"],
        renderLinha: (item) => `
            <td><strong>${item.nome}</strong></td>
            <td>${item.cidadeUf}</td>
            <td>${renderBadgeStatus(item.statusCliente)}</td>
            <td>${item.totalOrcamentos} / ${item.totalVendasPagas}</td>
            <td><strong>${formatarMoeda(item.valorTotalComprado)}</strong></td>
            <td>${formatarMoeda(item.ticketMedio)}</td>
            <td>${formatarData(item.ultimaCompra)}</td>
        `
    },
    "avaliacoes": {
        filtros: [
            { name: "dataInicio", label: "Data Início", type: "date" },
            { name: "dataFim", label: "Data Fim", type: "date" },
            {
                name: "classificacao", label: "Classificação", type: "select",
                options: [
                    { value: "", label: "Todas" },
                    { value: "PROMOTOR", label: "Bom (4.0 - 5.0)" },
                    { value: "NEUTRO", label: "Neutro (3.0 - 3.9)" },
                    { value: "DETRATOR", label: "Ruim (< 3.0)" }
                ]
            }
        ],
        kpis: [
            { key: "mediaGeral", label: "Nota Média Geral", format: (v) => `${Number(v || 0).toFixed(1)} ★` },
            { key: "promotores", label: "Positivas", format: (v) => String(v ?? 0).padStart(2, "0") },
            { key: "detratores", label: "Negativas", format: (v) => String(v ?? 0).padStart(2, "0") }
        ],
        colunas: ["ID Venda", "Cliente", "Tipo", "Data Venda", "Valor Final", "Nota", "Classificação"],
        renderLinha: (item) => `
            <td>#${item.vendaId}</td>
            <td><strong>${item.clienteNome}</strong></td>
            <td>${item.tipoCliente}</td>
            <td>${formatarData(item.dataVenda)}</td>
            <td>${formatarMoeda(item.valorFinal)}</td>
            <td><strong>${item.notaAvaliacao?.toFixed(1)}</strong></td>
            <td>${renderBadgeStatus(item.classificacao)}</td>
        `
    }
};

export function exibirAlerta(mensagem, tipo = "error") {
    if (!alertCard) return;
    alertText.textContent = mensagem;
    alertCard.className = tipo === "success" ? "alert success" : "alert";
    alertCard.style.display = "block";
    setTimeout(() => { alertCard.style.display = "none"; }, 5000);
}

export function inicializarTelaAnalise(templateId) {
    const config = CONFIG_TEMPLATES[templateId];
    if (!config || !filtrosContainer) return;

    filtrosContainer.innerHTML = config.filtros.map(f => {
        if (f.type === "select") {
            const opts = f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("");
            return `
                <div class="filter-field">
                    <label for="filtro-${f.name}">${f.label}</label>
                    <select id="filtro-${f.name}" name="${f.name}">${opts}</select>
                </div>
            `;
        }
        return `
            <div class="filter-field">
                <label for="filtro-${f.name}">${f.label}</label>
                <input type="${f.type}" id="filtro-${f.name}" name="${f.name}" placeholder="${f.placeholder || ""}">
            </div>
        `;
    }).join("") + `
        <button type="button" id="btn-aplicar-filtros" class="btn-orange btn-filter-submit">
            <i class="bi bi-funnel-fill"></i> FILTRAR
        </button>
        <button type="button" id="btn-limpar-filtros" class="btn-filter-clear">
            LIMPAR
        </button>
    `;

    tableHead.innerHTML = `<tr>${config.colunas.map(c => `<th>${c}</th>`).join("")}</tr>`;
}

export function obterFiltrosAtivos() {
    const filtros = {};
    if (!filtrosContainer) return filtros;
    filtrosContainer.querySelectorAll("input, select").forEach(el => {
        if (el.name && el.value.trim() !== "") {
            filtros[el.name] = el.value.trim();
        }
    });
    return filtros;
}

export function limparCamposFiltros() {
    if (!filtrosContainer) return;
    filtrosContainer.querySelectorAll("input, select").forEach(el => {
        el.value = "";
    });
}

export function renderizarResultadosAnalise(templateId, resposta) {
    const config = CONFIG_TEMPLATES[templateId];
    if (!config) return;

    const kpis = resposta?.kpis || {};
    kpisContainer.innerHTML = config.kpis.map(k => `
        <div class="kpi-pill">
            <div class="kpi-pill-value">${k.format(kpis[k.key])}</div>
            <div class="kpi-pill-label">${k.label}</div>
        </div>
    `).join("");

    const dados = resposta?.dados || [];
    tableBody.innerHTML = "";

    if (dados.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="${config.colunas.length}" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    Nenhum registro encontrado para os filtros aplicados.
                </td>
            </tr>
        `;
        return;
    }

    dados.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = config.renderLinha(item);
        tableBody.appendChild(tr);
    });
}