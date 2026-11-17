# Lofy's · Crochê Manager

Aplicativo local para organizar peças, projetos, encomendas e custos de um ateliê de crochê. A demonstração já inclui seis produtos fotografados, três projetos, uma encomenda e exemplos de materiais, clientes e lançamentos financeiros.

## Como abrir a entrega

1. Extraia o ZIP por completo para qualquer pasta.
2. No Windows, com Node.js instalado, abra **Abrir no Windows.cmd**. O navegador abre em `http://127.0.0.1:8090`.
3. Deixe a janela do servidor aberta enquanto usa o app.

No macOS ou Linux, abra um terminal na pasta extraída, rode `node scripts/demo.mjs` e acesse `http://127.0.0.1:8090`.

A demonstração compilada está em `dist/` e roda sem internet após a extração. Basta usar um dos perfis locais abaixo.

## Perfis de demonstração

| Acesso | Como entrar | O que pode fazer |
| --- | --- | --- |
| Administrador | Clique em **Sou administrador** e digite o PIN **1234**. Número de exemplo **(11) 90000-0001**. | Painel, projetos, encomendas, catálogo, clientes, materiais, preços e financeiro. |
| Cliente | Clique em **Entrar como cliente de exemplo** ou informe **(11) 90000-0002**. | Consultar projetos e registrar encomendas. |

Um novo número com DDD cria automaticamente um perfil de cliente de uso local. O WhatsApp informado é usado como contato do pedido. A demonstração funciona sem enviar código e sem verificar a posse do número. O PIN é público para facilitar a avaliação do projeto. Use **Sair** para trocar de perfil.

## O que testar

- No perfil administrador, **Início** reúne busca, atalhos e peças em destaque. Selecione uma peça para abrir seus detalhes.
- **Projetos** mostra as peças com preço fixo e o botão **Encomendar peça**. Para adicionar uma peça, o administrador informa nome, preço, descrição e se aceita encomendas. Depois de salvar, pode adicionar fotos e materiais.
- **Catálogo** permite buscar e filtrar peças. Em **Gerenciar peças**, é possível editar preços, categorias, fotos e destaques.
- **Encomendar** permite escolher o prazo desejado entre 7 e 14 dias corridos. Gere o QR de demonstração de 50% do total e use **Simular pagamento e confirmar**. O QR não é um pagamento Pix real.
- **Encomendas** mostra a data da confirmação do sinal, o prazo desejado e a data máxima, 14 dias corridos depois do primeiro pagamento. Abra um pedido para ver os itens, o sinal, o saldo e o histórico.
- **Crochetar** abre o cronômetro do administrador. Inicie em um projeto e use **Pausar e registrar tempo** para salvar a sessão. O cronômetro continua ao sair da tela ou fechar o app e calcula a mão de obra pela tarifa fixa de R$ 20 por hora.
- **Meu ateliê** reúne os atalhos de gestão, incluindo clientes, materiais, financeiro e calculadora de preços.

## Banco local

O navegador usa IndexedDB e o app nativo usa SQLite. Na primeira abertura, cada instalação recebe uma cópia independente dos exemplos. Alterações são salvas no próprio dispositivo. No navegador, use o mesmo navegador, perfil e endereço para reencontrar os registros. Limpar os dados do site apaga essa cópia e os exemplos voltam na próxima abertura.

## Rodar como aplicativo Android

Com o ambiente Android Studio instalado e o emulador aberto, execute `npm ci` e depois `npx expo start --go --android --port 8082` na pasta do projeto. No PowerShell, digite `npm.cmd` e `npx.cmd`. A versão nativa usa SQLite e inicia com a mesma base de demonstração.

## Desenvolvimento

Requer Node.js 24 ou superior. A instalação inicial das dependências requer internet.

| Comando | Uso |
| --- | --- |
| `npm ci` | Instalar as dependências |
| `npm run web` | Iniciar o Expo Web em modo de desenvolvimento |
| `npm run android` | Abrir em dispositivo ou emulador Android configurado |
| `npm run build:web` | Atualizar a versão compilada em `dist/` |
| `node scripts/demo.mjs` | Servir a versão compilada no endereço da demonstração |
| `npm run typecheck` | Verificar os tipos |
| `npm run lint` | Verificar o código com ESLint |
| `npm test` | Rodar os testes de perfis, calculadora e dados de exemplo |

No PowerShell, use `npm.cmd` caso a máquina bloqueie o script `npm.ps1`.

A interface e as imagens estão em `src/features/` e `assets/images/`. As rotas estão em `src/app/`. A inicialização do banco local está em `src/local/` e as operações de negócio em `src/services/`.
