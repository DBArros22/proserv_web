// --- CONFIGURAÇÃO BANCO DE DADOS ---
const SUPABASE_URL = 'https://obqwmcwrpmhwxehadpxp.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_84UPEgjS531OivW4D01bhQ_OybZg54W'; 
const _db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- ESTADO INICIAL ---
let usuarios = [];
let anuncios = [];
let sessao = JSON.parse(localStorage.getItem('sessao')) || null;
let fotosTemporarias = []; 

const app = document.getElementById('app-container');
const categoriasOpcoes = ["Pintor", "Eletricista", "Diarista", "Babá", "Cuidadora", "Pedreiro", "Bombeiro Hidráulico", "Costureira", "Jardineiro", "Montador de Móveis", "Outros"];
const bairrosOpcoes = ["Centro", "Zona Sul", "Zona Norte", "Zona Oeste", "Barra", "Recreio", "Niterói", "São Gonçalo", "Méier", "Tijuca", "Copacabana", "Madureira", "Campo Grande", "Outros"];

// --- FUNÇÕES AUXILIARES ---
async function sincronizarBanco(forcar = false) {
    try {
        const [a, u] = await Promise.all([
            _db.from('anuncios').select('*').order('dataAtualizacao', { ascending: false }),
            _db.from('usuarios').select('*')
        ]);
        anuncios = a.data || [];
        usuarios = u.data || [];
    } catch (e) { console.error("Erro sincronização:", e); }
}

const toB64 = file => new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            res(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

function mascaraMoeda(valor) {
    let v = valor.replace(/\D/g, "");
    if (!v) return "R$ 0,00";
    v = (v / 100).toFixed(2).replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return "R$ " + v;
}

// --- INICIALIZAÇÃO ---
async function init() {
    renderHeader();
    await sincronizarBanco();
    if (!sessao) renderAuth();
    else renderFeed();
}

// --- NAVEGAÇÃO ---
function renderHeader() {
    const header = document.getElementById('main-header');
    if (!header) return;
    if (!sessao) {
        header.innerHTML = `<div class="nav-container"><a class="logo" onclick="location.reload()">Pro<span>Serv</span></a></div>`;
        return;
    }
    header.innerHTML = `
        <div class="nav-container">
            <a onclick="renderFeed()" class="logo" style="cursor:pointer">Pro<span>Serv</span></a>
            <div class="profile-wrapper">
                <span style="font-weight:700">${sessao.nome.split(' ')[0]}</span>
                <img src="${sessao.foto || 'https://via.placeholder.com/100'}">
                <div class="dropdown-menu">
                    <a onclick="renderPerfil()"><i class="fas fa-user-circle"></i> Meu Perfil</a>
                    <a onclick="renderMeusAnuncios()"><i class="fas fa-briefcase"></i> Meus Serviços</a>
                    <a onclick="logout()" style="color:var(--danger)"><i class="fas fa-power-off"></i> Sair</a>
                </div>
            </div>
        </div>`;
}

async function renderFeed() {
    await sincronizarBanco();
    app.innerHTML = `
        <div class="container">
            <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 10px; margin-bottom: 30px;">
                <div class="input-group" style="margin-bottom:0"><i class="fas fa-search"></i><input type="text" id="search-txt" placeholder="O que busca?" oninput="buscar()"></div>
                <div class="input-group" style="margin-bottom:0"><select id="search-cat" onchange="buscar()"><option value="">Categorias</option>${categoriasOpcoes.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                <div class="input-group" style="margin-bottom:0"><select id="search-bai" onchange="buscar()"><option value="">Bairros</option>${bairrosOpcoes.map(b => `<option value="${b}">${b}</option>`).join('')}</select></div>
            </div>
            <div id="services-grid" class="services-grid"></div>
        </div>`;
    buscar();
}

function buscar() {
    const txt = document.getElementById('search-txt')?.value.toLowerCase() || "";
    const cat = document.getElementById('search-cat')?.value || "";
    const bai = document.getElementById('search-bai')?.value || "";
    const filtrados = anuncios.filter(a => 
        (a.titulo || "").toLowerCase().includes(txt) && 
        (cat === "" || a.categoria === cat) && 
        (bai === "" || a.bairro === bai)
    );
    renderCards(filtrados, 'feed');
}

function renderCards(lista, modo) {
    const grid = document.getElementById('services-grid');
    if (!grid) return;
    if (lista.length === 0) { grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted)">Nenhum serviço encontrado.</p>`; return; }

    grid.innerHTML = lista.map(a => `
        <div class="service-card">
            <div onclick="${modo === 'feed' ? `renderDetalhes('${a.id}')` : ''}" style="cursor:pointer">
                <div class="card-gallery">
                    <img src="${(a.fotos && a.fotos[0]) || 'https://via.placeholder.com/400x300'}">
                    <img src="${(a.fotos && a.fotos[1]) || (a.fotos && a.fotos[0]) || 'https://via.placeholder.com/400x300'}">
                    <img src="${(a.fotos && a.fotos[2]) || (a.fotos && a.fotos[0]) || 'https://via.placeholder.com/400x300'}">
                </div>
                <div style="padding:15px">
                    <small style="color:var(--brand); font-weight:800; text-transform:uppercase">${a.categoria}</small>
                    <h3 style="margin:5px 0; font-size:1.1rem">${a.titulo}</h3>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px">
                        <span style="font-weight:800; color:var(--brand)">${a.preco}</span>
                        <span style="font-size:0.8rem; color:var(--text-muted)"><i class="fas fa-map-marker-alt"></i> ${a.bairro}</span>
                    </div>
                </div>
            </div>
            ${modo === 'gerenciar' ? `<div style="padding:0 15px 15px; display:flex; gap:8px"><button class="btn-outline" style="flex:1; padding:8px" onclick="renderCriarAnuncio('${a.id}')">Editar</button><button class="btn-outline" style="flex:1; padding:8px; color:var(--danger)" onclick="excluirAnuncio('${a.id}')">Excluir</button></div>` : ''}
        </div>`).join('');
}

function renderMeusAnuncios() {
    const meus = anuncios.filter(a => a.userId == sessao.id);
    app.innerHTML = `<div class="container">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px">
            <h1>Meus Serviços</h1>
            <button class="btn-primary" onclick="renderCriarAnuncio()" style="width:auto; padding:10px 20px">+ Novo</button>
        </div>
        <div id="services-grid" class="services-grid"></div>
    </div>`;
    renderCards(meus, 'gerenciar');
}

function renderCriarAnuncio(editId = null) {
    const editA = editId ? anuncios.find(x => x.id == editId) : null;
    fotosTemporarias = editA ? [...(editA.fotos || [])] : []; 

    app.innerHTML = `
        <div class="container" style="max-width:500px">
            <div class="auth-card">
                <div class="auth-content">
                    <h2 style="margin-bottom:20px; text-align:center">${editId ? 'Editar Anúncio' : 'Novo Anúncio'}</h2>
                    <form id="f-anuncio">
                        <div class="input-group"><i class="fas fa-heading"></i><input type="text" id="a-tit" placeholder="Ex: Pintor Residencial" value="${editA?.titulo || ''}" required></div>
                        <div class="input-group"><i class="fas fa-tag"></i><select id="a-cat" required>${categoriasOpcoes.map(c => `<option value="${c}" ${editA?.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
                        <div class="input-group"><i class="fas fa-map-marker-alt"></i><select id="a-bai" required>${bairrosOpcoes.map(b => `<option value="${b}" ${editA?.bairro === b ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
                        <div class="input-group"><i class="fas fa-dollar-sign"></i><input type="text" id="a-pre" placeholder="Preço médio" value="${editA?.preco || 'R$ 0,00'}" required></div>
                        <div class="input-group"><i class="fab fa-instagram"></i><input type="url" id="a-insta" placeholder="Link Instagram (Opcional)" value="${editA?.linkSocial || ''}"></div>
                        <div class="input-group"><i class="fas fa-align-left"></i><textarea id="a-des" placeholder="Descreva seu serviço..." rows="3" style="padding-top:12px">${editA?.descricao || ''}</textarea></div>

                        <label class="premium-file-upload" for="a-fotos" id="label-fotos" style="border: 2px dashed #ddd; padding: 15px; display: flex; flex-direction: column; align-items:center; cursor:pointer; border-radius: 12px; margin-bottom: 15px;">
                            <i class="fas fa-camera" style="font-size: 1.5rem; margin-bottom: 5px"></i>
                            <span id="foto-status">${fotosTemporarias.length > 0 ? fotosTemporarias.length + ' de 4 fotos anexadas' : 'Anexar fotos (Máx 4)'}</span>
                        </label>
                        <input type="file" id="a-fotos" accept="image/*" class="hidden" multiple>

                        <button type="submit" class="btn-primary" id="btn-postar">Salvar Anúncio</button>
                        <button type="button" class="btn-outline" style="width:100%; margin-top:10px" onclick="renderMeusAnuncios()">Cancelar</button>
                    </form>
                </div>
            </div>
        </div>`;

    document.getElementById('a-pre').oninput = (e) => { e.target.value = mascaraMoeda(e.target.value); };

    document.getElementById('a-fotos').onchange = async (e) => {
        const files = Array.from(e.target.files);
        const status = document.getElementById('foto-status');
        status.innerText = "Carregando...";
        for(let f of files) { if(fotosTemporarias.length < 4) fotosTemporarias.push(await toB64(f)); }
        status.innerText = `${fotosTemporarias.length} de 4 fotos anexadas`;
    };

    document.getElementById('f-anuncio').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-postar');
        btn.innerText = "Salvando...";
        btn.disabled = true;

        const novoDados = {
            id: editId || Date.now().toString(),
            userId: sessao.id,
            titulo: document.getElementById('a-tit').value,
            categoria: document.getElementById('a-cat').value,
            bairro: document.getElementById('a-bai').value,
            preco: document.getElementById('a-pre').value,
            linkSocial: document.getElementById('a-insta').value,
            descricao: document.getElementById('a-des').value,
            whatsapp: sessao.whatsapp,
            fotos: fotosTemporarias,
            dataAtualizacao: Date.now()
        };

        const { error } = await _db.from('anuncios').upsert([novoDados]);

        if (error) {
            console.error("Erro ao salvar:", error);
            // Se o erro for coluna linkSocial não existe, tenta salvar sem ela
            delete novoDados.linkSocial;
            await _db.from('anuncios').upsert([novoDados]);
        }

        await sincronizarBanco();
        renderMeusAnuncios();
    };
}

function renderDetalhes(id) {
    const a = anuncios.find(x => x.id == id);
    if (!a) return renderFeed();
    const dono = usuarios.find(u => u.id == a.userId) || { nome: "Profissional" };
    app.innerHTML = `
        <div class="container" style="max-width:700px">
            <button class="btn-outline" onclick="renderFeed()" style="margin-bottom:15px">← Voltar</button>
            <div class="auth-card">
                <div style="padding:25px">
                    <div style="display:flex; gap:15px; align-items:center; margin-bottom:20px">
                        <img src="${dono.foto || 'https://via.placeholder.com/100'}" style="width:60px; height:60px; border-radius:50%; object-fit:cover">
                        <div><h2 style="font-size:1.3rem">${a.titulo}</h2><p style="color:var(--text-muted)">${dono.nome} • ${a.bairro}</p></div>
                    </div>
                    <img src="${(a.fotos && a.fotos[0]) || 'https://via.placeholder.com/800x500'}" style="width:100%; border-radius:15px; margin-bottom:20px">
                    <div style="display:flex; gap:10px; margin-bottom:20px">
                        <a href="https://wa.me/55${a.whatsapp}" target="_blank" class="btn-primary" style="flex:2; background:#25d366; display:flex; align-items:center; justify-content:center; gap:8px"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                        ${a.linkSocial ? `<a href="${a.linkSocial}" target="_blank" class="btn-outline" style="flex:1; color:#e1306c; border-color:#e1306c; display:flex; align-items:center; justify-content:center; gap:8px"><i class="fab fa-instagram"></i> Insta</a>` : ''}
                    </div>
                    <p style="white-space: pre-wrap; line-height:1.6">${a.descricao || 'Sem descrição.'}</p>
                </div>
            </div>
        </div>`;
}

// --- PERFIL E AUTH ---
function renderPerfil() {
    app.innerHTML = `<div class="container" style="max-width:400px"><div class="auth-card"><div class="auth-content" style="text-align:center">
        <h2>Perfil</h2>
        <img src="${sessao.foto || 'https://via.placeholder.com/100'}" style="width:90px; height:90px; border-radius:50%; object-fit:cover; margin:15px 0">
        <div class="input-group"><i class="fas fa-user"></i><input type="text" id="p-nome" value="${sessao.nome}"></div>
        <button onclick="salvarPerfil()" class="btn-primary">Salvar</button>
        <button onclick="renderFeed()" class="btn-outline" style="width:100%; margin-top:10px">Voltar</button>
    </div></div></div>`;
}

async function salvarPerfil() {
    const n = document.getElementById('p-nome').value;
    await _db.from('usuarios').update({ nome: n }).eq('id', sessao.id);
    sessao.nome = n; localStorage.setItem('sessao', JSON.stringify(sessao));
    location.reload();
}

async function excluirAnuncio(id) {
    if(confirm("Excluir?")) {
        await _db.from('anuncios').delete().eq('id', id);
        await sincronizarBanco();
        renderMeusAnuncios();
    }
}

function renderAuth() {
    app.innerHTML = `<div class="auth-wrapper"><div class="auth-card">
        <div style="display:flex; border-bottom:1px solid #eee">
            <button onclick="toggleTab('l')" id="t-l" style="flex:1; padding:15px; border:none; background:none; font-weight:800; color:var(--brand); cursor:pointer">Entrar</button>
            <button onclick="toggleTab('c')" id="t-c" style="flex:1; padding:15px; border:none; background:none; font-weight:800; color:var(--text-muted); cursor:pointer">Cadastrar</button>
        </div>
        <div class="auth-content">
            <form id="f-login">
                <div class="input-group"><i class="fas fa-envelope"></i><input type="email" id="l-email" placeholder="E-mail" required></div>
                <div class="input-group"><i class="fas fa-lock"></i><input type="password" id="l-pass" placeholder="Senha" required></div>
                <button type="submit" class="btn-primary">Acessar</button>
            </form>
            <form id="f-cad" class="hidden">
                <div style="text-align:center; margin-bottom:10px"><img id="c-prev" src="https://via.placeholder.com/100" style="width:70px; height:70px; border-radius:50%; object-fit:cover"><input type="file" id="c-foto" class="hidden" accept="image/*"><label for="c-foto" style="display:block; color:var(--brand); cursor:pointer; font-size:0.8rem">Foto Perfil</label></div>
                <div class="input-group"><i class="fas fa-user"></i><input type="text" id="c-nome" placeholder="Nome" required></div>
                <div class="input-group"><i class="fas fa-envelope"></i><input type="email" id="c-email" placeholder="E-mail" required></div>
                <div class="input-group"><i class="fab fa-whatsapp"></i><input type="text" id="c-tel" placeholder="WhatsApp" required></div>
                <div class="input-group"><i class="fas fa-lock"></i><input type="password" id="c-pass" placeholder="Senha" required></div>
                <button type="submit" class="btn-primary">Cadastrar</button>
            </form>
        </div>
    </div></div>`;
    document.getElementById('c-foto').onchange = async (e) => { if(e.target.files[0]) document.getElementById('c-prev').src = await toB64(e.target.files[0]); };
    document.getElementById('f-login').onsubmit = async (e) => {
        e.preventDefault();
        const { data: u } = await _db.from('usuarios').select('*').eq('email', document.getElementById('l-email').value).eq('senha', document.getElementById('l-pass').value).single();
        if(u) { localStorage.setItem('sessao', JSON.stringify(u)); location.reload(); } else alert("Erro!");
    };
    document.getElementById('f-cad').onsubmit = async (e) => {
        e.preventDefault();
        const nU = { id: Date.now().toString(), nome: document.getElementById('c-nome').value, email: document.getElementById('c-email').value, whatsapp: document.getElementById('c-tel').value, senha: document.getElementById('c-pass').value, foto: document.getElementById('c-prev').src.includes('placeholder') ? "" : document.getElementById('c-prev').src };
        await _db.from('usuarios').insert([nU]);
        localStorage.setItem('sessao', JSON.stringify(nU)); location.reload();
    };
}

function toggleTab(t) {
    document.getElementById('f-login').classList.toggle('hidden', t === 'c');
    document.getElementById('f-cad').classList.toggle('hidden', t === 'l');
    document.getElementById('t-l').style.color = t === 'l' ? 'var(--brand)' : 'var(--text-muted)';
    document.getElementById('t-c').style.color = t === 'c' ? 'var(--brand)' : 'var(--text-muted)';
}

function logout() { localStorage.removeItem('sessao'); location.reload(); }

init();
