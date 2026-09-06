# Auditoria de Licenciamento de Software & Propriedade Intelectual (2026)

**Ecossistema:** HAXR Signature (`haxrsignatureweb` & `haxrsignature-edition-engine`)  
**Data da Auditoria:** 06 de Setembro de 2026  
**Auditor:** Antigravity — Engenharia de Sistemas & Arquitectura Full-Stack  
**Classificação:** Confidencial / Documento Técnico Interno  
**Língua / Norma Ortográfica:** Português de Moçambique  

---

## 1. Sumário Executivo

Esta auditoria analisa exaustivamente a situação jurídica, contratual e técnica de licenciamento de software para os dois repositórios do ecossistema HAXR Signature:
1. `MrDimande/haxrsignatureweb` (Plataforma Institucional, Marketing Editorial e Painel de Operações);
2. `MrDimande/haxrsignature-edition-engine` (Motor de Experiências Cerimoniais e Convites Privados).

O objectivo é salvaguardar a propriedade intelectual proprietária da marca, definir a separação categórica entre o código de alta-costura e as dependências de código aberto de terceiros, e propor uma matriz documental robusta em conformidade com as leis moçambicanas de comércio electrónico e cibernética.

---

## 2. Inventário Actual dos Repositórios & Ficheiros de Licença

### 2.1. Repositório `haxrsignatureweb`
- **Visibilidade no GitHub:** Repositório Privado (`private: true`).
- **Campo `license` em `package.json`:** Ausente (não especificado).
- **Campo `private` em `package.json`:** `"private": true` (impede publicação acidental no registo público npm).
- **Ficheiro `LICENSE` / `LICENSE.md` na raiz:** Não existe actualmente.
- **Menções de Direitos de Autor no Código:**
  - `src/components/layout/Footer.tsx`: `© {year} HAXR Signature`.
  - `src/lib/brand/authorship.ts`: Menções editoriais de autoria e direcção artística da marca.

### 2.2. Repositório `haxrsignature-edition-engine`
- **Visibilidade no GitHub:** Repositório Privado (`private: true`).
- **Campo `license` em `package.json`:** `"license": "UNLICENSED"`.
- **Campo `private` em `package.json`:** `"private": true`.
- **Ficheiro `LICENSE` na raiz:** Presente, com o seguinte teor canónico:
  ```text
  Copyright (c) 2026 HAXR Signature
  All rights reserved.
  This software and its source code are proprietary and confidential.
  Unauthorized copying, distribution, or use is strictly prohibited.
  ```
- **Auditoria de Activos de Terceiros (`docs/ASSET_LICENSES.md`):** Presente, documentando a autorização de uso de faixas sonoras (`public/audio/famba-kwatsi.mp3`) para o tema cerimonial Primavera Lobolo com menção de autorização directa dos titulares e proibição de redistribuição isolada.

---

## 3. Análise e Classificação de Licenças de Terceiros

Ambos os projectos utilizam dependências externas descarregadas via `npm`. A análise abaixo confirma a compatibilidade jurídica com um modelo de aplicação proprietária fechada:

| Biblioteca / Dependência | Licença Identificada | Tipo de Licença | Compatibilidade Comercial Proprietária | Requisitos Específicos |
| :--- | :--- | :--- | :--- | :--- |
| `next` | MIT | Permissiva | Totalmente Compatível | Preservar aviso de direitos de autor |
| `react` / `react-dom` | MIT | Permissiva | Totalmente Compatível | Preservar aviso de direitos de autor |
| `typescript` | Apache-2.0 | Permissiva | Totalmente Compatível | Preservar avisos e ficheiro de aviso se distribuído |
| `tailwindcss` | MIT | Permissiva | Totalmente Compatível | Preservar aviso |
| `@aws-sdk/client-s3` | Apache-2.0 | Permissiva | Totalmente Compatível | Conformidade com cláusulas de patente e aviso |
| `@aws-sdk/s3-request-presigner` | Apache-2.0 | Permissiva | Totalmente Compatível | Conformidade com cláusulas Apache-2.0 |
| `pg` (node-postgres) | MIT | Permissiva | Totalmente Compatível | Preservar aviso |
| `zod` | MIT | Permissiva | Totalmente Compatível | Preservar aviso |
| `framer-motion` | MIT | Permissiva | Totalmente Compatível | Preservar aviso |
| `jose` | MIT | Permissiva | Totalmente Compatível | Preservar aviso |
| `resend` | MIT | Permissiva | Totalmente Compatível | Preservar aviso |
| `@google/generative-ai`| Apache-2.0 | Permissiva | Totalmente Compatível | Conformidade com termos de uso da API Google Gemini |
| `exceljs` | MIT | Permissiva | Totalmente Compatível | Preservar aviso |
| `@react-pdf/renderer` | MIT | Permissiva | Totalmente Compatível | Preservar aviso |
| `jszip` | MIT | Permissiva | Totalmente Compatível | Preservar aviso |
| `lucide-react` | ISC | Permissiva | Totalmente Compatível | Equivalente funcional à licença MIT |
| `gsap` | GreenSock Standard | Proprietária/Freemium | Compatível com Atenção | Uso gratuito para websites padrão; exige licença comercial paga caso o acesso seja cobrado directamente por subscrição de software |

> [!IMPORTANT]
> **Nota sobre o GSAP (GreenSock):** O GSAP opera sob licença comercial da GreenSock. No modelo actual da HAXR Signature (plataforma institucional onde os clientes pagam por assessoria de eventos física e convites sob medida, e não pelo acesso a um software multi-inquilino de subscrição mensal), o uso standard é permitido. No entanto, se no futuro a HAXR comercializar uma ferramenta SaaS de autosserviço com cobrança directa recorrente de software, deverá ser subscrita a licença *Club GreenSock (Business)*.

> [!NOTE]
> **Ausência de Licenças Virais (Copyleft):** Não foi detectada qualquer dependência sob licenças restritivas do tipo GPL, AGPL ou LGPL com requisitos de abertura forçada de código-fonte. O ecossistema está 100% livre de riscos de contaminação por código aberto.

---

## 4. Recomendações do Modelo de Licenciamento

### 4.1. Licença do Código-Fonte Proprietário da HAXR
**Recomendação Absoluta:** `PROPRIETARY / ALL RIGHTS RESERVED (PROPRIETÁRIO / TODOS OS DIREITOS RESERVADOS)`.

A HAXR Signature não é um projecto de código aberto comunitário. Trata-se de uma infraestrutura proprietária de alta-costura digital desenvolvida para gerar valor comercial exclusivo e proteger a identidade artística e as soluções de engenharia da marca.

**Cláusulas Essenciais:**
1. Proibição estrita de cópia, descompilação, engenharia inversa ou redistribuição pública do código-fonte;
2. Reserva integral de direitos de autor, marcas registadas, direcção estética e segredos comerciais;
3. Não publicação de nomes de titulares pessoas singulares ou colectivas enquanto a entidade jurídica final em Moçambique não for formalmente homologada pela administração. A menção canónica deve permanecer **"HAXR Signature"**.

### 4.2. Matriz de Ficheiros a Adicionar / Normalizar

| Ficheiro Proposto | Repositório Alvo | Estado de Necessidade | Conteúdo Recomendado |
| :--- | :--- | :--- | :--- |
| `LICENSE.md` | `haxrsignatureweb` | **Obrigatório** | Texto formal de propriedade proprietária confidencial idêntico ao de `edition-engine`. |
| `package.json` (`license`) | `haxrsignatureweb` | **Recomendado** | Definir explicitamente `"license": "UNLICENSED"` para prevenir avisos do npm. |
| `THIRD_PARTY_NOTICES.md` | Ambos | **Recomendado (Fase Futura)** | Compilação de licenças permissivas de terceiros (MIT, Apache-2.0, ISC). |
| `SECURITY.md` | Ambos | **Obrigatório (Engenharia)** | Política de divulgação responsável de vulnerabilidades, em alinhamento com a Lei n.º 13/2026. |

---

## 5. Enquadramento Legal Moçambicano de Propriedade Intelectual

O software desenvolvido e operado pela HAXR Signature em Moçambique beneficia da protecção jurídica estabelecida por:
- **Código da Propriedade Industrial (Decreto n.º 47/2015, de 31 de Dezembro):** Protecção de sinais distintivos do comércio, marcas e segredos industriais/comerciais.
- **Lei dos Direitos de Autor e Direitos Conexos (Lei n.º 4/2001, de 27 de Fevereiro):** Protecção das criações intelectuais no domínio literário, artístico e científico, abrangendo expressamente programas de computador (software) como obras protegidas.
- **Lei n.º 3/2017, de 9 de Janeiro (Transacções Electrónicas):** Reconhecimento da validade jurídica de mensagens de dados e documentos electrónicos.
- **Lei n.º 14/2026, de 16 de Janeiro (Crimes Cibernéticos):** Tipificação penal do acesso ilegítimo, cópia não autorizada de dados informáticos e espionagem informática.

---

## 6. Parecer Final e Próximos Passos

1. **Acção Imediata no Código:** Adicionar o campo `"license": "UNLICENSED"` ao `package.json` de `haxrsignatureweb`.
2. **Harmonização de Ficheiros:** Criar o ficheiro `LICENSE.md` em `haxrsignatureweb` estabelecendo formalmente os termos proprietários.
3. **Salvaguarda de Identidade:** Manter a titularidade sob a designação de marca **"HAXR Signature"** sem associar nomes pessoais nos cabeçalhos de ficheiros até parecer final da assessoria jurídica local.
