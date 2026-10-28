# MasQbom — Calculadora de Preço de Bolos de Pote

Sistema simples (HTML + CSS + JavaScript, sem back-end) para calcular o custo real de cada sabor de bolo de pote e sugerir um preço de venda com a margem de lucro que você quiser.

Os dados ficam salvos no navegador (localStorage). Use a aba **Meus dados** para exportar um backup em `.json` de vez em quando — assim você não perde nada e pode levar os dados para outro computador ou celular.

## Arquivos
```
index.html   → estrutura da página
style.css    → visual (cores e fontes da marca)
script.js    → toda a lógica de cálculo
logo.jpeg    → sua logo
README.md    → este guia
```

## Como usar
1. Aba **Ingredientes**: cadastre cada ingrediente do jeito que você compra (ex: leite condensado 395g por R$ 6,50). O sistema calcula sozinho o custo por grama/ml/unidade — essa lista é compartilhada pelas três categorias de bolo.
2. Abas **Bolo de Pote**, **Bolo Caseiro** e **Bolo de Aniversário**: cada uma tem seu próprio formulário e sua própria lista de bolos salvos, com os custos extras ajustados para o tipo de produto:
   - **Bolo de Pote**: rendimento em potes; custos extras por pote (pote+tampa+colher, etiqueta, outros).
   - **Bolo Caseiro**: rendimento em fatias/porções; custos extras por fatia (embalagem, cobertura simples, outros).
   - **Bolo de Aniversário**: rendimento em fatias; custos extras lançados como valor **total da encomenda** (recheio extra, decoração/topo de bolo, aluguel de utensílios/entrega), já que normalmente é um pedido único e personalizado.
3. Em qualquer aba: monte a receita escolhendo os ingredientes e as quantidades usadas, informe o rendimento, os custos extras e a margem de lucro desejada. O card ao lado mostra o custo por unidade e o preço sugerido na hora.
4. Clique em **Salvar bolo** para guardar aquele cálculo na lista da categoria.

## Login de acesso
Ao abrir o site aparece uma tela de login (botão **Sair** no topo). A senha não fica escrita no código, só o hash dela (SHA-256) em `script.js`, na constante `AUTH_HASH`.

> Importante: como o site é estático, esse login só esconde a tela e não é segurança de verdade. Quem souber mexer nas ferramentas do navegador consegue contornar. Para proteger de fato na Hostinger, ative também **Pastas protegidas por senha** (Proteger diretório com senha) no hPanel, na pasta onde o site está.

Para trocar usuário ou senha, gere um novo hash do texto `masqbom|usuario-em-minusculas|senha` (SHA-256) e troque o valor de `AUTH_HASH` em `script.js`.

---

## Publicar de graça: GitHub + Hostinger

### Passo 1 — Subir os arquivos no GitHub
1. Crie uma conta em [github.com](https://github.com) (se ainda não tiver).
2. Clique em **New repository**, dê um nome (ex: `masqbom`) e marque como **Public**. Não marque "Add a README" (você já tem um).
3. Na página do repositório recém-criado, clique em **uploading an existing file**.
4. Arraste os 5 arquivos (`index.html`, `style.css`, `script.js`, `logo.jpeg`, `README.md`) para a área de upload.
5. Clique em **Commit changes**.

Pronto — seus arquivos já estão versionados no GitHub. Sempre que quiser atualizar algo, edite o arquivo pelo próprio GitHub (ícone de lápis) ou repita o upload.

### Passo 2 — Baixar os arquivos do GitHub para o computador (para enviar à Hostinger)
1. No repositório, clique no botão verde **Code** → **Download ZIP**.
2. Extraia o ZIP no seu computador — você terá a pasta com os 5 arquivos.

### Passo 3 — Publicar na Hostinger
1. Entre no **hPanel** da Hostinger.
2. Vá em **Arquivos → Gerenciador de Arquivos** (File Manager).
3. Abra a pasta `public_html` (é a pasta raiz do seu site/domínio).
4. Clique em **Fazer upload** e envie os arquivos `index.html`, `style.css`, `script.js` e `logo.jpeg` para dentro de `public_html` (não precisa subir o README).
5. Acesse seu domínio no navegador — a calculadora já estará no ar.

> Dica: se quiser deixar a calculadora numa subpasta (ex: `seusite.com/precos`), basta criar essa pasta dentro de `public_html` e subir os arquivos lá dentro.

### Manter tudo sincronizado depois
Sempre que editar algo no GitHub, baixe o ZIP de novo e reenvie os arquivos alterados pelo Gerenciador de Arquivos da Hostinger (ele pergunta se quer substituir — é só confirmar).

---

Feito com amor 🤍 — MasQbom Delícias Caseiras · (35) 99745-5394
