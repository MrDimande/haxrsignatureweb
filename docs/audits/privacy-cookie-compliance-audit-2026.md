# Auditoria de Privacidade, Cookies & Mapeamento de Dados (2026)

**Ecossistema:** HAXR Signature (`haxrsignatureweb` & `haxrsignature-edition-engine`)  
**Data da Auditoria:** 06 de Setembro de 2026  
**Auditor:** Antigravity — Engenharia de Sistemas & Privacidade de Dados  
**Classificação:** Confidencial / Documento Técnico e Regulamentar  
**Língua / Norma Ortográfica:** Português de Moçambique  

---

## 1. Sumário Executivo

Esta auditoria apresenta a análise aprofundada do código-fonte e do comportamento em tempo de execução dos ecossistemas digitais da HAXR Signature no que concerne à privacidade de dados, utilização de cookies e mecanismos de armazenamento local no navegador.

### Principais Conclusões:
1. **Inexistência de Rastreadores de Terceiros:** Não existem pixels do Facebook/Meta, Google Analytics (GA4), Google Tag Manager (GTM) ou ferramentas invasivas de gravação de ecrã (Hotjar/Clarity) no código em produção.
2. **Cookies Estritamente Necessários:** Os únicos cookies gerados são de primeira parte (*first-party*), destinados exclusivamente à autenticação de sessões administrativas e do portal do cliente.
3. **Armazenamento Local Funcional (*Local-First*):** O `localStorage` é utilizado com parcimónia para conveniência funcional do utilizador (favoritos de fornecedores, respostas do Style Quiz, checklist e progresso cerimonial).
4. **Estado dos Termos Legais no Rodapé:** As opções "Condições Gerais", "Termos de Serviço" e "Política de Privacidade" existem actualmente apenas como um modal reactivo de texto curto no cliente (`Footer.tsx`), sem rotas canónicas autónomas indexáveis (`/privacidade`, etc.), configurando conteúdos preliminares que carecem de robustez jurídica formal.
5. **Mecanismo de Consentimento:** A plataforma não dispõe actualmente de um gestor de consentimento de cookies (*Cookie Banner* / *Preferences Centre*), o qual foi desenhado conceptualmente nesta auditoria para implementação futura em alinhamento com a norma WCAG 2.2 AA.

---

## 2. Auditoria do Rodapé & Rotas Legais Actuais

O rodapé do website institucional (`src/components/layout/Footer.tsx`) apresenta três hiperligações interactivas que disparam um diálogo em modal animado via Framer Motion:

| Elemento no Rodapé | Tipo de Implementação | Rota Dedicada | Conteúdo Actual | Avaliação de Suficiência |
| :--- | :--- | :--- | :--- | :--- |
| **Condições Gerais** | Modal de cliente (`Footer.tsx`) | Inexistente (apenas modal) | 8 itens breves oriundos de `site-config.ts` | **INSUFICIENTE / PRELIMINAR**: Falta detalhe sobre força maior, prazos de pagamento, cancelamentos e foro de resolução de litígios. |
| **Termos de Serviço** | Modal de cliente (`Footer.tsx`) | Inexistente (apenas modal) | 3 parágrafos genéricos | **INSUFICIENTE / PRELIMINAR**: Não delimita responsabilidade civil comercial, propriedade intelectual detalhada ou regras de utilização aceitável. |
| **Política de Privacidade** | Modal de cliente (`Footer.tsx`) | Inexistente (apenas modal) | 3 parágrafos resumidos | **INSUFICIENTE / PRELIMINAR**: Não menciona direitos dos titulares (acesso, rectificação, eliminação), prazos de retenção nem as Leis n.º 3/2017 e 13/2026 de Moçambique. |

### Deficiências Técnicas e de SEO:
- Ausência de páginas dedicadas indexáveis pelos motores de busca (como `/privacidade`, `/termos-de-servico`, `/condicoes-gerais`), o que penaliza a autoridade institucional e os requisitos de confiança de plataformas de pagamento e auditorias de conformidade internacional;
- O texto presente em `site-config.ts` possui gralhas residuais (ex.: "podem tel custo extra" em vez de "podem ter custo extra");
- Os utilizadores que acedem via motor de convites (`edition.haxrsignature.com`) não têm visualização directa das políticas do atelier.

---

## 3. Inventário Exaustivo de Cookies & Armazenamento Local

### 3.1. Cookies do Servidor e Navegador

| Nome do Cookie | Fornecedor | Finalidade | Âmbito (Path/Domain) | Tempo de Vida | Seguro (Secure) | HttpOnly | SameSite | Origem (Client/Server) | Classificação | Avaliação de Consentimento |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `haxr_admin_session` | HAXR (1ª Parte) | Sessão encriptada (HMAC-SHA256) do painel operacional `/admin` | `/admin`, `/api/admin` | 7 dias | **Sim** | **Sim** | `Lax` | Server | **STRICTLY_NECESSARY** | Isento de consentimento prévio (estritamente necessário para autenticação interna solicitada pelo operador). |
| `neon-auth.session_token` (ou proxy) | Neon Auth / HAXR | Sessão segura do portal do cliente `/app` para noivos | `/` | 30 dias | **Sim** | **Sim** | `Lax` | Server | **STRICTLY_NECESSARY** | Isento de consentimento prévio (sessão expressamente iniciada pelo utilizador titular da conta). |

### 3.2. Armazenamento Local do Navegador (`localStorage`) — Plataforma Web

| Chave de Armazenamento | Finalidade Funcional | Dados Armazenados | Tempo de Vida | Partilha Externa | Classificação | Avaliação de Consentimento |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| `haxr-favorites` | Preservar a lista de fornecedores e convites guardados pelo visitante | Array de IDs de fornecedores/artigos | Persistente até limpeza | Nenhuma | **FUNCTIONAL** | Funcionalidade local; não requer consentimento formal prévio se estritamente local, mas recomendada opção de gestão. |
| `haxr_style_quiz_result` | Guardar o arquétipo estético resultante do quiz para filtrar fornecedores | Objecto JSON com estilo estético e pontuação | Persistente até limpeza | Nenhuma | **FUNCTIONAL** | Puramente funcional; permite recomendar fornecedores no directório sem recolha de dados no servidor. |
| `haxr_checklist_v2` | Guardar o estado das tarefas concluídas na ferramenta de checklist | IDs de tarefas marcadas pelo utilizador | Persistente até limpeza | Nenhuma | **FUNCTIONAL** | Utilidade e conveniência do casal no planeamento pessoal. |
| `haxr_budget_expenses` | Guardar cálculos locais da calculadora de catering e bebidas | Valores numéricos estimados e itens de custo | Persistente até limpeza | Nenhuma | **FUNCTIONAL** | Ferramenta de cálculo autónoma no cliente. |
| `haxr_onboarding_*` | Guardar rascunho de respostas de integração antes do envio | Data do evento, perfil (ex: noiva) | Sessão / Persistente | Sincronizado se registar | **FUNCTIONAL** | Facilita a experiência sem perda de contexto antes da criação de conta. |
| `haxr_admin_avatar` / `haxr_admin_notifications_read` | Preferências de interface e notificações lidas pelo administrador | URL de avatar e IDs de notificações | Persistente | Nenhuma | **STRICTLY_NECESSARY** | Interface administrativa restrita. |

### 3.3. Armazenamento Local do Navegador (`localStorage`) — Motor Edition

| Chave de Armazenamento | Finalidade Funcional | Dados Armazenados | Classificação |
| :--- | :--- | :--- | :--- |
| `edition_rsvp_confirmed_{slug}` | Memorizar que o convidado já confirmou presença no dispositivo | Estado de confirmação e resumo de acompanhantes | **FUNCTIONAL** |
| `haxr_gift_{slug}_{giftId}` | Memorizar presente reservado pelo convidado | Identificador do item reservado | **FUNCTIONAL** |
| `haxr_audio_{slug}` | Memorizar preferência de áudio cerimonial (mudo/activo) | `"on"` ou `"off"` | **FUNCTIONAL** |
| `haxr_plus_memories_participant_{slug}` | Identificador efémero do convidado para desafios de memórias | UUID anónimo de participante e nome opcional | **FUNCTIONAL** |
| `haxr_plus_memories_challenges_{slug}` | Registo dos desafios fotográficos completados no evento | Lista de IDs de desafios do mural | **FUNCTIONAL** |

---

## 4. Auditoria de Serviços e Integrações de Terceiros

| Fornecedor / Serviço | Finalidade Técnica | Local de Execução | Há Envio de Cookies pelo Navegador? | Há Telemetria Invasiva? | Parecer de Conformidade |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Vercel** | Alojamento e execução Edge/Serverless | Infraestrutura em Nuvem | **Não** | Não | Total conformidade. Nenhum cookie de utilizador é injectado pela Vercel nas respostas públicas. |
| **Google Fonts** (`next/font/google`) | Tipografia editorial (Fraunces, Source Sans, Cormorant, Inter) | Compilado e servido localmente no build | **Não** | Não | Impecável. As fontes são descarregadas no momento de compilação e servidas pela mesma origem (`self-hosted`), sem qualquer contacto do navegador com servidores Google. |
| **Neon Serverless PostgreSQL** | Base de dados transaccional principal | Servidor backend seguro | **Não** | Não | Acesso restrito por conexão TLS encriptada. O navegador nunca contacta a base de dados directamente. |
| **Cloudflare R2** | Armazenamento privado de ficheiros e memórias | Bucket S3 privado com URLs assinadas | **Não** | Não | Ficheiros binários transferidos via links pré-assinados com expiração efémera (600s / 15m), sem cookies de rastreio. |
| **Resend** | Envio de emails transaccionais e notificações | Chamadas de API Server-to-Server | **Não** | Não | Os dados de email são submetidos via servidor sem bibliotecas de rastreio de terceiros no cliente. |
| **Google Gemini API** | Triagem assistida de pedidos no HAXR Concierge | Chamadas de API Server-to-Server | **Não** | Não | As solicitações dos noivos são processadas no backend sem telemetria directa no navegador do utilizador. |
| **Brevo / Twilio** | CRM comercial e envio de mensagens WhatsApp | Chamadas de API Server-to-Server | **Não** | Não | Operações executadas em bastidores sob comando administrativo. |
| **Hiperligações Sociais** | Ícones de Instagram, WhatsApp e Email no rodapé | Elementos HTML `<a>` com SVG puro | **Não** | Não | Totalmente limpo. Não existem SDKs ou widgets de terceiros (como Facebook SDK ou botões de partilha activos que injectam cookies). |

---

## 5. Arquitectura do Sistema de Gestão de Consentimento (Design Conceitual)

Embora a HAXR Signature actualmente utilize apenas cookies estritamente necessários e armazenamento local funcional, a expansão futura para campanhas editoriais, casamentos de destino (*Destination Weddings*) com público europeu e ferramentas avançadas de mensuração exige uma infraestrutura de consentimento robusta e elegante.

### 5.1. Requisitos de Experiência do Utilizador (UX) de Alta-Costura Digital
1. **Estética Refinada:** O diálogo de privacidade deve integrar-se organicamente na estética de luxo HAXR Signature (fundo preto noir com desfoque de vidro fosco, rebordo dourado champagne fino, tipografia Serif nobre e botões de toque subtil).
2. **Acessibilidade WCAG 2.2 AA:** Contraste mínimo de texto 4.5:1, foco visível no teclado, suporte a leitores de ecrã com atributos ARIA e preservação de acessibilidade motora.
3. **Ausência Rigorosa de Padrões Escuros (*Dark Patterns*):**
   - É expressamente proibido destacar o botão de aceitação em detrimento do botão de rejeição;
   - Todas as opções devem apresentar peso tipográfico equilibrado;
   - Rejeitar cookies não-essenciais deve ser tão rápido e simples quanto aceitá-los (um único clique).

### 5.2. Opções Conceptuais Obrigatórias
O diálogo deve oferecer três acções com igual dignidade visual:
1. **ACEITAR TODOS:** Autoriza cookies essenciais, funcionais e futuras ferramentas de estatística editorial;
2. **APENAS ESSENCIAIS:** Limita o funcionamento aos cookies e parâmetros estritamente indispensáveis à segurança e sessão;
3. **PERSONALIZAR:** Abre o painel granular de preferências para selecção individual de categorias.

### 5.3. Reabertura de Preferências
O rodapé permanente do website deve conter a hiperligação textual:
`PREFERÊNCIAS DE PRIVACIDADE`  
Ao clicar, o utilizador pode a qualquer momento rever ou revogar o consentimento previamente concedido, cumprindo o princípio da facilidade de revogação.

### 5.4. Disciplina Técnica *Fail-Closed*
Nenhum script de analítica ou marketing (caso venha a ser ponderado no futuro) poderá ser carregado ou executado antes de o utilizador manifestar o seu consentimento activo e inequívoco (`opt-in`). Na ausência de resposta, o estado padrão é **bloqueado**.

---

## 6. Mapa Detalhado de Dados & Privacidade (Data & Privacy Map)

O quadro abaixo mapeia todas as categorias de dados manipuladas no ecossistema HAXR Signature:

| Categoria de Dados | Titular dos Dados | Finalidade do Tratamento | Sistema / Componente | Tabela Neon / Entidade | Localização Cloudflare R2 | Subprocessador Envolvido | Período de Retenção Actual | Via de Eliminação | Controlos de Acesso |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Contas de Utilizadores** | Noivos / Operadores | Autenticação e gestão do portal | `/admin` e `/app` | `auth.users` / `app_private.profiles` | N/A | Neon | Durante a vigência do contrato + 5 anos fiscais | Acção do utilizador ou pedido formal a `info@haxrsignature.com` | Criptografia bcrypt / sessões HMAC seguras |
| **Clientes & Anfitriões** | Noivos / Clientes | Registo e condução de contratos de assessoria | CRM `/admin/clients` | `public.clients` | N/A | Neon | Durante a relação comercial + 10 anos fiscais | Eliminação por via de script administrativo sob pedido | Acesso restrito à equipa de produção HAXR |
| **Eventos & Cronogramas** | Noivos e Famílias | Planeamento e gestão cerimonial | Gestor de Eventos | `public.events` | N/A | Neon | Duração do evento + 3 anos para histórico | Eliminação no painel de administração | Isolamento por identificador de evento |
| **Convidados** | Convidados de eventos | Elaboração de listas e credenciação | Gestão de Convidados | `public.guests`, `guest_groups` | N/A | Neon | Até 60 dias após a conclusão do evento | Eliminação em lote pelo administrador | Visível apenas aos noivos e à equipa HAXR |
| **Respostas de RSVP** | Convidados de eventos | Confirmação de presença e dietary requirements | RSVP Web & Edition | `public.guests` / `rsvp_submissions` | N/A | Neon | Até 60 dias após a realização do evento | Eliminação programática ou expiração de evento | Acesso autenticado via token de evento |
| **Números Telefónicos** | Clientes e Convidados | Envio de confirmações, convites e lembretes | RSVP & Notificações | `public.guests.phone`, `clients.phone` | N/A | Neon, Twilio (WhatsApp) | Conforme a duração do serviço contratado | Rectificação ou eliminação a pedido | Apenas pessoal autorizado para contacto cerimonial |
| **Endereços de Email** | Clientes e Convidados | Envio de propostas, recibos e confirmações | Comunicação Operacional | `clients.email`, `guests.email` | N/A | Neon, Resend | Duração contratual ou cancelamento de subscrição | Eliminação imediata na base de dados | Isolamento em servidor com ligações TLS |
| **Comprovativos Bancários**| Clientes pagadores | Verificação de transferências e conciliação | Financeiro `/admin` | `public.payments` | `haxr-private-uploads/clients/{id}/payments/` | Neon, Cloudflare R2 | 10 anos civis (obrigação contabilística e fiscal moçambicana) | Arquivo frio arquivado; eliminação após prazo fiscal legal | URLs assinadas temporárias (600 segundos) |
| **Contratos & Propostas** | Clientes e Fornecedores | Formalização de obrigações de assessoria | Documentos Privados | `public.documents`, `document_line_items` | `haxr-private-uploads/clients/{id}/documents/` | Neon, Cloudflare R2 | 10 anos civis (validade comercial e fiscal) | Purga segura após caducidade contratual | Acesso restrito via sessão HMAC e presigned URLs |
| **Dados de Fornecedores** | Parceiros de eventos | Registo de catálogo, contactos e avaliação | Directório `/vendors` | `public.businesses`, `service_catalog` | N/A | Neon | Enquanto durar a parceria comercial activa | Desactivação de perfil ou eliminação a pedido | Directório público (dados de negócio consentidos) |
| **Subscrições de Newsletter**| Visitantes do website | Envio de editoriais e novidades de planeamento | Formulário de Rodapé | `public.marketing_contacts` | N/A | Neon, Brevo | Até manifestação de cancelamento (*opt-out*) | Hiperligação de cancelamento directo ou pedido por email | Acesso restrito a operações editoriais |
| **Uploads do Concierge** | Noivos / Clientes | Envio de referências visuais e listas | HAXR Concierge | `public.events.concierge` | `haxr-private-uploads/events/{id}/concierge/` | Neon, Cloudflare R2 | Até 90 dias após a entrega final do evento | Eliminação no painel administrativo | Chave digital de acesso e tokens efémeros |
| **Dados Processados por IA**| Noivos / Clientes | Triagem de pedidos e sugestão orçamental | Motor Gemini | Memória volátil de execução | N/A | Google Cloud / Gemini API | Não retido pelo fornecedor para treino de modelos | Eliminação imediata no termo da requisição HTTP | Acesso restrito via servidor (sem exposição no cliente) |
| **Dados de Convite Digital** | Casal anfitrião | Apresentação personalizada da celebração | Edition Engine | Ficheiros de configuração e Neon DB | N/A | Neon, Vercel | Duração da celebração + 12 meses de memória | Desactivação de slug pelo administrador | Slug privado não indexado publicamente |
| **Reservas de Presentes** | Convidados | Evitar compras em duplicado na lista | Módulo de Presentes | `edition_gift_reservations` | N/A | Neon | Até 30 dias após o evento | Eliminação automática após fecho da lista | Leitura pública por slug; reserva atómica em banco |
| **Mural de Memórias (Plus)** | Convidados do evento | Partilha interactiva de fotografias da festa | Plus Memories | `public.wedding_photos` | `wedding-photos/{slug}/{id}/` | Neon, Cloudflare R2 | 6 meses de custódia activa para os noivos | Exportação em ZIP pelos noivos e purga definitiva | Galeria acessível apenas aos convidados com slug |
| **Fotografias e Vídeos** | Convidados e Noivos | Arquivo visual colaborativo do evento | Mídia Cerimonial | `public.photo_upload_intents` | `wedding-photos/{slug}/{id}/original.*` | Cloudflare R2 | Conforme pacote contratado (mínimo 6 meses) | Exportação final e destruição de objectos no R2 | URLs assinadas GET temporárias de leitura |
| **Registos de Auditoria** | Operadores do sistema | Rastreabilidade de alterações em convidados | Módulo de Auditoria | `public.guest_audit_log` | N/A | Neon | 12 meses | Purga automática periódica | Visualização exclusiva pelo administrador master |
| **Limites de Frequência** | Navegadores / IPs | Defesa contra ataques de negação de serviço | Segurança de APIs | `public.api_rate_limits` | N/A | Neon | 24 horas (janela deslizante efémera) | Sobrescrita automática por expiração temporal | Sistema interno de segurança |
| **Sessões Administrativas** | Operadores HAXR | Controlo de acesso ao painel de gestão | Sessão HMAC | Cookies criptográficos | N/A | Navegador / Vercel | 7 dias | Expiração automática ou clique em Terminar Sessão | Encriptação simétrica via `ADMIN_SESSION_SECRET` |

---

## 7. Recomendações Técnicas de Implementação Futura

1. **Criação de Rotas Canónicas Independentes:**
   - Implementar as rotas dedicadas `/privacidade`, `/termos-de-servico` e `/condicoes-gerais` em Next.js com conteúdo jurídico integral, acessível por motores de busca e com metadados SEO próprios.
2. **Desenvolvimento do Componente de Consentimento (*Cookie Banner*):**
   - Construir o componente em React sob a estética de alta-costura, com persistência da escolha num cookie essencial e sem carregamento prévio de scripts de terceiros.
3. **Ponto de Contacto Formal para Privacidade:**
   - Criar e divulgar um endereço específico (ex.: `privacidade@haxrsignature.com`) para atendimento de pedidos de acesso, correcção ou eliminação de dados pessoais em Moçambique.
