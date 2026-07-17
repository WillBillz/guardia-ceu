# guardia-ceu

Repositório do "Céu" do Guardia: build isolado do [Stellarium Web Engine](https://github.com/Stellarium/stellarium-web-engine)
(planetário em WebGL, compilado de C para WebAssembly via Emscripten) usado como
iframe isolado dentro do produto Guardia.

## O que é (e o que não é)

Este repositório é **obra separada** do produto Guardia (aplicativo web de
emergências em `guardia-web`). Aqui só existem:

- o motor do Stellarium Web Engine como submodule Git (`engine/`, código
  licenciado sob AGPL-3.0 pelo projeto Stellarium);
- um workflow de CI que compila esse motor para `.js` + `.wasm` via Emscripten;
- (a partir da Fase 1) um mini-app HTML/JS standalone que carrega o motor e é
  hospedado separadamente, embutido no Guardia via `<iframe>`.

O Guardia embute o resultado publicado deste repositório via iframe — ele **não**
importa este código diretamente, e este repositório não depende do Guardia.
A separação existe porque o Stellarium Web Engine é licenciado sob AGPL-3.0
(copyleft forte), enquanto o Guardia não é — misturar os dois no mesmo processo
de build exigiria relicenciar o produto Guardia inteiro sob AGPL.

## Estrutura

```
engine/                       submodule -> Stellarium/stellarium-web-engine
.github/workflows/build.yml   compila o engine (Emscripten) no CI
LICENSE                       AGPL-3.0 (texto integral) — cobre o código deste repo
```

## Como buildar

O motor é escrito em C e compilado para WebAssembly com
[Emscripten](https://emscripten.org/) + [SCons](https://scons.org/) (não existe
distribuição via npm). Localmente, com o emsdk já instalado e ativado:

```bash
git submodule update --init --recursive
pip install --break-system-packages scons   # SCons não vem com o emsdk
cd engine
source $PATH_TO_EMSDK/emsdk_env.sh          # se não estiver num container com emsdk já ativo
emscons scons -j8 mode=release
```

Isso gera `engine/build/stellarium-web-engine.js` e
`engine/build/stellarium-web-engine.wasm`.

No CI (GitHub Actions, ver `.github/workflows/build.yml`), o job roda dentro do
container `emscripten/emsdk:3.1.61` (que já tem `emcc`/`emscons` no PATH),
instala o `scons` via pip e roda o mesmo `emscons scons -j8 mode=release`. Os
artefatos são publicados como artifact `engine-dist` de cada run.

## Deploy manual

O mini-app standalone (Fase 1 em diante) é hospedado à parte do Guardia
principal. Deploy manual via Vercel CLI, na mesma conta usada pelo Guardia:

```bash
npx vercel deploy --prod
```

Sem git connect — push para este repositório não deploya sozinho.

## Licença

Todo o código deste repositório (workflow, mini-app e o submodule `engine/`)
está sob **AGPL-3.0** — ver [`LICENSE`](./LICENSE). O AGPL-3.0 é a licença do
próprio Stellarium Web Engine upstream; qualquer uso em rede deste código exige
disponibilizar o código-fonte correspondente aos usuários, conforme os termos
da licença.
