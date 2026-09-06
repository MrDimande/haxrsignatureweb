# Matriz de Documentação Legal & Enquadramento Regulamentar (2026)

**Ecossistema:** HAXR Signature (`haxrsignatureweb` & `haxrsignature-edition-engine`)  
**Data da Auditoria:** 06 de Setembro de 2026  
**Auditor:** Antigravity — Engenharia de Sistemas & Conformidade Legal  
**Classificação:** Confidencial / Matriz de Engenharia Jurídica  
**Língua / Norma Ortográfica:** Português de Moçambique  

---

## 1. Sumário Executivo

Esta matriz avalia o estado de prontidão, as lacunas e as necessidades regulamentares da documentação jurídica que governa as operações da HAXR Signature. A análise abrange quer o enquadramento doméstico em Moçambique quer as exigências internacionais aplicáveis aos futuros módulos de Casamentos de Destino (*Destination Weddings*) e edições em língua inglesa (`/en/`).

As cláusulas e matérias que carecem obrigatoriamente de parecer e validação por advogado inscrito na Ordem dos Advogados de Moçambique (OAM) estão expressamente assinaladas com a etiqueta:  
`LEGAL_REVIEW_REQUIRED`.

---

## 2. Enquadramento Legal Moçambicano Aplicável

A actividade digital e comercial da HAXR Signature rege-se pelos seguintes diplomas legais vigentes na República de Moçambique:

1. **Lei n.º 3/2017, de 9 de Janeiro (Transacções Electrónicas e Comércio Electrónico):**
   - *Artigo 42.º (Protecção de Dados Pessoais):* Estabelece o princípio da licitude, lealdade e transparência na recolha e tratamento de dados pessoais no comércio electrónico;
   - *Artigo 43.º (Informação Prévia Obrigatória):* Obriga o prestador de serviços por via electrónica a fornecer de forma clara a sua identidade, endereço, NUIT, preços com impostos e termos contratuais;
   - *Artigo 44.º (Comunicações Comerciais Não Solicitadas):* Proíbe o envio de mensagens comerciais sem consentimento prévio e exige mecanismo simples de cancelamento (*opt-out*).
2. **Lei n.º 13/2026, de 16 de Janeiro (Quadro Jurídico da Segurança Cibernética):**
   - Obriga os operadores de serviços digitais e de dados em Moçambique a implementar controlos técnicos adequados de segurança, salvaguarda de integridade e dever de notificação de incidentes graves de violação de segurança.
3. **Lei n.º 14/2026, de 16 de Janeiro (Crimes Cibernéticos):**
   - Tipifica o acesso ilegítimo a sistemas informáticos, a sabotagem informática, a violação de correspondência e telecomunicações e a apropriação indevida de dados pessoais ou comerciais.
4. **Decreto-Lei n.º 1/2022, de 25 de Maio (Código Comercial de Moçambique):**
   - Disciplina a formação dos contratos mercantis, validade jurídica das declarações negociais electrónicas e prazos de preservação da escrituração e documentação comercial e contabilística (10 anos).
5. **Lei n.º 22/2009, de 28 de Setembro (Lei de Defesa do Consumidor):**
   - Protege o consumidor contra cláusulas abusivas, omissão de informação e publicidade enganosa.

---

## 3. Matriz de Documentos Legais: Diagnóstico & Lacunas

| Documento Legal | Estado Actual no Código | Nível de Necessidade | Análise de Lacuna Técnica & Jurídica | Risco Identificado | Acção Recomendada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Política de Privacidade** | Modal preliminar de 3 parágrafos | **Crítica (Obrigatória)** | Não detalha direitos dos titulares, subprocessadores, finalidades nem canais de contacto formal. | Não conformidade com o Artigo 42.º da Lei 3/2017. | Criar página `/privacidade` com texto integral e design de alta-costura. `LEGAL_REVIEW_REQUIRED` |
| **2. Política de Cookies** | Inexistente (integrada na privacidade) | **Alta (Obrigatória)** | Não discrimina o uso de cookies de sessão vs armazenamento local funcional (`localStorage`). | Falta de transparência perante utilizadores exigentes e visitantes internacionais. | Publicar página autónoma ou secção detalhada em `/cookies`. `LEGAL_REVIEW_REQUIRED` |
| **3. Termos de Serviço** | Modal preliminar de 3 parágrafos | **Crítica (Obrigatória)** | Ausência de delimitação de responsabilidade, regras de conduta e definições de serviço. | Exposição a litígios sobre disponibilidade técnica e escopo. | Desenvolver rota `/termos-de-servico`. `LEGAL_REVIEW_REQUIRED` |
| **4. Condições Gerais de Contratação** | Modal preliminar de 8 tópicos | **Crítica (Comercial)** | Não define força maior, regras de intempérie, faltas de energia de locais de terceiros ou prazos formais de pagamento. | Fragilidade jurídica em contratos de alto valor financeiro. | Elaborar documento formal para apoiar proformas e contratos. `LEGAL_REVIEW_REQUIRED` |
| **5. Política de Cancelamento & Reembolsos** | Ausente no website | **Crítica (Comercial)** | Não especifica retenção de sinal (*deposit*), compensação por trabalhos iniciados ou rescisão antecipada. | Disputas financeiras em caso de adiamento ou cancelamento de eventos. | Redigir política clara com percentagens de retenção escalonadas. `LEGAL_REVIEW_REQUIRED` |
| **6. Termos do Directório de Fornecedores** | Inexistente | **Média (Operacional)** | Não esclarece que a HAXR é curadora editorial independente e não responde civilmente por falhas directas de fornecedores terceiros. | Risco de solidariedade passiva atribuída à HAXR por erros de fornecedores. | Integrar termo de isenção no directório `/vendors`. `LEGAL_REVIEW_REQUIRED` |
| **7. Termos da Newsletter (Marketing)** | Texto curto sob formulário | **Média (Comercial)** | Cumpre minimamente mas carece de menção expressa à Lei n.º 3/2017 (Artigo 44.º). | Questionamento de consentimento em comunicações promocionais. | Formalizar texto de consentimento explícito no rodapé. `LEGAL_REVIEW_REQUIRED` |
| **8. Termos de UGC (Plus Memories)** | Inexistente | **Alta (Segurança)** | Não existem termos explícitos aceites pelos convidados ao carregar fotos/vídeos no mural do casamento. | Risco de envio de conteúdos difamatórios, ilegais ou ofensivos por convidados. | Exibir caixa de aceitação de directrizes antes do upload. `LEGAL_REVIEW_REQUIRED` |
| **9. Consentimento de Publicação de Imagem** | Não regulado no site | **Alta (Direitos)** | Casais e convidados podem contestar o uso de fotografias do evento no portfólio público ou Instagram da HAXR. | Violação de direitos de personalidade e privacidade de figuras de alto perfil. | Inserir cláusula de autorização expressa em contratos físicos/digitais. `LEGAL_REVIEW_REQUIRED` |
| **10. Declaração de Inteligência Artificial** | Inexistente | **Média (Transparência)** | Não existe menção pública de que o HAXR Concierge utiliza o modelo Google Gemini para triagem de pedidos. | Omissão de transparência em sistemas automatizados assistivos. | Criar declaração no modal do Concierge esclarecendo o papel assistivo da IA. |
| **11. Política de Retenção & Destruição** | Apenas documentada internamente | **Média (Operacional)** | Não há compromisso público com os prazos de custódia e eliminação de comprovativos e fotos. | Acúmulo desnecessário de passivo de dados no Cloudflare R2 e Neon. | Formalizar na Política de Privacidade os prazos específicos de purga. `LEGAL_REVIEW_REQUIRED` |
| **12. Política de Segurança de Informação** | Documentada em relatórios técnicos | **Alta (Confiança)** | Clientes de alto perfil empresarial e governamental exigem comprovação de resiliência e boas práticas. | Perda de credibilidade comercial em eventos institucionais de prestígio. | Publicar sumário executivo de segurança no atelier. |
| **13. Divulgação Responsável (*Security*)** | Inexistente na raiz | **Alta (Engenharia)** | Inexistência de um canal claro (`security@haxrsignature.com`) para investigadores reportarem falhas com segurança. | Risco de publicação pública de vulnerabilidades sem janela de correcção. | Criar `SECURITY.md` com política de divulgação coordenada. |
| **14. Política de Utilização Aceitável** | Inexistente | **Média (Defensiva)** | Não tipifica proibições como testes de carga não autorizados, ataques de raspagem (*scraping*) ou abuso de APIs. | Ausência de respaldo contratual para bloqueio de IPs maliciosos. | Incluir cláusula anti-abuso nos Termos de Serviço. `LEGAL_REVIEW_REQUIRED` |

---

## 4. Cláusulas Específicas que Exigem Validação por Advogado Moçambicano (`LEGAL_REVIEW_REQUIRED`)

1. **Cláusula de Sinal e Reembolso em Casamentos:**
   - *Objecto:* Definir se o sinal inicial (ex.: 30% a 50%) tem a natureza jurídica de arras confirmatórias ou penitenciais ao abrigo do Código Civil moçambicano, e se é legalmente não-reembolsável em caso de desistência imotivada do casal. `LEGAL_REVIEW_REQUIRED`
2. **Cláusula de Falha de Infraestrutura de Terceiros (Força Maior):**
   - *Objecto:* Delimitação estrita de responsabilidade da assessoria HAXR face a cortes de energia pública (EDM), falhas de gerador do salão contratado, interrupção de abastecimento de água ou intempéries tropicais que impeçam celebrações ao ar livre. `LEGAL_REVIEW_REQUIRED`
3. **Cláusula de Mediação e Foro Competente:**
   - *Objecto:* Fixação da jurisdição da Cidade de Maputo, República de Moçambique, e eventual recurso prévio a arbitragem no Centro de Arbitragem, Conciliação e Mediação (CACM) de Maputo para resolução de litígios comerciais. `LEGAL_REVIEW_REQUIRED`
4. **Cláusula de Direitos de Imagem de Convidados em Galas Privadas:**
   - *Objecto:* Garantia de que a presença de convidados numa celebração privada coberta pelo serviço *Plus Memories* implica o consentimento para visualização interna das fotos pelos anfitriões, respeitando a protecção constitucional de reserva da vida privada. `LEGAL_REVIEW_REQUIRED`

---

## 5. Avaliação para Visitantes Internacionais & União Europeia (*Destination Weddings*)

Com o futuro lançamento da vertente de Casamentos de Destino em Moçambique (com eventos no Arquipélago de Bazaruto, Ponta do Ouro e Maputo) e a publicação de versões em língua inglesa (`/en/`), a HAXR Signature atrairá clientes e convidados residentes na União Europeia e no Reino Unido:

1. **Aplicabilidade Extraterritorial do RGPD (Artigo 3.º, n.º 2):**
   - O Regulamento Geral sobre a Protecção de Dados (UE 2016/679) aplica-se sempre que haja oferta de bens ou serviços a titulares de dados na União Europeia, mesmo por empresas sediadas fora do bloco comunitário.
2. **Direito ao Esquecimento e Portabilidade:**
   - Os noivos e convidados europeus exigirão canais operacionais rápidos para requerer a eliminação integral de dados de contacto e ficheiros multimédia dos servidores Cloudflare R2 e Neon.
3. **Mecanismos de Transferência Internacional de Dados:**
   - Como os subprocessadores da HAXR (Vercel, Neon, Cloudflare, Resend) operam centros de dados distribuídos internacionalmente, será prudente formalizar nos termos de serviço que os dados são processados com garantias adequadas de encriptação em trânsito e em repouso.

---

## 6. Plano de Acção Recomendado (Fase Pré-Implementação)

1. **Minutas em Rascunho:** Redigir as minutas estruturadas de Política de Privacidade, Termos de Serviço e Condições Gerais em estrito Português de Moçambique;
2. **Revisão Jurídica Externa:** Submeter as minutas com a marcação `LEGAL_REVIEW_REQUIRED` a um consultor jurídico moçambicano;
3. **Implementação de Rotas:** Criar as páginas canónicas em Next.js com apresentação editorial imersiva e sem qualquer impacto na velocidade do website;
4. **Actualização do Rodapé:** Substituir os botões de modal simples por hiperligações acessíveis com redireccionamento semântico claro.
