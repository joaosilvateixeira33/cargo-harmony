# Cargo Harmony

Crie uma aplicação web responsiva chamada NexusCargo usando React, TypeScript e Tailwind CSS.

A aplicação deve analisar manifestos de carga usando este webhook do Make.com:

https://hook.us2.make.com/nai21ra5gqs646r6pksijeby7iyj7fuv

UPLOAD

Permita enviar arquivos:

PDF, PNG, JPG, JPEG, XLS e XLSX.

Não adicione campo de e-mail.

Envie usando POST e FormData com:

file

filename

mimetype

uploadDate

Não defina manualmente o Content-Type.

WEBHOOK

Leia a resposta usando response.text() e depois JSON.parse().

O webhook pode retornar:

[

{

"codigo": 1,

"descricao": "Produto",

"quantidade": 400,

"peso": 6000,

"container": "WSCU3355210",

"Status": "OK"


}

]

ou:

{

"success": true,

"message": "Manifesto processado",

"data": []

}

Use o array direto ou response.data.

STATUS

Normalize o status removendo espaços, aspas e diferenças entre maiúsculas e minúsculas.

Considere como correto:

OK

Ok

"Ok"

Conforme

100% conforme

Itens corretos devem ter badge verde.

Divergências devem ter badge vermelho, laranja ou amarelo.

DASHBOARD

Mostrar:

Total de itens

Itens corretos

Divergências

Conformidade %

Quantidade total

Peso total

Contêineres analisados

Calcular a conformidade usando:

itens corretos / total de itens

CASO 100% CONFORME

Quando todos os itens tiverem status OK:

Mostrar um banner verde:

Manifesto 100% conforme

Nenhuma divergência foi identificada.

Ocultar completamente o painel vermelho de divergências.

TABELA

Mostrar:

Código

Descrição

Quantidade

Peso

Contêiner

Status

Adicionar busca e filtros.

DIVERGÊNCIAS

Mostrar apenas itens realmente divergentes.

Usar os campos enviados pelo webhook:

campoDivergente

valorEsperado

valorRecebido

quantidadeEsperada

quantidadeRecebida

pesoEsperado

pesoRecebido

containerEsperado

containerRecebido

Exemplo:

Campo: Quantidade

Esperado: 480

Recebido: 450

Não mostrar “— / —” quando os valores existirem.

INFORMAÇÕES DO MANIFESTO

Mostrar somente campos válidos como:

BL

Cliente

Navio

Porto

Data

Contêineres

Nunca renderizar arrays ou objetos diretamente.

Nunca mostrar:

[object Object]

undefined

null

RELATÓRIO

Adicionar botões:

Analisar outro manifesto

Gerar relatório PDF

Baixar JSON

Exportar CSV

O PDF deve incluir:

Logo NexusCargo

Resumo executivo

KPIs

Conformidade

Informações do manifesto

Tabela completa

Divergências

Valores esperados e recebidos

Data de geração

Rodapé e número das páginas

RELATÓRIO DO WEBHOOK

Criar uma aba com:

URL do webhook

Status HTTP

Tempo de execução

Dados enviados

Resposta completa

JSON formatado

Botão copiar JSON

DESIGN

Interface em português do Brasil.

Não usar dados simulados depois de receber a resposta real do webhook.

faça um fundo interativo de plano de fundo com navios de carga e mar e foque em tons escuros e simplificados e adicione um histórico de analises anteriores. adicionar menu lateral que pode ser expansivo e reducivo e um historico com dados das analises anteriores.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f40149ef-1ef3-4cdd-b763-e71487ea253a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
