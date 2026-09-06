# Política de Cookies e Armazenamento Local HAXR Signature (Minuta de Produção)

**Canal de Publicação Futuro:** `/cookies`  
**Ecossistema:** HAXR Signature (`haxrsignatureweb` & `haxrsignature-edition-engine`)  
**Data da Última Actualização:** 06 de Setembro de 2026  
**Língua / Norma Ortográfica:** Português de Moçambique  
**Estado:** Minuta de Engenharia Pronta para Revisão Jurídica (`LEGAL_REVIEW_REQUIRED`)  

---

## 1. O que São Cookies e Mecanismos de Armazenamento Local

Cookies são pequenos ficheiros de texto transmitidos por um servidor web para o navegador do utilizador e reenviados em requisições posteriores. O armazenamento local (*local storage* e *session storage*) consiste em memória reservada no navegador para reter dados de conveniência de navegação sem transmissão automática em cada cabeçalho de rede HTTP.

Na HAXR Signature, adoptamos uma arquitectura orientada à privacidade por desenho (*Privacy by Design*). A plataforma opera segundo os princípios de minimização e transparência consagrados no Artigo 42.º da **Lei n.º 3/2017, de 9 de Janeiro (Transacções Electrónicas)** e nos padrões internacionais de protecção de dados.

---

## 2. Diagnóstico em Tempo Real: Ausência de Rastreadores Não-Essenciais

A auditoria exaustiva ao código e ao tráfego de rede confirma formalmente o seguinte estado:

```text
NON_ESSENTIAL_COOKIES_FOUND=false
THIRD_PARTY_TRACKING_PIXELS=0
COOKIE_BANNER_REQUIRED_NOW=false
```

### O que NÃO existe nas nossas plataformas:
1. **Sem Pixels Publicitários:** Não existem pixels ou SDKs de rastreio de redes sociais (como Meta Pixel, TikTok Pixel ou LinkedIn Insight);
2. **Sem Ferramentas Invasivas de Sessão:** Não são utilizadas ferramentas de gravação de ecrã ou mapas de calor biométricos (como Hotjar, Clarity ou similares);
3. **Sem Telemetria de Terceiros no Cliente:** As fontes tipográficas Google Fonts são servidas directamente pela mesma origem (`self-hosted`), sem contacto do navegador com servidores de terceiros;
4. **Sem Banners Obstrutivos Desnecessários:** Em estrita observância das directrizes internacionais e da legislação moçambicana, websites que utilizam **exclusivamente cookies estritamente necessários e armazenamento local funcional de conveniência estão isentos de exigir consentimento prévio obstrutivo** aos utilizadores através de banners intrusivos. Por essa razão, a HAXR Signature não sobrecarrega a experiência de alta-costura com um banner imediato.

---

## 3. Inventário Detalhado dos Cookies em Utilização

A tabela abaixo discrimina todos os cookies de primeira parte (*first-party cookies*) emitidos pelo nosso servidor:

| Nome do Cookie | Fornecedor / Origem | Finalidade Técnica | Âmbito (*Path*) | Duração | Propriedades de Segurança | Classificação |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `haxr_admin_session` | HAXR Signature (Servidor) | Gestão segura de sessão autenticada da equipa no painel de administração (`/admin`) | `/admin`, `/api/admin` | 7 dias | `Secure`, `HttpOnly`, `SameSite=Lax`, Encriptado HMAC-SHA256 | **Estritamente Necessário** |
| `neon-auth.session_token` | Neon Auth / HAXR | Gestão segura de sessão do portal do cliente (`/app`) para casais autenticados | `/` | 30 dias | `Secure`, `HttpOnly`, `SameSite=Lax`, TLS | **Estritamente Necessário** |

---

## 4. Inventário de Armazenamento Local no Navegador (`localStorage`)

Para assegurar uma navegação veloz e permitir que os visitantes utilizem ferramentas interactivas sem necessidade de criar conta ou enviar dados prematuros para o servidor, utilizamos o armazenamento local do dispositivo:

### 4.1. Plataforma Web Institucional (`haxrsignatureweb`)
- `haxr-favorites`: Memoriza os identificadores de fornecedores de casamento guardados pelo visitante na sua lista pessoal de favoritos;
- `haxr_style_quiz_result`: Guarda o resultado estético do quiz de estilo para filtrar sugestões no catálogo sem recolha de identidade;
- `haxr_checklist_v2`: Regista o estado de conclusão de tarefas de planeamento nupcial na ferramenta de lista de verificação local;
- `haxr_budget_expenses`: Guarda as estimativas numéricas de convidados e bebidas calculadas na ferramenta interactiva de catering;
- `haxr_onboarding_*`: Preserva o rascunho de data de casamento e perfil seleccionado antes do envio formal de pedido de contacto.

### 4.2. Motor Cerimonial de Convites (`haxrsignature-edition-engine`)
- `edition_rsvp_confirmed_{slug}`: Memoriza no dispositivo do convidado que a confirmação de presença para o evento já foi submetida com sucesso;
- `haxr_gift_{slug}_{giftId}`: Regista o presente curado que o convidado reservou na lista nupcial;
- `haxr_audio_{slug}`: Guarda a preferência de reprodução de áudio cerimonial (mudo ou activo);
- `haxr_plus_memories_participant_{slug}`: Identificador efémero do convidado para atribuição voluntária de memórias fotográficas no mural;
- `haxr_plus_memories_challenges_{slug}`: Regista a lista de desafios fotográficos cumpridos durante a festa.

Todos estes dados residem exclusivamente no navegador do utilizador e podem ser eliminados a qualquer momento através da limpeza da cache do navegador.

---

## 5. Arquitectura de Gestão de Consentimento Futura (Caso Sejam Integrados Rastreadores)

Se no futuro a HAXR Signature optar por integrar ferramentas analíticas de mensuração de audiência editorial ou campanhas publicitárias que utilizem cookies não-essenciais, **tornar-se-á imediatamente obrigatória a activação de um Gestor de Consentimento de Cookies (*Consent Manager*)**.

### Princípios da Arquitectura Concebida:
1. **Conformidade WCAG 2.2 AA:** Interface perfeitamente acessível por teclado e leitores de ecrã, com contrastes tipográficos nobres em preto noir e ouro champanhe;
2. **Ausência Absoluta de Padrões Escuros (*Dark Patterns*):**
   - É estritamente vedado apresentar o botão "Aceitar" em destaque cromático agressivo em relação ao botão "Apenas Essenciais";
   - Ambas as opções terão dignidade visual equivalente;
   - Rejeitar cookies analíticos/marketing será tão imediato quanto aceitá-los (um único toque);
3. **Três Opções Canónicas:**
   - `ACEITAR TODOS`: Activa cookies funcionais, estatísticos e de personalização editorial;
   - `APENAS ESSENCIAIS`: Bloqueia qualquer script analítico, mantendo apenas a segurança e as preferências locais;
   - `PERSONALIZAR`: Painel granular de categorias com interruptores independentes;
4. **Facilidade de Revogação Permanente:** Ligação permanente no rodapé designada `PREFERÊNCIAS DE PRIVACIDADE`, permitindo alterar o consentimento a qualquer instante;
5. **Disciplina *Fail-Closed*:** Nenhum script analítico de terceiros será descarregado ou executado antes da manifestação de consentimento positivo (*opt-in* activo).

---

## 6. Como Gerir ou Desactivar Cookies no Seu Navegador

O utilizador pode em qualquer momento configurar o seu navegador de Internet para aceitar, recusar ou eliminar cookies. Note-se que a desactivação de cookies estritamente necessários impedirá o início de sessão no Portal do Cliente e na área de administração.

Para instruções detalhadas, consulte a secção de ajuda do seu navegador:
- Google Chrome: Definições > Privacidade e Segurança > Cookies
- Apple Safari: Preferências > Privacidade > Gerir Dados de Sítios Web
- Mozilla Firefox: Definições > Privacidade e Segurança > Cookies e Dados de Sítios
- Microsoft Edge: Definições > Cookies e Permissões de Sítios

---

## 7. Contacto e Revisão Legal

Quaisquer dúvidas sobre a gestão de cookies podem ser enviadas para:  
📧 `privacidade@haxrsignature.com`

*Cláusula de Salvaguarda Jurídica: As matérias de adequação com regulamentos internacionais de transferência de dados e enquadramento nas directrizes de comunicações electrónicas em Moçambique devem ser revistas por consultor jurídico devidamente credenciado.* `LEGAL_REVIEW_REQUIRED`
