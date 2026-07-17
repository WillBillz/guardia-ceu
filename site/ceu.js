// site/ceu.js — página standalone do céu (Stellarium Web Engine)
//
// Lê ?lat= e ?lng= da query string (default: Brasília) e inicializa o motor
// em tela cheia, com os catálogos/tiles do exemplo padrão do engine
// (engine/apps/simple-html/stellarium-web-engine.html), copiados para
// site/skydata/ pelo workflow de build.
//
// API real (StelWebEngine, core.observer, core.<módulo>.addDataSource, ...)
// confirmada em engine/src/js/pre.js e engine/apps/web-frontend/src/App.vue —
// não é API pública documentada, é a mesma usada pelos dois exemplos do
// próprio repositório do engine.

(function () {
  var q = new URLSearchParams(location.search);
  var latParam = parseFloat(q.get('lat'));
  var lngParam = parseFloat(q.get('lng'));
  var LAT = Number.isFinite(latParam) ? latParam : -15.79; // Brasília
  var LNG = Number.isFinite(lngParam) ? lngParam : -47.88;

  var carregando = document.getElementById('carregando');

  // Emscripten não resolve bem urls relativas para os data sources; como no
  // exemplo do engine (getBaseUrl() em apps/simple-html), montamos uma url
  // absoluta a partir da localização atual da página.
  function getBaseUrl() {
    var url = location.href.split('/');
    url.pop();
    return url.join('/') + '/';
  }

  var skydataUrl = getBaseUrl() + 'skydata/';

  StelWebEngine({
    wasmFile: 'stellarium-web-engine.wasm',
    canvas: document.getElementById('ceu'),

    // Workaround: o artefato atual (compilado com `-s "EXPORTED_FUNCTIONS=[]"`
    // no SConstruct do engine) não expõe Module._free — só Module._malloc, que
    // não usamos aqui. O próprio pre.js do engine (ex.: SweObj._call, usado por
    // core.observer.latitude = ... e por qualquer leitura/escrita de atributo)
    // chama Module._free(cret) depois de ler uma string C, e sem essa função
    // isso lança TypeError e aborta o onReady inteiro antes mesmo dele começar.
    // Um stub no-op evita o crash; o custo é não liberar esses pequenos buffers
    // C (poucas dezenas de bytes por leitura/escrita de atributo) — aceitável
    // para uma página estática de sessão única. Fix definitivo é no build
    // (adicionar _malloc/_free a EXPORTED_FUNCTIONS ou EXPORTED_RUNTIME_METHODS
    // no engine/SConstruct e recompilar) — fora do escopo desta página.
    _free: function () {},

    onReady: function (stel) {
      var core = stel.core;

      core.observer.latitude = LAT * stel.D2R;
      core.observer.longitude = LNG * stel.D2R;
      core.observer.elevation = 0;
      core.time_speed = 1; // relógio corre em tempo real (hora atual)

      // Catálogos/tiles: mesma estrutura e mesmas chaves do exemplo padrão
      // do engine (apps/simple-html/stellarium-web-engine.html).
      core.stars.addDataSource({ url: skydataUrl + 'stars' });
      core.skycultures.addDataSource({ url: skydataUrl + 'skycultures/western', key: 'western' });
      core.dsos.addDataSource({ url: skydataUrl + 'dso' });
      core.landscapes.addDataSource({ url: skydataUrl + 'landscapes/guereins', key: 'guereins' });
      core.milkyway.addDataSource({ url: skydataUrl + 'surveys/milkyway' });
      core.minor_planets.addDataSource({ url: skydataUrl + 'mpcorb.dat', key: 'mpc_asteroids' });
      core.planets.addDataSource({ url: skydataUrl + 'surveys/sso/moon', key: 'moon' });
      core.planets.addDataSource({ url: skydataUrl + 'surveys/sso/sun', key: 'sun' });
      core.planets.addDataSource({ url: skydataUrl + 'surveys/sso/moon', key: 'default' });
      core.comets.addDataSource({ url: skydataUrl + 'CometEls.txt', key: 'mpc_comets' });
      core.satellites.addDataSource({ url: skydataUrl + 'tle_satellite.jsonl.gz', key: 'jsonl/sat' });

      if (carregando) carregando.classList.add('oculto');
    }
  });
})();
