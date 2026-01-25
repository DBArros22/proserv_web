// Configurações e Estado Inicial
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
let anuncios = JSON.parse(localStorage.getItem('anuncios')) || [];
let sessao = JSON.parse(localStorage.getItem('sessao')) || null;

const app = document.getElementById('app-container');
const categoriasOpcoes = ["Pintor", "Eletricista", "Diarista", "Babá", "Cuidadora", "Pedreiro", "Bombeiro Hidráulico", "Costureira", "Jardineiro", "Montador de Móveis", "Outros"];
const bairrosOpcoes = ["Centro", "Zona Sul", "Zona Norte", "Zona Oeste", "Barra", "Recreio", "Niterói", "São Gonçalo", "Outras Regiões"];

// Solidificação do Banco de Dados (Garante que anúncios antigos tenham dono)
function solidificarBanco() {
    if (!sessao) return;
    let mudou = false;
    anuncios = anuncios.filter(a => {
        if (!a.id) { mudou = true; return false; }
        if (!a.userId) { a.userId = sessao.id; mudou = true; }
        return true;
    });
    if (mudou) localStorage.setItem('anuncios', JSON.stringify(anuncios));
}
solidificarBanco();

// Conversor de Imagem para Base64
const toB64 = file => new Promise((res) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = () => res(null);
    reader.readAsDataURL(file);
});

// Inicialização
function init() {
    renderHeader();
    if (!sessao) renderAuth();
    else renderFeed();
}

// Busca dados atualizados do dono do anúncio
function getDonoAnuncio(userId) {
    const user = usuarios.find(u => u.id === userId);
    return user ? user : { nome: "Usuário", foto: "" };
}

function renderHeader() {
    const header = document.getElementById('main-header');
    if (!sessao) {
        header.innerHTML = `<div class="nav-container"><a class="logo" onclick="location.reload()">Pro<span>Serv</span></a></div>`;
        return;
    }
    header.innerHTML = `
        <div class="nav-container">
            <a onclick="renderFeed()" class="logo" style="cursor:pointer">Pro<span>Serv</span></a>
            <div class="profile-wrapper">
                <span style="font-weight:700">${sessao.nome.split(' ')[0]}</span>
                <img src="${sessao.foto || 'https://via.placeholder.com/100'}" id="header-avatar">
                <div class="dropdown-menu">
                    <a onclick="renderPerfil()"><i class="fas fa-user-circle"></i> Meu Perfil</a>
                    <a onclick="renderMeusAnuncios()"><i class="fas fa-briefcase"></i> Meus Serviços</a>
                    <a onclick="logout()" style="color:var(--danger)"><i class="fas fa-power-off"></i> Sair</a>
                </div>
            </div>
        </div>`;
}

// --- TELAS DE FEED ---
function renderFeed() {
    app.innerHTML = `
        <div class="container">
            <div style="background:#fff; padding:20px; border-radius:15px; margin-bottom:30px; box-shadow:var(--shadow); display:grid; grid-template-columns: 1.5fr 1fr 1fr; gap:15px;">
                <input type="text" id="search-txt" placeholder="O que você precisa?" style="padding:12px; border-radius:10px; border:1px solid #ddd" oninput="buscar()">
                <select id="search-cat" style="padding:12px; border-radius:10px; border:1px solid #ddd" onchange="buscar()">
                    <option value="">Todas Categorias</option>
                    ${categoriasOpcoes.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <select id="search-bai" style="padding:12px; border-radius:10px; border:1px solid #ddd" onchange="buscar()">
                    <option value="">Todos os Bairros</option>
                    ${bairrosOpcoes.map(b => `<option value="${b}">${b}</option>`).join('')}
                </select>
            </div>
            <div id="services-grid" class="services-grid"></div>
        </div>`;
    buscar();
}

function buscar() {
    const txt = document.getElementById('search-txt')?.value.toLowerCase() || "";
    const cat = document.getElementById('search-cat')?.value || "";
    const bai = document.getElementById('search-bai')?.value || "";
    const filtrados = anuncios.filter(a => (a.titulo.toLowerCase().includes(txt)) && (cat === "" || a.categoria === cat) && (bai === "" || a.bairro === bai)).sort((a,b) => b.id - a.id);
    renderCards(filtrados, 'feed');
}

function renderMeusAnuncios() {
    const meusAnuncios = anuncios.filter(a => a.userId === sessao.id);
    app.innerHTML = `
        <div class="container">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px">
                <h1 style="font-weight:800">Meus Serviços Postados</h1>
                <button class="btn-primary" style="width:auto; padding:12px 25px" onclick="renderCriarAnuncio()">+ Novo Anúncio</button>
            </div>
            <div id="services-grid" class="services-grid"></div>
        </div>`;
    renderCards(meusAnuncios, 'gerenciar');
}

function renderCards(lista, modo) {
    const grid = document.getElementById('services-grid');
    if (!grid) return;
    if (lista.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:40px; color:#94a3b8">Nenhum serviço encontrado.</p>`;
        return;
    }
    grid.innerHTML = lista.map(a => {
        const dono = getDonoAnuncio(a.userId);
        return `
        <div class="service-card">
            <div onclick="${modo === 'feed' ? `renderDetalhes(${a.id})` : ''}" style="cursor:${modo === 'feed' ? 'pointer' : 'default'}">
                <div class="card-gallery">${a.fotos && a.fotos.length > 0 ? a.fotos.slice(0,3).map(f => `<img src="${f}">`).join('') : '<img src="https://via.placeholder.com/400x300?text=Sem+Foto">'}</div>
                <div style="padding:18px">
                    <small style="color:var(--brand); font-weight:800; text-transform:uppercase">${a.categoria}</small>
                    <h3 style="margin:5px 0; font-size:1.1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.titulo}</h3>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px">
                        <span style="font-weight:800; color:var(--brand)">R$ ${a.preco}</span>
                        <span style="font-size:0.8rem; color:var(--text-muted)">${a.bairro}</span>
                    </div>
                </div>
            </div>
            ${modo === 'gerenciar' ? `<div style="padding:0 18px 18px 18px; display:flex; gap:10px"><button class="btn-outline" style="flex:1; padding:8px" onclick="renderCriarAnuncio(${a.id})">Editar</button><button class="btn-outline" style="flex:1; padding:8px; color:var(--danger)" onclick="excluirAnuncio(${a.id})">Excluir</button></div>` : ''}
        </div>`}).join('');
}

// --- TELA DETALHADA DO SERVIÇO (CORRIGIDA) ---
function renderDetalhes(id) {
    const a = anuncios.find(x => x.id === id);
    const dono = getDonoAnuncio(a.userId);
    window.scrollTo(0,0);

    app.innerHTML = `
    <div class="container">
        <button class="btn-outline" style="border:none; margin-bottom:15px; cursor:pointer" onclick="renderFeed()">← Voltar</button>
        <div class="auth-card" style="max-width:100%; text-align:left">
            <div class="auth-content">
                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:20px; margin-bottom:30px">
                    <div style="display:flex; gap:15px; align-items:center">
                        <img src="${dono.foto || 'https://via.placeholder.com/100'}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border: 2px solid #eee">
                        <div>
                            <h1 style="font-size:1.8rem; margin:0">${a.titulo}</h1>
                            <p style="color:var(--text-muted); margin:5px 0">${dono.nome} • ${a.bairro}</p>
                        </div>
                    </div>

                    <div style="text-align:right; min-width:180px">
                        <h2 style="color:var(--brand); font-size:2.2rem; margin:0 0 20px 0">R$ ${a.preco}</h2>
                        <div style="display:flex; flex-direction:column; gap:12px">
                            <a href="https://wa.me/55${a.whatsapp.replace(/\D/g,'')}" target="_blank" class="btn-primary" style="background:#22c55e; border:none; display:flex; align-items:center; justify-content:center; gap:8px; padding:14px">
                                <i class="fab fa-whatsapp"></i> WhatsApp
                            </a>
                            ${a.social ? `
                                <a href="${a.social.startsWith('http') ? a.social : 'https://' + a.social}" target="_blank" class="btn-outline" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; background:#f8fafc">
                                    <i class="fas fa-share-alt"></i> Redes Sociais
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:15px; margin-bottom:25px">
                    ${a.fotos && a.fotos.length > 0 ? a.fotos.map(f => `
                        <img src="${f}" style="width:100%; height:400px; object-fit:cover; border-radius:15px; box-shadow: var(--shadow)">
                    `).join('') : ''}
                </div>

                <div style="background:#f8fafc; padding:25px; border-radius:15px; border:1px solid #e2e8f0">
                    <h4 style="margin:0 0 15px 0; font-size:1.2rem; color:var(--text-main)">Descrição do Serviço</h4>
                    <p style="white-space:pre-wrap; color:var(--text-muted); line-height:1.6; margin:0">${a.descricao || 'Sem descrição detalhada.'}</p>
                </div>
            </div>
        </div>
    </div>`;
}

// --- FORMULÁRIO DE ANÚNCIO (CORRIGIDO) ---
function renderCriarAnuncio(editId = null) {
    const editA = editId ? anuncios.find(x => x.id === editId) : null;
    app.innerHTML = `
    <div class="container" style="max-width:600px">
        <div class="auth-card" style="margin-top:20px">
            <div class="auth-content">
                <h2 style="margin-bottom:20px">${editId ? 'Editar Anúncio' : 'Publicar Novo Serviço'}</h2>
                <form id="f-post">
                    <div class="input-group"><i class="fas fa-bullhorn"></i><input type="text" id="a-tit" value="${editA?.titulo || ''}" placeholder="Título (Ex: Pintor Profissional)" required></div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                        <div class="input-group"><i class="fas fa-list"></i><select id="a-cat" required>
                            <option value="">Categoria</option>
                            ${categoriasOpcoes.map(c => `<option value="${c}" ${editA?.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select></div>
                        <div class="input-group"><i class="fas fa-map-marker-alt"></i><select id="a-bai" required>
                            <option value="">Bairro</option>
                            ${bairrosOpcoes.map(b => `<option value="${b}" ${editA?.bairro === b ? 'selected' : ''}>${b}</option>`).join('')}
                        </select></div>
                    </div>
                    <div class="input-group"><i class="fas fa-dollar-sign"></i><input type="number" id="a-pre" value="${editA?.preco || ''}" placeholder="Valor R$" required></div>
                    <div class="input-group"><i class="fab fa-whatsapp"></i><input type="text" id="a-whats" value="${editA?.whatsapp || sessao.whatsapp || ''}" placeholder="WhatsApp" required></div>
                    <div class="input-group"><i class="fas fa-link"></i><input type="text" id="a-social" value="${editA?.social || ''}" placeholder="Link do Instagram/Facebook"></div>
                    <div class="input-group" style="padding-left:0"><textarea id="a-des" rows="4" placeholder="Descrição completa do serviço..." style="padding-left:15px; width:100%; border:none">${editA?.descricao || ''}</textarea></div>
                    <input type="file" id="a-fotos" multiple accept="image/*" style="margin-bottom:20px; width:100%">
                    <button type="submit" class="btn-primary" id="btn-submit-anuncio">${editId ? 'Salvar Alterações' : 'Publicar Agora'}</button>
                    <button type="button" class="btn-outline" style="width:100%; margin-top:10px; border:none" onclick="renderMeusAnuncios()">Cancelar</button>
                </form>
            </div>
        </div>
    </div>`;

    document.getElementById('f-post').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-anuncio');
        btn.innerText = "Processando...";
        btn.disabled = true;

        const fFotos = document.getElementById('a-fotos');
        let fotos = editA ? editA.fotos : [];
        if (fFotos.files.length > 0) fotos = await Promise.all(Array.from(fFotos.files).slice(0, 4).map(f => toB64(f)));

        const obj = { id: editId || Date.now(), userId: sessao.id, titulo: document.getElementById('a-tit').value, categoria: document.getElementById('a-cat').value, preco: document.getElementById('a-pre').value, bairro: document.getElementById('a-bai').value, whatsapp: document.getElementById('a-whats').value, social: document.getElementById('a-social').value, descricao: document.getElementById('a-des').value, fotos };

        if (editId) anuncios[anuncios.findIndex(a => a.id === editId)] = obj;
        else anuncios.push(obj);

        localStorage.setItem('anuncios', JSON.stringify(anuncios));
        alert("✅ Serviço salvo com sucesso!");
        renderMeusAnuncios();
    };
}

// --- PERFIL (CORRIGIDO) ---
function renderPerfil() {
    app.innerHTML = `
    <div class="auth-wrapper">
        <div class="auth-card" style="text-align:center">
            <div class="auth-content">
                <h2 style="margin-bottom:20px">Meu Perfil</h2>
                <div style="position:relative; display:inline-block; margin-bottom:20px">
                    <img id="p-preview" src="${sessao.foto || 'https://via.placeholder.com/150'}" style="width:140px; height:140px; border-radius:50%; object-fit:cover; border:4px solid var(--brand)">
                    <label for="p-foto" style="position:absolute; bottom:5px; right:5px; background:var(--brand); color:#fff; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer"><i class="fas fa-camera"></i></label>
                    <input type="file" id="p-foto" style="display:none" accept="image/*">
                </div>
                <div class="input-group"><i class="fas fa-user"></i><input type="text" id="p-nome" value="${sessao.nome}"></div>
                <button class="btn-primary" id="btn-save-profile" onclick="salvarPerfil()">Salvar Alterações</button>
                <button class="btn-outline" style="width:100%; margin-top:10px; border:none" onclick="renderFeed()">Voltar</button>
            </div>
        </div>
    </div>`;
    document.getElementById('p-foto').onchange = async (e) => {
        const file = e.target.files[0];
        if (file) document.getElementById('p-preview').src = await toB64(file);
    };
}

async function salvarPerfil() {
    const inputNome = document.getElementById('p-nome').value;
    const novaFoto = document.getElementById('p-preview').src;
    if (!inputNome) return alert("Nome obrigatório!");

    const uIdx = usuarios.findIndex(u => u.id === sessao.id);
    if (uIdx !== -1) {
        usuarios[uIdx].nome = inputNome;
        usuarios[uIdx].foto = novaFoto;
    }
    sessao.nome = inputNome;
    sessao.foto = novaFoto;
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem('sessao', JSON.stringify(sessao));
    alert("✨ Perfil atualizado com sucesso!");
    window.location.reload();
}

// --- AUTENTICAÇÃO ---
function renderAuth() {
    app.innerHTML = `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div style="display:flex; border-bottom:1px solid #eee">
                <button onclick="toggleTab('l')" id="t-l" style="flex:1; padding:20px; border:none; background:#fff; font-weight:800; color:var(--brand)">Entrar</button>
                <button onclick="toggleTab('c')" id="t-c" style="flex:1; padding:20px; border:none; background:none; font-weight:800; color:#94a3b8">Cadastrar</button>
            </div>
            <div class="auth-content">
                <form id="f-login">
                    <div class="input-group"><i class="fas fa-envelope"></i><input type="email" id="l-email" placeholder="E-mail" required></div>
                    <div class="input-group"><i class="fas fa-lock"></i><input type="password" id="l-pass" placeholder="Senha" required></div>
                    <button type="submit" class="btn-primary">Entrar</button>
                </form>
                <form id="f-cad" class="hidden">
                    <div style="text-align:center; margin-bottom:15px">
                        <img id="c-preview" src="https://via.placeholder.com/100" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid var(--brand)">
                        <label for="c-foto" style="display:block; font-size:0.8rem; color:var(--brand); cursor:pointer; margin-top:5px">Foto de Perfil</label>
                        <input type="file" id="c-foto" style="display:none" accept="image/*">
                    </div>
                    <div class="input-group"><i class="fas fa-user"></i><input type="text" id="c-nome" placeholder="Nome Completo" required></div>
                    <div class="input-group"><i class="fas fa-envelope"></i><input type="email" id="c-email" placeholder="E-mail" required></div>
                    <div class="input-group"><i class="fab fa-whatsapp"></i><input type="text" id="c-tel" placeholder="WhatsApp" required></div>
                    <div class="input-group"><i class="fas fa-lock"></i><input type="password" id="c-pass" placeholder="Senha" required></div>
                    <div class="input-group"><i class="fas fa-check-circle"></i><input type="password" id="c-pass2" placeholder="Confirmar Senha" required></div>
                    <button type="submit" class="btn-primary">Criar Conta</button>
                </form>
            </div>
        </div>
    </div>`;

    document.getElementById('c-foto').onchange = async (e) => {
        const f = e.target.files[0];
        if(f) document.getElementById('c-preview').src = await toB64(f);
    };

    document.getElementById('f-login').onsubmit = (e) => {
        e.preventDefault();
        const u = usuarios.find(x => x.email === document.getElementById('l-email').value && x.senha === document.getElementById('l-pass').value);
        if(u) { localStorage.setItem('sessao', JSON.stringify(u)); location.reload(); } 
        else alert("Credenciais incorretas!");
    };

    document.getElementById('f-cad').onsubmit = (e) => {
        e.preventDefault();
        if(document.getElementById('c-pass').value !== document.getElementById('c-pass2').value) return alert("Senhas não coincidem!");
        const novo = { id: Date.now(), nome: document.getElementById('c-nome').value, email: document.getElementById('c-email').value, whatsapp: document.getElementById('c-tel').value, senha: document.getElementById('c-pass').value, foto: document.getElementById('c-preview').src.includes('placeholder') ? "" : document.getElementById('c-preview').src };
        usuarios.push(novo);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        localStorage.setItem('sessao', JSON.stringify(novo));
        location.reload();
    };
}

function excluirAnuncio(id) {
    if (confirm("Deseja realmente excluir este anúncio?")) {
        anuncios = anuncios.filter(a => a.id !== id);
        localStorage.setItem('anuncios', JSON.stringify(anuncios));
        renderMeusAnuncios();
    }
}

function toggleTab(t) {
    document.getElementById('f-login').classList.toggle('hidden', t === 'c');
    document.getElementById('f-cad').classList.toggle('hidden', t === 'l');
    document.getElementById('t-l').style.color = t === 'l' ? 'var(--brand)' : '#94a3b8';
    document.getElementById('t-c').style.color = t === 'c' ? 'var(--brand)' : '#94a3b8';
}

function logout() { localStorage.removeItem('sessao'); location.reload(); }

init();
