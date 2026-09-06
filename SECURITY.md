# Política de Segurança e Divulgação Responsável / Security Policy

A **HAXR Signature** encara a segurança dos dados dos nossos clientes, noivos e convidados como um pilar inegociável da nossa excelência operacional e de alta-costura digital.

Este documento estabelece as directrizes formais para a comunicação coordenada e tratamento responsável de vulnerabilidades de segurança.

---

## 1. Versões Suportadas / Supported Versions

Apenas a versão mais recente em implementação activa no branch `main` de produção beneficia de suporte directo de segurança e correcções imediatas:

| Componente / Repositório | Versão Suportada | Estado de Segurança |
| :--- | :--- | :--- |
| `MrDimande/haxrsignatureweb` | `main` (Produção Activa) | **Suportada** |
| `MrDimande/haxrsignature-edition-engine` | `main` (Produção Activa) | **Suportada** |
| Versões arquivadas / Branches legados | Anteriores a 2026-09-06 | Descontinuadas (Não suportadas) |

---

## 2. Canal de Divulgação Responsável / Reporting a Vulnerability

Se identificou uma potencial falha de segurança, vulnerabilidade ou exposição indevida nos nossos sistemas, solicitamos que nos reporte imediatamente através do nosso canal dedicado e confidencial:

👉 **Email de Segurança:** `security@haxrsignature.com`

### Directrizes de Comunicação:
1. **Confidencialidade Obrigatória:** Não divulgue publicamente a vulnerabilidade, nem a partilhe com terceiros ou redes sociais, até que a equipa técnica da HAXR Signature tenha tido a oportunidade razoável de analisar, reproduzir e implementar a respectiva correcção;
2. **Conteúdo do Relatório:**
   - Descrição objectiva da anomalia identificada;
   - Passos passo-a-passo para reproduzir o comportamento (incluindo prova de conceito ou requisições HTTP exemplificativas, sem extracção de dados reais);
   - Superfície afectada (ex.: endpoints da API, cabeçalhos, formulários);
   - Avaliação estimada do impacto de severidade;
3. **Protecção de Dados e Integridade de Terceiros:**
   - É expressamente proibido tentar aceder, descarregar, modificar ou eliminar dados reais pertencentes a clientes, casais, convidados ou fornecedores;
   - Não execute ataques de negação de serviço (DoS/DDoS), spam, testes de carga destrutivos ou engenharia social contra colaboradores ou parceiros da marca.

---

## 3. Compromisso de Resposta da Equipa Técnica

Ao submeter um relatório válido através do canal oficial:
- **Confirmação de Recepção:** A equipa técnica enviará uma confirmação de recepção no prazo de até **48 horas úteis**;
- **Triagem e Avaliação:** Avaliaremos a severidade da falha e forneceremos uma estimativa para implementação da correcção;
- **Resolução e Transparência:** Manteremos o investigador informado sobre o estado da correcção até à sua entrada segura em produção;
- **Reconhecimento Ético:** A HAXR Signature agradece e reconhece formalmente a contribuição de profissionais de segurança que colaboram de forma ética e responsável para salvaguardar o ecossistema. Não operamos actualmente um programa remunerado de recompensas por bugs (*bug bounty*).

---

## 4. Enquadramento Legal

A actuação da HAXR Signature rege-se pelo quadro jurídico da República de Moçambique, designadamente:
- **Lei n.º 13/2026, de 16 de Janeiro** (Quadro Jurídico da Segurança Cibernética);
- **Lei n.º 14/2026, de 16 de Janeiro** (Prevenção e Combate aos Crimes Cibernéticos);
- **Lei n.º 3/2017, de 9 de Janeiro** (Transacções Electrónicas).
