# HAXR SIGNATURE — REGISTO DE INTAKE FOTOGRÁFICO & PRONTIDÃO DE PREVIEW (2026)

## Transição: Intake 002 (PASS_WITH_AMENDMENTS) → Aquisição de Masters de Alta Resolução

**Documento:** `docs/venues/haxr-venue-photography-intake-register.md`  
**Fase:** E.2 — Curadoria Fotográfica, Governação de Direitos & Prontidão de Preview  
**Data:** 11 de Setembro de 2026  
**Autor:** Principal Full-Stack Engineer / Alta-Costura Digital  
**Classificação:** Registo Canónico de Evidência Visual & Auditoria de Direitos  
**Norma Linguística:** Português de Moçambique  

---

## 1. Estatuto Executivo & Invariantes Actuais

O processo de intake fotográfico `HAXR-E2-PHOTOGRAPHY-INTAKE-002` encontra-se formalmente homologado com o veredicto:

$$\text{PHOTOGRAPHY\_INTAKE\_STATUS} = \mathbf{PASS\_WITH\_AMENDMENTS}$$

### Invariantes de Estado Canónicas

```text
REAL_VENUE_IMAGES_RECEIVED = 5
REAL_IMAGE_RIGHTS_CONFIRMED = 0
INDEPENDENT_VENUES_READY_FOR_PREVIEW = 0
PRODUCTION_VENUES_RENDERABLE = 0
PREVIEW_VENUES_RENDERABLE = 4  // Polana Serena, Southern Sun, Hotel Glória, Radisson Blu
```

### Âmbito Focado da Fase de Intake Fotográfico

A presente fase de aquisição e auditoria fotográfica concentra-se **estrita e exclusivamente** nos cinco espaços prioritários de primeira vaga:

1. `VILA_VERDE` (Vila Verde Banquetes)
2. `THE_VENUE_MZ` (The Venue MZ)
3. `COMPLEXO_ALIANCA` (Complexo Aliança / Aliança Eventos)
4. `CAJADA_EVENTOS` (Cajada Eventos)
5. `SALAO_EVELYN` (Salão de Eventos Evelyn)

*Directriz de Governação:* Não reiniciar investigação abrangente de mercado nem dispersar esforços para outros locais nesta etapa.

$$\text{NEXT\_PHASE} = \mathbf{AWAIT\_OWNER\_HIGH\_RESOLUTION\_MASTERS}$$

---

## 2. Correspondência de Identidade dos 5 Activos Fornecidos (Calibração Canónica)

Em estrito cumprimento das directrizes do proprietário da HAXR Signature:

| Espaço (`VENUE_ID`) | Ficheiro Recebido | Sujeito Visual | Base de Correspondência | Confiança de Identidade (`VENUE_IMAGE_IDENTITY_MATCH_CONFIDENCE`) | Direitos Confirmados (`IMAGE_USAGE_RIGHTS_CONFIRMED`) |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **`VILA_VERDE`** | `media_1789077444469.png` | Fachada arquitectónica exterior com alpendre e relvado | Confirmação soberana directa do proprietário | `OWNER_CONFIRMED` | `false` |
| **`THE_VENUE_MZ`** | `media_1789077559994.png` | Cerimónia ao ar livre com relvado, cadeiras e pérgola | Confirmação soberana directa do proprietário | `OWNER_CONFIRMED` | `false` |
| **`COMPLEXO_ALIANCA`** | `media_1789077500960.png` | Fachada contemporânea com letreiro "ALIANÇA EVENTOS" | Evidência visual forte (signage/watermark) | `HIGH` *(não classificado como "100% irrefutável")* | `false` |
| **`CAJADA_EVENTOS`** | `media_1789077578875.png` | Cobertura distintiva de colmo / elementos rústicos | Evidência visual forte (arquitectura física) | `HIGH` *(não classificado como "100% irrefutável")* | `false` |
| **`SALAO_EVELYN`** | `media_1789077480751.png` | Logótipo institucional "Salão de Eventos Evelyn" | Identidade gráfica oficial com monograma VF | `HIGH` | `false` |

---

## 3. Política de Marca de Água: Complexo Aliança

Em rigorosa consonância com os padrões éticos e operacionais da marca:

* **Manutenção da Cópia Descoberta sem Alterações:**
  $$\text{DISCOVERED\_WATERMARKED\_COPY\_EDIT\_ALLOWED} = \mathbf{false}$$
  Não alterar, remover, clonar, cobrir ou recortar a marca de água presente na imagem de baixa resolução descoberta.
* **Solicitação do Master Limpo Original:**
  $$\text{REQUEST\_ORIGINAL\_UNWATERMARKED\_MASTER} = \mathbf{true}$$
  Requisitar directamente o ficheiro master original e sem marca de água (*unwatermarked*) junto da gerência do espaço, fotógrafo oficial ou entidade autorizada detentora dos ficheiros originais.

---

## 4. Política Canónica de Direitos & Flexibilidade Probatória

O portão canónico de publicação de qualquer fotografia real assenta exclusivamente no binómio:

$$\mathbf{VENUE\_IMAGE\_IDENTITY\_MATCH} = \mathbf{true} \quad \wedge \quad \mathbf{IMAGE\_USAGE\_RIGHTS\_CONFIRMED} = \mathbf{true}$$

### Flexibilidade Factual na Prova de Direitos

* Não se exige "cessão formal por contrato escrito" como mecanismo universal obrigatório.
* O registo é avaliado e documentado caso a caso com base na situação real:
  $$\text{RIGHTS\_CONFIRMATION\_BASIS} = \mathbf{<\text{actual basis}>}$$
  Exemplos legítimos: autorização escrita e explícita da gerência/proprietário do espaço, confirmação directa do fotógrafo profissional detentor dos direitos autorais, consentimento expresso de clientes/anfitriões com direitos patrimoniais sobre as fotografias do evento, ou licenciamento comercial comprovado.

---

## 5. Alvos de Qualidade Técnica & Protocolo de Ingestão de Masters

A recepção de futuros ficheiros master fornecidos pelo proprietário obedece à ordem de prioridade dos cinco espaços em foco:

1. `VILA_VERDE`
2. `THE_VENUE_MZ`
3. `COMPLEXO_ALIANCA`
4. `CAJADA_EVENTOS`
5. `SALAO_EVELYN`

### Alvos de Engenharia (Metas de Qualidade, Não Bloqueios Rígidos do Proprietário)

```text
HERO_TARGET_WIDTH_PX = 1920
GALLERY_TARGET_WIDTH_PX = 1200
```

*Directriz de Calibração:* As dimensões acima constituem metas de qualidade técnica de engenharia (*engineering quality targets*), e não bloqueios rígidos do proprietário. Uma imagem com resolução inferior a estas referências **não é automaticamente inutilizável**; a adequação final dependerá do enquadramento, proporção de recorte (*crop*), dimensões efectivas de renderização no ecrã e nitidez intrínseca do activo.

### Matriz Canónica de Intake de Masters (15 Atributos)

```text
VENUE_ID: [Identificador canónico do espaço]
MASTER_FILE: [Nome exacto do ficheiro com extensão]
PIXEL_WIDTH: [Largura real em píxeis sem interpolação]
PIXEL_HEIGHT: [Altura real em píxeis sem interpolação]
FORMAT: [PNG, JPEG, WEBP, TIFF, DNG, etc.]
SOURCE_AS_STATED_BY_OWNER: [Origem indicada pelo proprietário]
VENUE_IMAGE_IDENTITY_MATCH: [true | false]
ORIGINAL_OR_DERIVATIVE: [ORIGINAL_MASTER | DERIVATIVE_WEB_COPY]
WATERMARK_PRESENT: [true | false]
IDENTIFIABLE_PEOPLE: [NONE | PERMISSION_REQUIRED | ANONYMIZED]
RIGHTS_CONFIRMATION_BASIS: [Base factual documentada caso a caso]
IMAGE_USAGE_RIGHTS_CONFIRMED: [true | false]
HERO_CROP_FEASIBLE: [true | false — avaliado pelo rácio, enquadramento e resolução]
GALLERY_READY: [true | false — avaliado pela nitidez e apresentação visual]
PUBLICATION_READY: [true | false]
```

> [!CAUTION]
> **Proibição de Upscale Fraudulento:** É expressamente proibido aplicar interpolação de software ou upscaling por IA a cópias web de baixa resolução para simular ficheiros master.

---

## 6. Correcções Cadastrais Preservadas no Registo

Para memória futura e integridade da base documental do Guia de Locais:

1. **A Kitanda Eventos**: `SOMMERSCHIELD_CONFLICT = false`, `PRIMARY_ENTITY_LOCATION = Infulene A, Matola`, `ADDRESS = Rua das Flores n.º 1541/2`, `ENTITY_MATCH_CONFIDENCE = HIGH`, `SOURCE_CONFLICT_100MAKAS = true`.
2. **Jardins Paloma Eventos**: `LOCATION_READY = true`, `WEDDING_RELEVANCE = SUPPORTED`, `LAST_PUBLIC_ACTIVITY_EVIDENCE = 2024`, `CURRENT_OPERATIONAL_STATUS_2026 = UNVERIFIED`, `OWNER_EDITORIAL_PRIORITY = false`.
3. **Espaço Águia**: `LEGAL_ENTITY = Eventos e Acomodação Águia – Sociedade Unipessoal, Limitada`, `DISTRICT = Marracuene`, `DISTRICT_LOCATION_STATUS = VERIFIED_LEGAL`, `EXACT_VENUE_LOCATION_STATUS = PARTIAL`, `CAPACITY_STATUS = UNKNOWN`.
4. **Princesa Eventos**: Proibida a expressão "capacidade máxima declarada = 350"; factualidade restrita a `DECLARED_PACKAGE_TIERS = [100, 150, 200, 250, 300, 350]`, `CAPACITY_STATUS = CAPACITY_DECLARED_UNVERIFIED`, `MAXIMUM_VENUE_CAPACITY = UNKNOWN`.

---

## 7. Blindagem de Superfície e Bloqueio de Activação

* **Allowlist de Preview Inalterada:**
  1. `POLANA_SERENA_HOTEL`
  2. `SOUTHERN_SUN_MAPUTO`
  3. `HOTEL_GLORIA_CCJC`
  4. `RADISSON_BLU_MAPUTO`
* **`PRODUCTION_VENUES_RENDERABLE = 0`**.
* **Zero fusões em `main` e zero publicação em Produção.**
* **Zero alteração em código aplicacional de runtime.**
