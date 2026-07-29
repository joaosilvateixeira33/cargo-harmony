# NexusCargo - IA para Manifestos de Carga 🚢

**Hackathon Wilson Sons | Equipe Katharine Johnson**

O NexusCargo é uma plataforma inteligente desenvolvida para automatizar a conferência de Manifestos de Carga (Bill of Lading). Utilizando Inteligência Artificial e integrações Low-Code, reduzimos o tempo de triagem documental de minutos para poucos segundos, eliminando o erro humano e acelerando a logística portuária.

---

## 🛑 O Problema
A Wilson Sons lida diariamente com milhares de Manifestos de Carga (BL). A conferência manual desses documentos contra o sistema interno (ERP) é um processo repetitivo, lento e altamente suscetível a erros humanos (como fadiga visual). Atrasos na liberação de cargas geram custos logísticos, multas aduaneiras e ineficiência operacional.

## 💡 A Solução
Construímos uma aplicação web amigável onde o operador faz o upload do Bill of Lading. Nosso sistema processa o arquivo em tempo real:
1. **Extração:** A IA (Google Gemini) lê o PDF/Imagem e extrai os itens da carga.
2. **Conciliação:** Os dados extraídos são cruzados linha a linha com o sistema interno (Google Sheets mock).
3. **Validação:** A plataforma exibe um relatório imediato apontando "Matches" (ok), divergências (peso, quantidade) e itens não declarados.

---
## 🔗 Links uteis
* **Site no ar**: (https://nexus-cargo-insight.lovable.app)
* **Make**: (https://us2.make.com/public/shared-scenario/jb7LZeeQoRo/hackthon)
---

## 🛠️ Tecnologias Utilizadas

* **Frontend (Interface):** Lovable / Builder.ai - Criação de uma UI/UX responsiva e focada na experiência do usuário não técnico.
* **Backend & Automação:** Make.com - Orquestração do fluxo de dados (Serverless).
* **Inteligência Artificial:** Google Gemini (1.5 Flash/Pro) - Visão computacional e extração de dados não estruturados para JSON.
* **Banco de Dados (Mock):** Google Sheets - Simulando o ERP interno da Wilson Sons.
* **Armazenamento:** Google Drive - Para processamento temporário dos arquivos de manifesto.

---

## ⚙️ Arquitetura do Sistema (Fluxo Make.com)

A espinha dorsal da nossa aplicação roda em um cenário totalmente automatizado no Make.com, composto por 11 etapas essenciais:

1. **Webhook (Trigger):** Recebe a requisição do frontend (Lovable) contendo o PDF do manifesto.
2. **Google Drive (Upload):** Armazena temporariamente o arquivo recebido em uma pasta.
3. **Google Drive (Share Link):** Gera um link público de leitura para que a IA acesse o documento rapidamente sem download manual.
4. **Google Gemini AI:** Analisa o arquivo utilizando visão computacional e extrai informações (número do BL, itens, contêineres), retornando os dados em formato JSON.
5. **Parse JSON:** Converte o texto retornado pelo Gemini em objetos nativos para o Make manipular.
6. **Iterator:** Percorre individualmente cada item extraído da carga.
7. **Google Sheets (Search):** Consulta a planilha de referência cruzando o número do BL e a descrição do item.
8. **Tools (Variável Status):** Compara as quantidades e pesos do PDF com o Banco de Dados, classificando como "Divergente", "Faltante" ou "OK".
9. **Tools (Variável Resultado):** Organiza a avaliação do item atualizando seu status.
10. **JSON (Aggregator):** Reúne todos os itens iterados e consolida o resultado da conferência em um único array JSON final.
11. **Webhook Response:** Devolve o JSON validado para o frontend (Lovable), que renderiza o dashboard final para o operador portuário.

---

## 🚀 Como testar a aplicação

1. Acesse o link da nossa interface web.
2. Faça o upload de um dos Manifestos (ex: `Manifesto_BL-2026-002.pdf`).
3. Aguarde o processamento (tempo médio: ~5 segundos).
4. Verifique a tela de relatório com o cruzamento automático dos dados!

---
*Feito pela Equipe Katherine Johnson*
