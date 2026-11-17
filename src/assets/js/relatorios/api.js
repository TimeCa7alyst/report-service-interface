const API_BASE_URL = "http://localhost:8082/api/relatorios/analises";
const LOGIN_URL = "http://localhost:8081/login.html";

function getAuthToken() {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find(row => row.startsWith("jwt_token="));
    return tokenCookie ? tokenCookie.split("=")[1] : null;
}

function getAuthHeaders() {
    const token = getAuthToken();
    return {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
    };
}

function construirQueryString(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([chave, valor]) => {
        if (valor !== null && valor !== undefined && String(valor).trim() !== "") {
            query.append(chave, valor);
        }
    });
    const qs = query.toString();
    return qs ? `?${qs}` : "";
}

async function tratarRespostaJson(response) {
    if (response.status === 401) {
        window.location.replace(LOGIN_URL);
        throw new Error("Sessão expirada. Faça login novamente.");
    }
    if (response.status === 403) {
        throw new Error("Você não tem permissão para acessar este relatório.");
    }
    if (!response.ok) {
        throw new Error("Erro ao carregar os dados da análise no servidor.");
    }
    return response.json();
}

export async function buscarDadosAnalise(templateId, filtros = {}) {
    const qs = construirQueryString(filtros);
    const response = await fetch(`${API_BASE_URL}/${templateId}${qs}`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    return tratarRespostaJson(response);
}

export async function baixarArquivoAnalise(templateId, formato, filtros = {}) {
    const qs = construirQueryString(filtros);
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/${templateId}/exportar/${formato}${qs}`, {
        method: "GET",
        headers: {
            ...(token && { "Authorization": `Bearer ${token}` })
        }
    });

    if (response.status === 401) {
        window.location.replace(LOGIN_URL);
        throw new Error("Sessão expirada. Faça login novamente.");
    }
    if (!response.ok) {
        throw new Error(`Erro ao exportar arquivo ${formato.toUpperCase()}.`);
    }

    const blob = await response.blob();
    const extensao = formato === "excel" ? "xlsx" : "pdf";
    const nomeArquivo = `relatorio-${templateId}.${extensao}`;

    const urlBlob = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = urlBlob;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob);
}