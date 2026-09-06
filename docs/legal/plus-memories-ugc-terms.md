# Termos de Utilização e Conteúdo Gerado por Convidados: Plus Memories (UGC)

**Canal de Publicação:** Componente integrado no mural `/api/memories` e ecrã de carregamento  
**Ecossistema:** HAXR Signature Edition Engine (`haxrsignature-edition-engine`)  
**Data da Última Actualização:** 06 de Setembro de 2026  
**Língua / Norma Ortográfica:** Português de Moçambique  
**Estado:** Minuta de Engenharia Pronta para Revisão Jurídica (`LEGAL_REVIEW_REQUIRED`)  

---

## 1. Objectivo do Módulo Plus Memories

O **Plus Memories** é um serviço colaborativo cerimonial concebido para permitir que convidados confirmados e presentes na celebração partilhem fotografias, vídeos curtos e notas de felicitações directamente no mural privado do casamento dos anfitriões.

O objectivo é enriquecer o património afectivo e a memória documental da festa sob uma experiência digital privativa de alta joalharia.

---

## 2. Legitimidade e Autoridade de Carregamento (*Upload Authority*)

2.1. O carregamento de fotografias e vídeos é reservado exclusivamente aos convidados que acedem à celebração através da ligação segura e individualizada do convite digital (*slug* canónico do evento).

2.2. Ao submeter qualquer imagem ou vídeo, o utilizador declara sob sua responsabilidade que:
- É o autor da fotografia ou vídeo, ou possui autorização expressa da pessoa que o registou;
- Não está a violar a intimidade ou imagem de pessoas que expressamente tenham recusado ser fotografadas;
- O conteúdo foi captado no contexto da celebração e respeita a dignidade dos noivos e dos presentes.

---

## 3. Conteúdos Expressamente Proibidos (*Prohibited Content*)

É terminantemente proibido o carregamento de qualquer ficheiro que contenha ou promova:
1. Imagens com nudez, cariz sexual explícito, pornografia ou insinuações obscenas;
2. Conteúdos de ódio, discriminação racial, religiosa, de género ou étnica;
3. Imagens ofensivas, vexatórias ou susceptíveis de causar embaraço público aos noivos, às suas famílias ou a convidados de alto perfil institucional;
4. Actos de violência, consumo de substâncias ilícitas ou promoção de comportamentos perigosos;
5. Mensagens publicitárias, comerciais, spam ou links promocionais não solicitados;
6. Ficheiros maliciosos, códigos executáveis ou imagens manipuladas com o intuito de contornar a segurança da plataforma.

---

## 4. Moderação em Dupla Camada (Anfitriões e HAXR)

Para assegurar a paz cerimonial e proteger os anfitriões contra conteúdos desapropriados, o sistema implementa um modelo de moderação em dupla camada:

1. **Moderação pelo Casal Anfitrião (Host Moderation):**  
   Os noivos dispõem de ferramentas directas no seu painel privado para ocultar ou eliminar instantaneamente qualquer fotografia ou vídeo submetido para o seu mural;
2. **Moderação de Segurança pela HAXR (HAXR Moderation):**  
   A equipa técnica da HAXR Signature opera um mecanismo de controlo que permite remover imediatamente, sem necessidade de aviso prévio, qualquer conteúdo que viole as proibições legais da Lei n.º 14/2026 (Crimes Cibernéticos) ou estes termos.

---

## 5. Direitos de Terceiros e Pedidos de Remoção (*Removal Requests*)

5.1. Qualquer pessoa retratada numa fotografia disponibilizada no mural do Plus Memories tem o direito inalienável de solicitar a sua remoção imediata.

5.2. **Canal Operacional Rápido:**  
O pedido de remoção pode ser efectuado directamente junto dos noivos anfitriões do evento ou mediante envio de mensagem com o link/identificador da fotografia para:  
📧 `privacidade@haxrsignature.com` (ou contacto via WhatsApp da coordenação do evento).  
A remoção no armazenamento privado Cloudflare R2 e na base de dados será executada no prazo máximo de **24 horas úteis**.

---

## 6. Prazos de Retenção e Purga Definitiva de Ficheiros

6.1. O mural de memórias é uma galeria efémera e privada. Os ficheiros carregados permanecem disponíveis na infraestrutura de nuvem durante o período de **6 (seis) meses** a contar da data de realização do casamento.

6.2. Durante este período, o casal anfitrião pode descarregar a totalidade dos ficheiros originais num arquivo compactado (`ZIP`).

6.3. Decorrido o prazo de custódia activa e após aviso prévio aos noivos, a HAXR Signature executa a purga técnica definitiva de todos os binários alojados no bucket Cloudflare R2 e respectivos metadados no Neon PostgreSQL, libertando os dados de qualquer arquivo residual.

---

## 7. Regra Absoluta sobre Utilização em Marketing e Portefólio da HAXR

> [!CAUTION]
> **REGRA FUNDAMENTAL DE NÃO-APROPRIAÇÃO:**  
> O simples carregamento de uma fotografia ou vídeo por um convidado no mural *Plus Memories* **NÃO concede à HAXR Signature qualquer licença comercial, direito de autor ou autorização de utilização pública para efeitos de marketing, redes sociais, publicidade institucional ou divulgação em portefólio.**

7.1. Os conteúdos carregados pertencem exclusivamente aos seus respectivos autores e aos noivos anfitriões.

7.2. Qualquer utilização de imagens do evento para promoção pública da marca HAXR Signature exige **obrigatoriamente um consentimento prévio, separado, específico e prestado por escrito pelo casal titular da celebração e pelas pessoas identificáveis retratadas.** `LEGAL_REVIEW_REQUIRED`
