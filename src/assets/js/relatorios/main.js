import {
    buscarDadosAnalise,
    baixarArquivoAnalise
} from "./api.js";

import {
    exibirAlerta,
    inicializarTelaAnalise,
    obterFiltrosAtivos,
    limparCamposFiltros,
    renderizarResultadosAnalise
} from "./interface.js";

let formatoSelecionado = "pdf";

const REDIRECT_URL = "http://localhost:5500/login.html";

document.addEventListener("DOMContentLoaded", async () => {
    if (!verificarSessaoValida()) return;

    const templateAtual = document.body.dataset.analise;

    document.getElementById("btn-logout")?.addEventListener("click", () => {
        document.cookie = "jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        window.location.replace(REDIRECT_URL);
    });

    if (templateAtual) {
        inicializarTelaAnalise(templateAtual);
        await carregarDados(templateAtual);

        document.getElementById("filtros-container")?.addEventListener("click", async (e) => {
            if (e.target.closest("#btn-aplicar-filtros")) {
                await carregarDados(templateAtual);
            } else if (e.target.closest("#btn-limpar-filtros")) {
                limparCamposFiltros();
                await carregarDados(templateAtual);
            }
        });

        const btnToggle = document.getElementById("btn-export-dropdown");
        const dropdownMenu = document.getElementById("export-dropdown-menu");
        const btnExecutar = document.getElementById("btn-export-executar");
        const btnLabel = document.getElementById("export-btn-label");

        btnToggle?.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownMenu?.classList.toggle("open");
        });

        dropdownMenu?.querySelectorAll(".export-option").forEach(option => {
            option.addEventListener("click", () => {
                formatoSelecionado = option.dataset.formato;
                btnLabel.textContent = formatoSelecionado === "excel"
                    ? "EXPORTAR (.XLSX)"
                    : "EXPORTAR (PDF)";

                dropdownMenu.querySelectorAll(".export-option").forEach(opt => {
                    const isSelected = opt.dataset.formato === formatoSelecionado;
                    opt.classList.toggle("selected", isSelected);
                    const icon = opt.querySelector(".check-icon");
                    if (icon) icon.style.visibility = isSelected ? "visible" : "hidden";
                });

                dropdownMenu.classList.remove("open");
            });
        });

        document.addEventListener("click", () => {
            dropdownMenu?.classList.remove("open");
        });

        btnExecutar?.addEventListener("click", async () => {
            try {
                const filtros = obterFiltrosAtivos();
                await baixarArquivoAnalise(templateAtual, formatoSelecionado, filtros);
                exibirAlerta(`Arquivo ${formatoSelecionado === "excel" ? ".XLSX" : ".PDF"} exportado com sucesso!`, "success");
            } catch (error) {
                exibirAlerta(error.message);
            }
        });
    }
});

async function carregarDados(templateId) {
    try {
        const filtros = obterFiltrosAtivos();
        const resposta = await buscarDadosAnalise(templateId, filtros);
        renderizarResultadosAnalise(templateId, resposta);
    } catch (error) {
        exibirAlerta(error.message);
    }
}

function verificarSessaoValida() {
    const cookie = document.cookie.split("; ").find(row => row.startsWith("jwt_token="));
    if (!cookie) {
        window.location.replace(REDIRECT_URL);
        return false;
    }

    try {
        const token = cookie.split("=")[1];
        const payload = JSON.parse(atob(token.split(".")[1]));
        const agoraEmSegundos = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < agoraEmSegundos) {
            document.cookie = "jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            window.location.replace(REDIRECT_URL);
            return false;
        }
        return true;
    } catch {
        document.cookie = "jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        window.location.replace(REDIRECT_URL);
        return false;
    }
}