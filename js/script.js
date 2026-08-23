/*  --- PRODUTOS--- */

// 1. IMPORTAR PRODUTOS VIA CSV
function importarProdutosCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split(/\r?\n/);
        const tbody = document.getElementById('products-table-body');

        rows.forEach((row, index) => {
            if (!row.trim()) return; // Pula linha vazia

            // Detecta se o separador é vírgula ou ponto e vírgula (padrão do Excel BR)
            const delimiter = row.includes(';') ? ';' : ',';
            const columns = parseCSVLine(row, delimiter);

            // Pula o cabeçalho
            if (index === 0 && columns[0].toLowerCase().includes('produto')) return;

            if (columns.length >= 3) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="product-cell">
                            <div class="product-image"><i class="fa-regular fa-image"></i></div>
                            <div class="product-meta">
                                <span class="product-name">${columns[0] || 'Novo Produto'}</span>
                                <span class="product-qty">${columns[1] || '0'} unidades</span>
                            </div>
                        </div>
                    </td>
                    <td>${columns[2] || 'Geral'}</td>
                    <td>${columns[3] || 'R$0'}</td>
                    <td class="actions-cell"><i class="fa-solid fa-ellipsis-vertical"></i></td>
                `;
                tbody.appendChild(tr);
            }
        });
        atualizarContador();
    };

    // 'ISO-8859-1' corrige acentos como "Coração" vindos do Excel no Windows
    reader.readAsText(file, 'ISO-8859-1');
}

// Função auxiliar: Lê o CSV caractere por caractere tratando aspas e vírgulas internas
function parseCSVLine(line, delimiter) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' || char === '“' || char === '”') {
            if (insideQuotes && (nextChar === '"' || nextChar === '”')) {
                currentValue += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === delimiter && !insideQuotes) {
            values.push(cleanValue(currentValue));
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(cleanValue(currentValue));
    return values;
}

// Limpa qualquer aspa ou espaço remanescente nas pontas do texto
function cleanValue(val) {
    return val.trim().replace(/^["'“”]+|["'“”]+$/g, '');
}

// 2. EXPORTAR PRODUTOS PARA CSV
        function exportarProdutosCSV() {
            let csv = ["Produto,Unidades,Categoria,Valor"];
            const rows = document.querySelectorAll("#products-table-body tr");
            
            rows.forEach(row => {
                const name = row.querySelector(".product-name").innerText;
                const qty = row.querySelector(".product-qty").innerText.replace(' unidades', '');
                const cat = row.querySelectorAll("td")[1].innerText;
                const val = row.querySelectorAll("td")[2].innerText;
                csv.push(`"${name}","${qty}","${cat}","${val}"`);
            });

            const csvFile = new Blob([csv.join("\n")], {type: "text/csv;charset=utf-8;"});
            const downloadLink = document.createElement("a");
            downloadLink.download = "lista_produtos.csv";
            downloadLink.href = window.URL.createObjectURL(csvFile);
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
            downloadLink.click();
        }

// 3. EXPORTAR PRODUTOS PARA PDF
        function exportarProdutosPDF() {
    const element = document.getElementById('printable-products-table');
    
    const opt = {
        margin:       10,
        filename:     'lista_produtos.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, // Crucial para renderizar imagens e ícones perfeitamente
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' } // Mantém deitado para caber tudo
    };
    
    html2pdf().set(opt).from(element).save();
}
// 4. FUNÇÃO PARA TROCAR A IMAGEM DO PRODUTO
        function trocarImagem(event) {
            const input = event.target;
            const file = input.files[0];
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const label = input.closest('.product-image');
                    
                    // Esconde o ícone cinza
                    const icon = label.querySelector('i');
                    if (icon) icon.style.display = 'none';
                    
                    // Cria a imagem caso não exista
                    let img = label.querySelector('img');
                    if (!img) {
                        img = document.createElement('img');
                        label.appendChild(img);
                    }
                    
                    // Define a foto carregada
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }

// 5. CONTADOR REAL DE UNIDADES E TIPOS EM ESTOQUE
function atualizarContador() {
    const rows = document.querySelectorAll("#products-table-body tr");
    let totalUnidades = 0;
    const totalTipos = rows.length;

    rows.forEach(row => {
        const qtyText = row.querySelector(".product-qty")?.innerText || "";
        // Extrai apenas os números do texto (ex: "8 unidades" -> 8)
        const qtyNum = parseInt(qtyText.replace(/\D/g, ""), 10);
        if (!isNaN(qtyNum)) {
            totalUnidades += qtyNum;
        }
    });

    const header = document.getElementById("total-count-header");
    if (header) {
        // Exibe o total de peças físicas e a quantidade de linhas cadastradas
        header.innerText = `${totalUnidades} itens em estoque (${totalTipos} ${totalTipos === 1 ? 'produto' : 'produtos'})`;
    }
}
// 6. SALVAR TABELA COMPLETA NO LOCALSTORAGE
function salvarProdutosNoLocalStorage() {
    const rows = document.querySelectorAll("#products-table-body tr");
    const produtos = [];

    rows.forEach(row => {
        const name = row.querySelector(".product-name")?.innerText || '';
        const qty = row.querySelector(".product-qty")?.innerText || '';
        const category = row.querySelectorAll("td")[1]?.innerText || 'Geral';
        const price = row.querySelectorAll("td")[2]?.innerText || 'R$0';
        
        // Captura a imagem em Base64 se ela existir
        const img = row.querySelector(".product-image img");
        const imgSrc = img ? img.src : null;

        produtos.push({
            name: name,
            qty: qty,
            category: category,
            price: price,
            image: imgSrc
        });
    });

    localStorage.setItem("dashboard_produtos", JSON.stringify(produtos));
}

// 7. RECUPERAR DADOS AO RECARREGAR A PÁGINA
function carregarProdutosDoLocalStorage() {
    const dadosSalvos = localStorage.getItem("dashboard_produtos");
    if (!dadosSalvos) return;

    const produtos = JSON.parse(dadosSalvos);
    if (produtos.length === 0) return;

    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = ''; 

    produtos.forEach(prod => {
        const tr = document.createElement('tr');
        
        const imagemHTML = prod.image 
            ? `<img src="${prod.image}">` 
            : `<i class="fa-regular fa-image"></i>`;

        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <label class="product-image">
                        ${imagemHTML}
                        <input type="file" accept="image/*" onchange="uploadImagem(this)">
                    </label>
                    <div class="product-meta">
                        <span class="product-name">${prod.name}</span>
                        <span class="product-qty">${prod.qty}</span>
                    </div>
                </div>
            </td>
            <td>${prod.category}</td>
            <td>${prod.price}</td>
            <td class="actions-cell"><i class="fa-solid fa-ellipsis-vertical"></i></td>
        `;
        tbody.appendChild(tr);
    });

    atualizarContador();
}
// 8. Carrega os produtos salvos assim que o HTML terminar de carregar
document.addEventListener("DOMContentLoaded", function () {
    carregarProdutosDoLocalStorage();
    atualizarContador();
});

/* --- VENDAS --- */

// 1. SALVAR VENDAS NO LOCALSTORAGE
function salvarVendasNoLocalStorage() {
    const tbody = document.getElementById("sales-table-body");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");
    const vendas = [];

    rows.forEach(row => {
        const cols = row.querySelectorAll("td");
        if (cols.length >= 7) {
            vendas.push({
                pedido: cols[0].innerText.trim(),
                cliente: cols[1].innerText.trim(),
                produto: cols[2].innerText.trim(),
                qtd: cols[3].innerText.trim(),
                status: cols[4].innerText.trim(),
                data: cols[5].innerText.trim(),
                valor: cols[6].innerText.trim()
            });
        }
    });

    localStorage.setItem("dashboard_vendas", JSON.stringify(vendas));
}

// 2. ATUALIZAR OS CONTADORES EM TEMPO REAL PELO STATUS (COM IDS CORRETOS)
function atualizarContadoresVendas() {
    const rows = document.querySelectorAll("#sales-table-body tr");
    
    let porCobrar = 0;  // Status: "Em execução"
    let porEmbalar = 0; // Status: "Aceito"
    let porEnviar = 0;  // Status: "Enviado"

    rows.forEach(row => {
        // Pega o elemento com a classe .status dentro da linha
        const statusElement = row.querySelector(".status") || row.querySelectorAll("td")[4];
        if (!statusElement) return;

        const statusText = statusElement.innerText.trim().toLowerCase();

        // Mapeamento dos status
        if (statusText === "em execução" || statusText === "em execucao") {
            porCobrar++;
        } else if (statusText === "aceito") {
            porEmbalar++;
        } else if (statusText === "enviado") {
            porEnviar++;
        }
    });

    // IDs exatamente iguais ao que está no seu sales.html:
    const elExecucao = document.getElementById("count-execucao");
    const elAceito = document.getElementById("count-aceito");
    const elEnviado = document.getElementById("count-enviado");

    if (elExecucao) elExecucao.innerText = porCobrar;
    if (elAceito) elAceito.innerText = porEmbalar;
    if (elEnviado) elEnviado.innerText = porEnviar;

    // Salva no localStorage para sincronizar com o dashboard.html
    salvarVendasNoLocalStorage();
}

// 3. IMPORTAR CSV PARA A TABELA DE VENDAS
function importarCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n');
        const tbody = document.getElementById('sales-table-body');
        if (!tbody) return;

        rows.forEach((row, dashboard) => {
            if (dashboard === 0 && row.toLowerCase().includes('pedido')) return; // ignora cabeçalho
            
            const columns = row.split(',');
            if (columns.length >= 6) {
                const tr = document.createElement('tr');
                const statusTexto = columns[4] ? columns[4].trim() : 'Em execução';
                
                // Define a classe CSS baseada no status importado
                let classeStatus = 'status-execucao';
                if (statusTexto.toLowerCase() === 'aceito') classeStatus = 'status-aceito';
                if (statusTexto.toLowerCase() === 'enviado') classeStatus = 'status-enviado';

                tr.innerHTML = `
                    <td>${columns[0] ? columns[0].trim() : '—'}</td>
                    <td>${columns[1] ? columns[1].trim() : '—'}</td>
                    <td>${columns[2] ? columns[2].trim() : '—'}</td>
                    <td>${columns[3] ? columns[3].trim() : '1'}</td>
                    <td><span class="status ${classeStatus}">${statusTexto}</span></td>
                    <td>${columns[5] ? columns[5].trim() : '—'}</td>
                    <td>${columns[6] ? columns[6].trim() : 'R$0'}</td>
                `;
                tbody.appendChild(tr);
            }
        });

        // Recalcula imediatamente os contadores e atualiza a tela
        atualizarContadoresVendas();
    };
    reader.readAsText(file);
}

// 4. INICIALIZAÇÃO AO CARREGAR A PÁGINA
document.addEventListener("DOMContentLoaded", function () {
    // Executa a contagem de vendas imediatamente ao carregar
    atualizarContadoresVendas();

    // Monitora modificações na tabela para recalcular automaticamente
    const tbody = document.getElementById("sales-table-body");
    if (tbody) {
        const observer = new MutationObserver(() => {
            atualizarContadoresVendas();
        });
        observer.observe(tbody, { childList: true, subtree: true, characterData: true });
    }
});

/* --- CLIENTES --- */

// 1. SALVAR CLIENTES NO LOCALSTORAGE
function salvarClientesNoLocalStorage() {
    const tbody = document.getElementById("clients-table-body");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");
    const clientes = [];

    rows.forEach(row => {
        const cols = row.querySelectorAll("td");
        if (cols.length >= 5) {
            clientes.push({
                nome: cols[0]?.innerText.trim() || '—',
                email: cols[1]?.innerText.trim() || '—',
                cpf: cols[2]?.innerText.trim() || '—',
                data: cols[3]?.innerText.trim() || '—',
                valor: cols[4]?.innerText.trim() || 'R$0',
                origem: cols[5]?.innerText.trim() || 'Direto'
            });
        }
    });

    localStorage.setItem("dashboard_clientes", JSON.stringify(clientes));
}

// 2. CARREGAR CLIENTES DO LOCALSTORAGE
function carregarClientesDoLocalStorage() {
    const tbody = document.getElementById("clients-table-body");
    if (!tbody) return;

    const dadosSalvos = localStorage.getItem("dashboard_clientes");
    if (!dadosSalvos) return;

    const clientes = JSON.parse(dadosSalvos);
    if (clientes.length === 0) return;

    tbody.innerHTML = "";
    clientes.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.email}</td>
            <td>${item.cpf}</td>
            <td>${item.data}</td>
            <td>${item.valor}</td>
            <td>${item.origem || 'Direto'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. IMPORTAR CLIENTES VIA CSV
function importarClientesCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n');
        const tbody = document.getElementById('clients-table-body');

        if (tbody) tbody.innerHTML = '';

        rows.forEach((row, dashboard) => {
            // Pula a primeira linha caso seja o cabeçalho
            if (dashboard === 0 && (row.toLowerCase().includes('cliente') || row.toLowerCase().includes('nome'))) return;
            
            const columns = row.split(',');
            if (row.trim() !== '') {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${columns[0]?.trim() || '—'}</td>
                    <td>${columns[1]?.trim() || '—'}</td>
                    <td>${columns[2]?.trim() || '—'}</td>
                    <td>${columns[3]?.trim() || '—'}</td>
                    <td>${columns[4]?.trim() || 'R$0'}</td>
                    <td>${columns[5]?.trim() || 'Direto'}</td>
                `;
                if (tbody) tbody.appendChild(tr);
            }
        });

        // Guarda as alterações
        salvarClientesNoLocalStorage();
    };
    reader.readAsText(file);
}

// 4. EXPORTAR CLIENTES PARA CSV
function exportarClientesCSV() {
    let csv = ["Cliente,E-mail,CPF,Data do pedido,Valor,Origem"];
    const rows = document.querySelectorAll("#clients-table-body tr");
    
    rows.forEach(row => {
        let colsData = [];
        row.querySelectorAll("td").forEach(col => colsData.push(`"${col.innerText.trim()}"`));
        csv.push(colsData.join(","));
    });

    const csvFile = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const downloadLink = document.createElement("a");
    downloadLink.download = "lista_clientes.csv";
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// 5. EXPORTAR CLIENTES PARA PDF
function exportarClientesPDF() {
    const element = document.getElementById('printable-clients-table');
    if (!element) return;
    
    const opt = {
        margin:       15,
        filename:     'lista_clientes.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save();
}

// 6. INICIALIZAÇÃO AO CARREGAR A PÁGINA DE CLIENTES
document.addEventListener("DOMContentLoaded", function () {
    carregarClientesDoLocalStorage();
});

/* =========================================================
    --- DASHBOARD ---  
   ========================================================= */

// ==========================================================================
// 1. EXTRAÇÃO E OBTENÇÃO DE DADOS
// ==========================================================================
function obterDadosDasAbas() {
    const vendasSalvas = localStorage.getItem("dashboard_vendas");
    const vendas = vendasSalvas ? JSON.parse(vendasSalvas) : [
        { pedido: "218B9R4S97H", cliente: "Ana Julia", produto: "Colar Lion KIng", qtd: 1, status: "Aceito", data: "13/04/2026", valor: 30 },
        { pedido: "260118AG55M", cliente: "Jaciara Caldas", produto: "Bracelete Cobra Cravejada", qtd: 1, status: "Em execução", data: "12/04/2026", valor: 67 },
        { pedido: "2601KUV9MN", cliente: "Edilene Souza", produto: "Anel Borboleta Casal", qtd: 2, status: "Enviado", data: "08/04/2026", valor: 135 },
        { pedido: "2601K2740F", cliente: "Marcela Santos", produto: "Pulseira Borboleta Cravejado", qtd: 3, status: "Enviado", data: "02/04/2026", valor: 115 }
    ];

    const clientesSalvos = localStorage.getItem("dashboard_clientes");
    const clientes = clientesSalvos ? JSON.parse(clientesSalvos) : [
        { nome: "Ana Julia", email: "customer1@gmail.com", cpf: "123578938930", valor: "30", origem: "Instagram" },
        { nome: "Jaciara Caldas", email: "customer4@gmail.com", cpf: "199292902000", valor: "67", origem: "WhatsApp" },
        { nome: "Edilene Souza", email: "customer8@gmail.com", cpf: "1937373838999", valor: "135", origem: "Site" },
        { nome: "Claudia Geraldo", email: "customer2@gmail.com", cpf: "123578938930", valor: "114", origem: "Anúncio pago" },
        { nome: "José Silva", email: "customer3@gmail.com", cpf: "15498762409", valor: "24", origem: "Facebook" }
    ];

    const produtosSalvos = localStorage.getItem("dashboard_produtos");
    const produtos = produtosSalvos ? JSON.parse(produtosSalvos) : [
        { name: "Colar Coração", qty: "8 unidades", category: "Colar", price: "R$ 30,00" },
        { name: "Pulseira Girassol Cravejado", qty: "12 unidades", category: "Pulseira", price: "R$ 120,00" },
        { name: "Bracelete Cobra Cravejada", qty: "5 unidades", category: "Bracelete", price: "R$ 67,00" },
        { name: "Anel Borboleta Casal", qty: "15 unidades", category: "Anel", price: "R$ 67,50" },
        { name: "Pulseira Borboleta Cravejado", qty: "10 unidades", category: "Pulseira", price: "R$ 38,33" }
    ];

    return { vendas, clientes, produtos };
}

// Guardar instâncias dos gráficos para reinicialização limpa
let chartStatus, chartVendasAno, chartCategorias, chartEstados, chartTopProdutos, chartOrigemClientes;

// ==========================================================================
// 2. RENDERIZAÇÃO DO DASHBOARD E GRÁFICOS
// ==========================================================================

function renderizarDashboard() {
    const cards = document.querySelectorAll(".chart-card");
    if (!cards || cards.length === 0) return;

    const { clientes, vendas , produtos } = obterDadosDasAbas();

    // 1. Processamento de Vendas por Status
    const statusCounts = {};
    vendas.forEach(v => {
        const st = v.status || "Em execução";
        statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    // 2. Processamento do Faturamento por Mês do Ano
    const mesesDoAno = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const vendasPorMes = new Array(12).fill(0);
    vendas.forEach(v => {
        let valorNum = typeof v.valor === "number" ? v.valor : parseFloat(String(v.valor).replace("R$", "").replace(".", "").replace(",", ".").trim()) || 0;
        if (v.data && v.data.includes("/")) {
            const partes = v.data.split("/");
            const mesDashboard = parseInt(partes[1], 10) - 1;
            if (mesDashboard >= 0 && mesDashboard < 12) vendasPorMes[mesDashboard] += valorNum;
        } else {
            vendasPorMes[3] += valorNum; // Padrão: Abril
        }
    });

    // 3. Processamento de Categorias de Produtos
    const categoriasCounts = {};
    produtos.forEach(p => {
        const cat = p.category || "Geral";
        categoriasCounts[cat] = (categoriasCounts[cat] || 0) + 1;
    });

    // 4. Ranking de Produtos Mais Vendidos
    const produtosVendidos = {};
    vendas.forEach(v => {
        const qtd = parseInt(v.qtd, 10) || 1;
        produtosVendidos[v.produto] = (produtosVendidos[v.produto] || 0) + qtd;
    });
    const topProdutos = Object.entries(produtosVendidos).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // 5. Processamento de Origem dos Clientes
    const origensCounts = {};
    clientes.forEach(c => {
        const origem = c.origem || "Site";
        origensCounts[origem] = (origensCounts[origem] || 0) + 1;
    });

    // --- RENDERIZAÇÃO DOS CANVAS NOS CARDS ---

    // Card 1: Vendas por Status
    if (cards[0]) {
        const placeholder = cards[0].querySelector(".chart-placeholder");
        if (placeholder) {
            placeholder.innerHTML = '<canvas id="canvasOrigemClientes"></canvas>';
            const ctx1 = document.getElementById("canvasOrigemClientes")?.getContext("2d");
            if (ctx1) {
                if (chartOrigemClientes instanceof Chart) chartOrigemClientes.destroy();
                chartOrigemClientes = new Chart(ctx1, {
                    type: "bar",
                    data: {
                        labels: Object.keys(origensCounts).length ? Object.keys(origensCounts) : ["Sem dados"],
                        datasets: [{
                            label: "Quantidade de Clientes",
                            data: Object.keys(origensCounts).length ? Object.values(origensCounts) : [0],
                            backgroundColor: "#4C84FF",
                            borderRadius: 4
                        }]
                    },
                    options: {
                        dashboardAxis: "y",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }
    }

    // Card 2: Total de Vendas no Ano
    cards[1].querySelector(".chart-placeholder").innerHTML = '<canvas id="canvasVendasAno"></canvas>';
    if (chartVendasAno) chartVendasAno.destroy();
    chartVendasAno = new Chart(document.getElementById("canvasVendasAno"), {
        type: "bar",
        data: {
            labels: mesesDoAno,
            datasets: [{ label: "Total de Vendas (R$)", data: vendasPorMes, backgroundColor: "#198754", borderRadius: 4 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: v => 'R$ ' + v } } }
        }
    });

    // Card 3: Categorias de Produtos em Estoque
    cards[2].querySelector(".chart-placeholder").innerHTML = '<canvas id="canvasCategorias"></canvas>';
    if (chartCategorias) chartCategorias.destroy();
    chartCategorias = new Chart(document.getElementById("canvasCategorias"), {
        type: "pie",
        data: {
            labels: Object.keys(categoriasCounts),
            datasets: [{ data: Object.values(categoriasCounts), backgroundColor: ["#b507ff", "#0dcaf0", "#6f42c1", "#fd7e14", "#20c997"] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Card 4: Resumo dos Estados
    const estadosExemplo = { "SP": 2, "RJ": 1, "MG": 1 };
    cards[3].querySelector(".chart-placeholder").innerHTML = '<canvas id="canvasEstados"></canvas>';
    if (chartEstados) chartEstados.destroy();
    chartEstados = new Chart(document.getElementById("canvasEstados"), {
        type: "bar",
        data: {
            labels: Object.keys(estadosExemplo),
            datasets: [{ label: "Pedidos por Estado", data: Object.values(estadosExemplo), backgroundColor: "#0dcaf0" }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Card 5: TOP 5 Produtos Mais Vendidos
    cards[4].querySelector(".chart-placeholder").innerHTML = '<canvas id="canvasTopProdutos"></canvas>';
    if (chartTopProdutos) chartTopProdutos.destroy();
    chartTopProdutos = new Chart(document.getElementById("canvasTopProdutos"), {
        type: "bar",
        data: {
            labels: topProdutos.map(p => p[0]),
            datasets: [{ label: "Unidades Vendidas", data: topProdutos.map(p => p[1]), backgroundColor: "#b507ff" }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Card 6 (Se existir): Origem dos Clientes (Gráfico Horizontal)
    if (cards[5]) {
        cards[5].querySelector(".chart-placeholder").innerHTML = '<canvas id="canvasOrigemClientes"></canvas>';
        if (chartOrigemClientes) chartOrigemClientes.destroy();
        chartOrigemClientes = new Chart(document.getElementById("canvasOrigemClientes"), {
            type: "bar",
            data: {
                labels: Object.keys(origensCounts),
                datasets: [{ label: "Clientes", data: Object.values(origensCounts), backgroundColor: "#4C84FF" }]
            },
            options: {
                dashboardAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
}

// ==========================================================================
// 3. GESTÃO DE PRODUTOS
// ==========================================================================
function importarProdutosCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const rows = e.target.result.split('\n');
        const tbody = document.getElementById('products-table-body');

        rows.forEach((row, dashboard) => {
            if (dashboard === 0 && row.toLowerCase().includes('produto')) return;
            const columns = row.split(',');
            if (columns.length >= 3) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="product-cell">
                            <label class="product-image" title="Clique para alterar a imagem">
                                <i class="fa-regular fa-image"></i>
                                <input type="file" accept="image/*" onchange="trocarImagem(event)">
                            </label>
                            <div class="product-meta">
                                <span class="product-name">${columns[0]?.trim() || 'Novo Produto'}</span>
                                <span class="product-qty">${columns[1]?.trim() || '0'} unidades</span>
                            </div>
                        </div>
                    </td>
                    <td>${columns[2]?.trim() || 'Geral'}</td>
                    <td>${columns[3]?.trim() || 'R$0'}</td>
                    <td class="actions-cell"><i class="fa-solid fa-ellipsis-vertical"></i></td>
                `;
                if (tbody) tbody.appendChild(tr);
            }
        });
        salvarProdutosNoLocalStorage();
        atualizarContadorProdutos();
    };
    reader.readAsText(file);
}

function salvarProdutosNoLocalStorage() {
    const rows = document.querySelectorAll("#products-table-body tr");
    const produtos = [];
    rows.forEach(row => {
        produtos.push({
            name: row.querySelector(".product-name")?.innerText || '',
            qty: row.querySelector(".product-qty")?.innerText || '',
            category: row.querySelectorAll("td")[1]?.innerText || 'Geral',
            price: row.querySelectorAll("td")[2]?.innerText || 'R$0',
            image: row.querySelector(".product-image img")?.src || null
        });
    });
    localStorage.setItem("dashboard_produtos", JSON.stringify(produtos));
}

function carregarProdutosDoLocalStorage() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    const dadosSalvos = localStorage.getItem("dashboard_produtos");
    if (!dadosSalvos) return;

    const produtos = JSON.parse(dadosSalvos);
    if (produtos.length === 0) return;

    tbody.innerHTML = ''; 
    produtos.forEach(prod => {
        const tr = document.createElement('tr');
        const imagemHTML = prod.image ? `<img src="${prod.image}">` : `<i class="fa-regular fa-image"></i>`;
        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <label class="product-image" title="Clique para alterar a imagem">
                        ${imagemHTML}
                        <input type="file" accept="image/*" onchange="trocarImagem(event)">
                    </label>
                    <div class="product-meta">
                        <span class="product-name">${prod.name}</span>
                        <span class="product-qty">${prod.qty}</span>
                    </div>
                </div>
            </td>
            <td>${prod.category}</td>
            <td>${prod.price}</td>
            <td class="actions-cell"><i class="fa-solid fa-ellipsis-vertical"></i></td>
        `;
        tbody.appendChild(tr);
    });
    atualizarContadorProdutos();
}

function atualizarContadorProdutos() {
    const rows = document.querySelectorAll("#products-table-body tr");
    let totalUnidades = 0;
    rows.forEach(row => {
        const qtyText = row.querySelector(".product-qty")?.innerText || "";
        const qtyNum = parseInt(qtyText.replace(/\D/g, ""), 10);
        if (!isNaN(qtyNum)) totalUnidades += qtyNum;
    });
    const header = document.getElementById("total-count-header");
    if (header) {
        header.innerText = `${totalUnidades} itens em estoque (${rows.length} ${rows.length === 1 ? 'produto' : 'produtos'})`;
    }
}

function trocarImagem(event) {
    const input = event.target;
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const label = input.closest('.product-image');
            const icon = label.querySelector('i');
            if (icon) icon.style.display = 'none';
            
            let img = label.querySelector('img');
            if (!img) {
                img = document.createElement('img');
                label.appendChild(img);
            }
            img.src = e.target.result;
            salvarProdutosNoLocalStorage();
        };
        reader.readAsDataURL(file);
    }
}

// ==========================================================================
// 4. GESTÃO DE VENDAS
// ==========================================================================
function salvarVendasNoLocalStorage() {
    const tbody = document.getElementById("sales-table-body");
    if (!tbody) return;
    const vendas = [];
    tbody.querySelectorAll("tr").forEach(row => {
        const cols = row.querySelectorAll("td");
        if (cols.length >= 7) {
            vendas.push({
                pedido: cols[0].innerText.trim(),
                cliente: cols[1].innerText.trim(),
                produto: cols[2].innerText.trim(),
                qtd: cols[3].innerText.trim(),
                status: cols[4].innerText.trim(),
                data: cols[5].innerText.trim(),
                valor: cols[6].innerText.trim()
            });
        }
    });
    localStorage.setItem("dashboard_vendas", JSON.stringify(vendas));
}

function carregarVendasDoLocalStorage() {
    const tbody = document.getElementById("sales-table-body");
    if (!tbody) return;
    const dadosSalvos = localStorage.getItem("dashboard_vendas");
    if (!dadosSalvos) return;

    const vendas = JSON.parse(dadosSalvos);
    if (vendas.length === 0) return;

    tbody.innerHTML = "";
    vendas.forEach(item => {
        let classeStatus = 'status-execucao';
        const st = item.status.toLowerCase();
        if (st === 'aceito') classeStatus = 'status-aceito';
        if (st === 'enviado') classeStatus = 'status-enviado';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.pedido}</td>
            <td>${item.cliente}</td>
            <td>${item.produto}</td>
            <td>${item.qtd}</td>
            <td><span class="status ${classeStatus}">${item.status}</span></td>
            <td>${item.data}</td>
            <td>${item.valor}</td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarContadoresVendas() {
    const tbody = document.getElementById("sales-table-body");
    if (tbody) salvarVendasNoLocalStorage();
    
    const vendasSalvas = localStorage.getItem("dashboard_vendas");
    const vendas = vendasSalvas ? JSON.parse(vendasSalvas) : [];

    let porCobrar = 0, porEmbalar = 0, porEnviar = 0;
    vendas.forEach(item => {
        const st = (item.status || "").toLowerCase().trim();
        if (st === "em execução" || st === "em execucao") porCobrar++;
        else if (st === "aceito") porEmbalar++;
        else if (st === "enviado") porEnviar++;
    });

    const elPorCobrar = document.getElementById("count-por-cobrar") || document.getElementById("count-execucao");
    const elPorEmbalar = document.getElementById("count-por-embalar") || document.getElementById("count-aceito");
    const elPorEnviar = document.getElementById("count-por-enviar") || document.getElementById("count-enviado");

    if (elPorCobrar) elPorCobrar.innerText = porCobrar;
    if (elPorEmbalar) elPorEmbalar.innerText = porEmbalar;
    if (elPorEnviar) elPorEnviar.innerText = porEnviar;
}

// ==========================================================================
// 5. GESTÃO DE CLIENTES
// ==========================================================================
function salvarClientesNoLocalStorage() {
    const tbody = document.getElementById("clients-table-body");
    if (!tbody) return;
    const clientes = [];
    tbody.querySelectorAll("tr").forEach(row => {
        const cols = row.querySelectorAll("td");
        if (cols.length >= 5) {
            clientes.push({
                nome: cols[0].innerText.trim(),
                email: cols[1].innerText.trim(),
                cpf: cols[2].innerText.trim(),
                data: cols[3].innerText.trim(),
                valor: cols[4].innerText.trim(),
                origem: cols[5]?.innerText.trim() || 'Site'
            });
        }
    });
    localStorage.setItem("dashboard_clientes", JSON.stringify(clientes));
}

function carregarClientesDoLocalStorage() {
    const tbody = document.getElementById("clients-table-body");
    if (!tbody) return;
    const dadosSalvos = localStorage.getItem("dashboard_clientes");
    if (!dadosSalvos) return;

    const clientes = JSON.parse(dadosSalvos);
    if (clientes.length === 0) return;

    tbody.innerHTML = "";
    clientes.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.email}</td>
            <td>${item.cpf}</td>
            <td>${item.data}</td>
            <td>${item.valor}</td>
            <td>${item.origem}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* ==========================================================================
   CONFIGURAÇÃO GLOBAL DE TRANSIÇÃO DOS GRAFICOS(CHART.JS)
   ========================================================================== */
// Configurações padrão para garantir transições suaves em todos os gráficos (animação dos graficos) 

Chart.defaults.transitions = {
        active: {
            animation: {
                duration: 400
            }
        }
    };

//Mostra os dados quando passa o mouse em cima
const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        plugins: {
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
            }
        }
    };

/* ==========================================================================
   EXPORTAÇÕES (CSV & PDF)
   ========================================================================== */

// Função genérica e reutilizável para download de arquivos CSV
function downloadCSV(csvContent, fileName) {
    const csvFile = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadLink = document.createElement("a");
    
    downloadLink.download = fileName;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Exportação em PDF ajustada
function exportarDashboardPDF() {
    // 1. Tenta encontrar a div 'printable-dashboard' ou busca um container fallback
    const element = document.getElementById('printable-dashboard') || document.querySelector('.dashboard-container') || document.querySelector('main');
    
    if (!element) {
        alert("Erro: Não foi possível localizar o contêiner do Dashboard para exportação.");
        return;
    }

    if (typeof html2pdf === "undefined") {
        alert("Erro: A biblioteca 'html2pdf' não está carregada no seu HTML. Adicione o CDN do html2pdf.js.");
        return;
    }

    // Feedback visual básico (opcional)
    const btnPDF = document.getElementById("btnExportarPDF");
    if (btnPDF) btnPDF.innerText = "Gerando PDF...";

    const opt = {
        margin:       10,
        filename:     `relatorio_dashboard_${new Date().toISOString().slice(0, 10)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#1e293b', logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        if (btnPDF) btnPDF.innerText = "Exportar PDF";
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        if (btnPDF) btnPDF.innerText = "Exportar PDF";
        alert("Ocorreu um erro ao gerar o PDF.");
    });
}

// Exportação em CSV
function exportarDashboardParaCSV() {
    const dados = typeof obterDadosDasAbas === "function" 
        ? obterDadosDasAbas() 
        : { clientes: [], vendas: [], produtos: [] };

    const clientes = dados.clientes || [];
    const vendas = dados.vendas || [];

    // --- Processar Origens dos Clientes ---
    const origensCounts = {};
    clientes.forEach(c => {
        const origem = c.origem || "Site";
        origensCounts[origem] = (origensCounts[origem] || 0) + 1;
    });

    // --- Processar Vendas Mensais ---
    const mesesDoAno = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const vendasPorMes = new Array(12).fill(0);

    vendas.forEach(v => {
        let valorNum = typeof v.valor === "number" 
            ? v.valor 
            : parseFloat(String(v.valor || 0).replace("R$", "").replace(".", "").replace(",", ".").trim()) || 0;

        if (v.data && v.data.includes("/")) {
            const partes = v.data.split("/");
            const mesDashboard = parseInt(partes[1], 10) - 1;
            if (mesDashboard >= 0 && mesDashboard < 12) {
                vendasPorMes[mesDashboard] += valorNum;
            }
        }
    });

    // Construção do CSV
    let csvContent = "\uFEFF";
    csvContent += "--- FATURAMENTO MENSAL ---\n";
    csvContent += "Mes;Total Vendido (R$)\n";
    mesesDoAno.forEach((mes, idx) => {
        csvContent += `"${mes}";"${vendasPorMes[idx].toFixed(2).replace('.', ',')}"\n`;
    });

    csvContent += "\n--- ORIGEM DOS CLIENTES ---\n";
    csvContent += "Origem;Quantidade de Clientes\n";
    Object.entries(origensCounts).forEach(([origem, qtd]) => {
        csvContent += `"${origem}";"${qtd}"\n`;
    });

    const nomeArquivo = `dashboard_relatorio_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(csvContent, nomeArquivo);
}

// Vincula os eventos aos botões
document.addEventListener("DOMContentLoaded", () => {
    const btnCSV = document.getElementById("btnExportarCSV");
    if (btnCSV) {
        btnCSV.removeEventListener("click", exportarDashboardParaCSV);
        btnCSV.addEventListener("click", exportarDashboardParaCSV);
    }

    const btnPDF = document.getElementById("btnExportarPDF");
    if (btnPDF) {
        btnPDF.removeEventListener("click", exportarDashboardPDF);
        btnPDF.addEventListener("click", exportarDashboardPDF);
    }
});
// ==========================================================================
// 7. INICIALIZAÇÃO E EVENT LISTENERS
// ==========================================================================
window.addEventListener("storage", renderizarDashboard);

document.addEventListener("DOMContentLoaded", function () {
    // 1. Carregar dados mantidos no localStorage
    if (typeof carregarProdutosDoLocalStorage === "function") carregarProdutosDoLocalStorage();
    if (typeof carregarVendasDoLocalStorage === "function") carregarVendasDoLocalStorage();
    if (typeof carregarClientesDoLocalStorage === "function") carregarClientesDoLocalStorage();

    // 2. Atualizar contadores visuais
    if (typeof atualizarContador === "function") atualizarContador();
    if (typeof atualizarContadoresVendas === "function") atualizarContadoresVendas();

    // 3. Renderizar gráficos do Dashboard (se estiver na dashboard.html)
    if (typeof renderizarDashboard === "function") {
        if (typeof Chart === "undefined") {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/chart.js";
            script.onload = renderizarDashboard;
            document.head.appendChild(script);
        } else {
            renderizarDashboard();
        }
    }

    // 4. Vincular Botões de Exportação
    const btnCSV = document.getElementById("btnExportarCSV");
    if (btnCSV && typeof exportarDashboardParaCSV === "function") {
        btnCSV.addEventListener("click", exportarDashboardParaCSV);
    }

    const btnPDF = document.getElementById("btnExportarPDF");
    if (btnPDF && typeof exportarDashboardPDF === "function") {
        btnPDF.addEventListener("click", exportarDashboardPDF);
    }
});