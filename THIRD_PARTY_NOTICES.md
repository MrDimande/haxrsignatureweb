# Avisos de Terceiros e Licenças de Dependências / Third-Party Notices

**Projecto:** HAXR Signature Web Platform (`MrDimande/haxrsignatureweb`)  
**Data:** 06 de Setembro de 2026  
**Língua:** Português de Moçambique & English Reference  

---

## 1. Declaração Geral de Dependências

A plataforma digital HAXR Signature é um software proprietário e confidencial. O projecto incorpora e utiliza diversas bibliotecas e módulos de terceiros descarregados através do gestor de pacotes `npm`.

Cada uma destas dependências mantém a sua respectiva licença concedida pelos seus autores originais. Todas as dependências de produção utilizadas operam sob licenças de código aberto permissivas (MIT, Apache-2.0, ISC, BSD-2-Clause) ou licença de uso padrão (GreenSock Standard License), não existindo qualquer componente sob licenças virais ou recíprocas (tais como GPL, AGPL, LGPL, SSPL ou BUSL).

O risco de contaminação por cópia aberta (*copyleft risk*) é formalmente classificado como:  
`COPYLEFT_RISK=NONE (0%)`.

---

## 2. Dependências de Produção e Respectivas Licenças

A tabela infra reflecte com exactidão as dependências instaladas em `node_modules` e as respectivas licenças declaradas:

| Pacote / Dependência | Versão Instalada | Licença Identificada | Titular / Repositório de Referência |
| :--- | :--- | :--- | :--- |
| `@auth0/nextjs-auth0` | `4.22.0` | MIT | Auth0 Inc. / Okta |
| `@aws-sdk/client-s3` | `3.1125.0` | Apache-2.0 | Amazon Web Services, Inc. |
| `@aws-sdk/s3-request-presigner` | `3.1126.0` | Apache-2.0 | Amazon Web Services, Inc. |
| `@google/generative-ai` | `0.24.1` | Apache-2.0 | Google LLC |
| `@gsap/react` | `2.1.2` | GSAP Standard License | GreenSock, Inc. (https://gsap.com/standard-license) |
| `@hookform/resolvers` | `5.4.0` | MIT | Beier (Bill) Luo / React Hook Form |
| `@neon/config` | `1.3.0` | Apache-2.0 | Neon Inc. |
| `@neon/env` | `1.2.1` | Apache-2.0 | Neon Inc. |
| `@react-pdf/renderer` | `4.5.1` | MIT | Diego Muracciole |
| `@supabase/ssr` | `0.12.0` | MIT | Supabase, Inc. |
| `@supabase/supabase-js` | `2.108.1` | MIT | Supabase, Inc. |
| `@tsparticles/react` | `3.0.0` | MIT | Matteo Bruni |
| `@tsparticles/slim` | `3.9.1` | MIT | Matteo Bruni |
| `exceljs` | `4.4.0` | MIT | Guyon Roche |
| `framer-motion` | `12.40.0` | MIT | Framer B.V. |
| `gsap` | `3.15.0` | GSAP Standard License | GreenSock, Inc. (https://gsap.com/standard-license) |
| `jose` | `6.2.10` | MIT | Filip Skokan |
| `lenis` | `1.3.23` | MIT | Studio Freight / Darkroom Engineering |
| `lucide-react` | `1.18.0` | ISC | Lucide Contributors |
| `mammoth` | `1.12.0` | BSD-2-Clause | Michael Williamson |
| `next` | `15.5.19` | MIT | Vercel, Inc. |
| `pdf-parse` | `2.4.5` | Apache-2.0 | Mehdi Baaboura |
| `pg` | `8.21.0` | MIT | Brian Carlson |
| `qrcode` | `1.5.4` | MIT | Ryan Day |
| `react` | `19.2.7` | MIT | Meta Platforms, Inc. |
| `react-dom` | `19.2.7` | MIT | Meta Platforms, Inc. |
| `react-hook-form` | `7.78.0` | MIT | Beier (Bill) Luo / React Hook Form |
| `resend` | `6.12.4` | MIT | Resend, Inc. |
| `split-type` | `0.3.4` | ISC | Luke Peavey |
| `xlsx` | `0.18.5` | Apache-2.0 | SheetJS LLC |
| `zod` | `3.25.76` | MIT | Colin McDonnell |

---

## 3. Termos Especiais: GSAP (GreenSock)

O pacote `gsap` (versão 3.15.0) e o utilitário `@gsap/react` são distribuídos pela GreenSock, Inc. sob a **GreenSock Standard License ("no charge")**:
- **Conformidade de Uso:** A licença padrão autoriza expressamente o uso sem custos em websites corporativos, portefólios institucionais, sítios de comércio electrónico e aplicações onde os utilizadores finais não pagam uma taxa de subscrição recorrente para aceder e operar a funcionalidade do software propriamente dita;
- **Aplicação na HAXR Signature:** A HAXR Signature presta serviços personalizados de assessoria física de casamentos, produção cerimonial e curadoria de eventos. O sítio web opera como canal de marca e comunicação, enquadrando-se com rigor no âmbito permitido pela licença Standard;
- **Cláusula de Salvaguarda Futura:** Caso a HAXR Signature venha a disponibilizar módulos de autosserviço pagos com cobrança recorrente por subscrição digital para utilização do motor de software, será contratada a licença comercial correspondente (*Club GreenSock Business License*).

---

## 4. Textos de Licenças-Tipo

### Licença MIT (The MIT License)
```text
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Licença Apache 2.0 (Apache License, Version 2.0)
As dependências sob a licença Apache 2.0 (incluindo AWS SDK, Google Generative AI e componentes Neon) são distribuídas sob os termos da Apache License, Version 2.0. O texto integral pode ser consultado em `http://www.apache.org/licenses/LICENSE-2.0`.

### Licença ISC (The ISC License)
```text
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```
