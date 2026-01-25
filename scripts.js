let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
let anuncios = JSON.parse(localStorage.getItem('anuncios')) || [];
let sessao = JSON.parse(localStorage.getItem('sessao')) || null;

const app = document.getElementById('app-container');

const categoriasOpcoes = ["Pintor", "Eletricista", "Diarista", "Babá", "Cuidadora", "Pedreiro", "Bombeiro Hidráulico", "Costureira", "Jardineiro", "Montador de Móveis", "Outros"];
const bairrosOpcoes = ["Centro", "Zona Sul", "Zona Norte", "Zona Oeste", "Barra", "Recreio", "Niterói", "São Gonçalo", "Outras Regiões"];

const toB64 = file => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
});

function init() {
    renderHeader();
    if (!sessao) renderAuth();
    else renderFeed();
}

function renderHeader() {
    const header = document.getElementById('main-header');
    if (!sessao) {
        header.innerHTML = `<div class="nav-container"><a class="logo" onclick="location.reload()">Pro<span>Serv</span></a></div>`;
        return;
    }
    header.innerHTML = `
        <div class="nav-container">
            <a onclick="renderFeed()" class="logo">Pro<span>Serv</span></a>
            <div class="profile-wrapper">
                <span style="font-weight:700">${sessao.nome.split(' ')[0]}</span>
                <img src="${sessao.foto || 'https://via.placeholder.com/100'}">
                <div class="dropdown-menu">
                    <a onclick="renderPerfil()"><i class="fas fa-user"></i> Meu Perfil</a>
                    <a onclick="renderMeusAnuncios()"><i class="fas fa-briefcase"></i> Meus Serviços</a>
                    <a onclick="logout()" style="color:#ef4444"><i class="fas fa-power-off"></i> Sair da Conta</a>
                </div>
            </div>
        </div>`;
}

function renderFeed() {
    app.innerHTML = `
        <div class="container">
            <div class="search-container">
                <div class="input-group" style="margin-bottom:0">
                    <i class="fas fa-search"></i>
                    <input type="text" id="search-txt" placeholder="Buscar serviço ou profissional..." oninput="buscar()">
                </div>
                <div class="input-group" style="margin-bottom:0">
                    <i class="fas fa-th-list"></i>
                    <select id="search-cat" onchange="buscar()">
                        <option value="">Todas as Categorias</option>
                        ${categoriasOpcoes.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="input-group" style="margin-bottom:0">
                    <i class="fas fa-map-marker-alt"></i>
                    <select id="search-loc" onchange="buscar()">
                        <option value="">Todos os Bairros</option>
                        ${bairrosOpcoes.map(b => `<option value="${b}">${b}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div id="services-grid" class="services-grid"></div>
        </div>`;

    const todosAnuncios = [...anuncios].sort((a, b) => (b.dataAlt || 0) - (a.dataAlt || 0));
    renderCards(todosAnuncios, 'feed');
}

function buscar() {
    const txt = document.getElementById('search-txt').value.toLowerCase();
    const cat = document.getElementById('search-cat').value;
    const loc = document.getElementById('search-loc').value;

    const filtrados = anuncios.filter(a => {
        const bateTxt = (a.titulo || "").toLowerCase().includes(txt) || (a.nomeUser || "").toLowerCase().includes(txt);
        const bateCat = cat === "" || a.categoria === cat;
        const bateLoc = loc === "" || a.bairro === loc;
        return bateTxt && bateCat && bateLoc;
    }).sort((a, b) => (b.dataAlt || 0) - (a.dataAlt || 0));

    renderCards(filtrados, 'feed');
}

function renderCards(lista, modo) {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    if (lista.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:100px 0; color:#94a3b8">
                <i class="fas fa-search" style="font-size:3rem; display:block; margin-bottom:20px"></i>
                <p style="font-size:1.1rem; font-weight:600">Nenhum serviço encontrado aqui.</p>
            </div>`;
        return;
    }

    grid.innerHTML = lista.map(a => `
        <div class="service-card" onclick="${modo === 'feed' ? `renderDetalhes(${a.id})` : ''}">
            <div class="card-cat">${a.categoria}</div>
            <div class="card-gallery">
                ${a.fotos && a.fotos.length > 0 ? a.fotos.slice(0, 3).map(f => `<img src="${f}">`).join('') : '<img src="https://via.placeholder.com/400x300?text=Sem+Imagem">'}
            </div>
            <div style="padding:22px">
                <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:10px; color:var(--text-main); height: 1.4em; overflow: hidden;">${a.titulo}</h3>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px">
                    <span style="color:var(--brand); font-weight:800; font-size:1.3rem">R$ ${parseFloat(a.preco).toFixed(2)}</span>
                    <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted); background:#f1f5f9; padding:4px 10px; border-radius:8px">${a.bairro}</span>
                </div>
                ${modo === 'gerenciar' ? `
                    <div style="display:flex; gap:10px; margin-top:10px">
                        <button class="btn-outline" onclick="event.stopPropagation(); renderCriarAnuncio(${a.id})">Editar</button>
                        <button class="btn-outline" style="color:#ef4444; border-color:#fee2e2" onclick="event.stopPropagation(); excluirAnuncio(${a.id})">Remover</button>
                    </div>
                ` : `
                    <div style="display:flex; align-items:center; gap:8px">
                        <img src="${a.userFoto || 'https://via.placeholder.com/100'}" style="width:24px; height:24px; border-radius:50%; object-fit:cover">
                        <small style="color:var(--text-muted); font-weight:600">${a.nomeUser}</small>
                    </div>
                `}
            </div>
        </div>`).join('');
}

function renderMeusAnuncios() {
    app.innerHTML = `
        <div class="container">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px; flex-wrap:wrap; gap:15px">
                <h1 style="font-weight:800; font-size:1.8rem">Meus Serviços</h1>
                <button class="btn-primary" style="width:auto" onclick="renderCriarAnuncio()">+ Postar Novo Anúncio</button>
            </div>
            <div id="services-grid" class="services-grid"></div>
        </div>`;
    renderCards(anuncios.filter(a => a.userId === sessao.id).sort((a,b) => b.dataAlt - a.dataAlt), 'gerenciar');
}

function renderCriarAnuncio(editId = null) {
    const editA = editId ? anuncios.find(x => x.id === editId) : null;
    app.innerHTML = `
        <div class="auth-wrapper" style="min-height: auto; padding: 40px 20px;">
            <div class="auth-card" style="max-width: 650px;">
                <div class="auth-content">
                    <h2 style="margin-bottom:30px; font-weight:800; letter-spacing:-1px">${editId ? '📝 Editar Serviço' : '📢 Publicar Novo Serviço'}</h2>
                    <form id="f-post">
                        <div class="input-group">
                            <i class="fas fa-tag"></i>
                            <input type="text" id="a-tit" value="${editA?.titulo || ''}" required placeholder="O que você faz? (Título curto)">
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px">
                            <div class="input-group">
                                <i class="fas fa-th-large"></i>
                                <select id="a-cat" required>
                                    <option value="">Categoria</option>
                                    ${categoriasOpcoes.map(c => `<option value="${c}" ${editA?.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                            </div>
                            <div class="input-group">
                                <i class="fas fa-map-marker-alt"></i>
                                <select id="a-bai" required>
                                    <option value="">Bairro</option>
                                    ${bairrosOpcoes.map(b => `<option value="${b}" ${editA?.bairro === b ? 'selected' : ''}>${b}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="input-group">
                            <i class="fas fa-dollar-sign"></i>
                            <input type="number" id="a-pre" value="${editA?.preco || ''}" required placeholder="Preço Médio / Diária (R$)">
                        </div>

                        <div class="input-group">
                            <i class="fas fa-align-left" style="top: 20px; transform: none;"></i>
                            <textarea id="a-des" rows="4" placeholder="Conte mais sobre seu serviço...">${editA?.descricao || ''}</textarea>
                        </div>

                        <div class="input-group">
                             <label class="premium-file-upload" style="margin-bottom:0">
                                <i class="fas fa-images"></i> Fotos do Trabalho (Máx 4)
                                <input type="file" id="a-fotos" multiple accept="image/*" class="hidden">
                            </label>
                        </div>

                        <button type="submit" class="btn-primary" style="margin-top:10px">${editId ? 'Salvar Alterações' : 'Publicar Anúncio Agora'}</button>
                        <button type="button" class="btn-outline" style="margin-top:10px; border:none" onclick="renderMeusAnuncios()">Cancelar</button>
                    </form>
                </div>
            </div>
        </div>`;

    document.getElementById('f-post').onsubmit = async (e) => {
        e.preventDefault();
        const files = Array.from(document.getElementById('a-fotos').files).slice(0,4);
        let f64 = editA ? editA.fotos : [];
        if(files.length > 0) f64 = await Promise.all(files.map(f => toB64(f)));

        const novoPost = {
            id: editId || Date.now(),
            dataAlt: Date.now(),
            userId: sessao.id,
            nomeUser: sessao.nome,
            userFoto: sessao.foto,
            whatsapp: sessao.whatsapp,
            titulo: document.getElementById('a-tit').value,
            categoria: document.getElementById('a-cat').value,
            preco: document.getElementById('a-pre').value,
            bairro: document.getElementById('a-bai').value,
            descricao: document.getElementById('a-des').value,
            fotos: f64,
            reviews: editA ? editA.reviews : []
        };

        if(editId) {
            const idx = anuncios.findIndex(x => x.id === editId);
            anuncios[idx] = novoPost;
        } else {
            anuncios.push(novoPost);
        }

        localStorage.setItem('anuncios', JSON.stringify(anuncios));
        renderFeed();
    };
}

function renderDetalhes(id) {
    const a = anuncios.find(x => x.id === id);
    window.scrollTo(0,0);
    app.innerHTML = `
        <div class="container">
            <button class="btn-outline" style="width:auto; margin-bottom:20px; border:none" onclick="renderFeed()">← Voltar</button>
            <div class="auth-card" style="max-width: 100%; border-radius: 32px">
                <div style="padding:clamp(20px, 5vw, 45px)">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; flex-wrap:wrap; gap:25px">
                        <div style="display:flex; gap:20px; align-items:center">
                            <img src="${a.userFoto || 'https://via.placeholder.com/100'}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:3px solid var(--brand-light)">
                            <div>
                                <span class="card-cat" style="position:static; padding:4px 12px">${a.categoria}</span>
                                <h1 style="font-size:clamp(1.5rem, 4vw, 2.2rem); font-weight:800; margin-top:8px; letter-spacing:-1px">${a.titulo}</h1>
                                <p style="color:var(--text-muted); font-weight:600">${a.nomeUser} • <i class="fas fa-map-marker-alt"></i> ${a.bairro}</p>
                            </div>
                        </div>
                        <div style="background:var(--brand-light); padding:20px; border-radius:24px; text-align:center; flex: 1; min-width: 200px">
                             <small style="font-weight:800; color:var(--brand); text-transform:uppercase; font-size:0.7rem">Preço Médio</small>
                             <h2 style="color:var(--brand); font-size:2rem; font-weight:800">R$ ${parseFloat(a.preco).toFixed(2)}</h2>
                             <a href="https://wa.me/55${a.whatsapp.replace(/\D/g,'')}" target="_blank" class="btn-primary" style="display:block; text-decoration:none; margin-top:15px; background:#22c55e"><i class="fab fa-whatsapp"></i> Chamar Agora</a>
                        </div>
                    </div>

                    <h3 style="margin-bottom:20px; font-weight:800">Galeria</h3>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:40px">
                        ${a.fotos && a.fotos.length > 0 ? a.fotos.map(f => `<img src="${f}" style="width:100%; height:250px; object-fit:cover; border-radius:20px">`).join('') : '<p>Sem fotos.</p>'}
                    </div>

                    <h3 style="margin-bottom:15px; font-weight:800">Sobre</h3>
                    <p style="white-space:pre-wrap; color:var(--text-muted); font-size:1.1rem; line-height:1.7;">${a.descricao}</p>
                </div>
            </div>
        </div>`;
}

function excluirAnuncio(id) { if(confirm("Remover serviço?")) { anuncios = anuncios.filter(a => a.id !== id); localStorage.setItem('anuncios', JSON.stringify(anuncios)); renderMeusAnuncios(); } }
function logout() { localStorage.removeItem('sessao'); location.reload(); }

function toggleAuth(m) {
    document.getElementById('form-login').classList.toggle('hidden', m === 'cadastro');
    document.getElementById('form-cadastro').classList.toggle('hidden', m === 'login');
    document.getElementById('btn-tab-login').classList.toggle('active', m === 'login');
    document.getElementById('btn-tab-cadastro').classList.toggle('active', m === 'cadastro');
}

function renderAuth() {
    app.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-card">
                <div class="auth-tabs">
                    <button onclick="toggleAuth('login')" id="btn-tab-login" class="active">Entrar</button>
                    <button onclick="toggleAuth('cadastro')" id="btn-tab-cadastro">Cadastrar</button>
                </div>
                <div class="auth-content">
                    <form id="form-login">
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="l-email" placeholder="E-mail" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="l-senha" placeholder="Senha" required>
                        </div>
                        <button type="submit" class="btn-primary">Acessar Plataforma</button>
                    </form>
                    <form id="form-cadastro" class="hidden">
                        <div class="input-group">
                            <i class="fas fa-user"></i>
                            <input type="text" id="c-nome" placeholder="Nome Completo" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="c-email" placeholder="E-mail" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-phone"></i>
                            <input type="text" id="c-tel" placeholder="WhatsApp" required>
                        </div>
                        <div class="input-group">
                            <label class="premium-file-upload" style="margin-bottom:0">
                                <i class="fas fa-camera"></i> Foto de Perfil
                                <input type="file" id="c-foto" accept="image/*" class="hidden">
                            </label>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-key"></i>
                            <input type="password" id="c-senha" placeholder="Crie uma Senha" required>
                        </div>
                        <button type="submit" class="btn-primary">Criar Conta Premium</button>
                    </form>
                </div>
            </div>
        </div>`;

    document.getElementById('form-login').onsubmit = (e) => {
        e.preventDefault();
        const u = usuarios.find(x => x.email === document.getElementById('l-email').value && x.senha === document.getElementById('l-senha').value);
        if(u) { localStorage.setItem('sessao', JSON.stringify(u)); location.reload(); } else alert("E-mail ou senha incorretos.");
    };
    document.getElementById('form-cadastro').onsubmit = async (e) => {
        e.preventDefault();
        const f = document.getElementById('c-foto').files[0];
        const b = f ? await toB64(f) : "";
        const novoUser = { id: Date.now(), nome: document.getElementById('c-nome').value, email: document.getElementById('c-email').value, whatsapp: document.getElementById('c-tel').value, foto: b, senha: document.getElementById('c-senha').value };
        usuarios.push(novoUser);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        localStorage.setItem('sessao', JSON.stringify(novoUser));
        location.reload();
    };
}

function renderPerfil() {
    app.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-card" style="text-align:center">
                <div class="auth-content">
                    <img src="${sessao.foto || 'https://via.placeholder.com/150'}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border:4px solid var(--brand-light); margin-bottom:20px">
                    <h2 style="font-weight:800">${sessao.nome}</h2>
                    <p style="color:var(--text-muted); margin-bottom:30px">${sessao.email}</p>
                    <button class="btn-primary" onclick="renderFeed()">Explorar Serviços</button>
                    <button class="btn-outline" style="margin-top:10px; border:none" onclick="logout()">Sair da Conta</button>
                </div>
            </div>
        </div>`;
}

init();
