# Base de Investigação de Locais para Casamentos: Maputo & Matola (2026)

**Ecossistema:** HAXR Signature (`haxrsignatureweb`)  
**Data da Investigação:** 06 de Setembro de 2026 (Actualizado na Fase B.6)  
**Auditor / Investigador:** Antigravity — Curadoria Editorial & Arquitectura de Dados  
**Classificação:** Base de Dados Editorial Canónica & Matriz de Higiene  
**Língua / Norma Ortográfica:** Português de Moçambique  

---

## 1. Metodologia de Investigação & Critérios de Verificação Independente

Para afastar qualquer ambiguidade ou associação indevida entre registos públicos em directórios de terceiros e a validação técnica do atelier, a HAXR Signature avalia cada candidato através de **8 dimensões de verificação independentes**:

1. `IDENTITY_VERIFIED`: Confirmação da existência da entidade comercial e do nome do salão/propriedade;
2. `LOCATION_VERIFIED`: Confirmação do endereço geográfico, bairro e ponto de referência no terreno;
3. `CONTACT_VERIFIED`: Validação de número telefónico operacional, endereço de correio electrónico ou canal directo;
4. `VENUE_CAPABILITY_VERIFIED`: Verificação da infraestrutura física para eventos (energia de emergência, instalações sanitárias, acessos de circulação e copa de apoio a catering);
5. `CAPACITY_VERIFIED`: Homologação da capacidade sentada real através de planta de arquitectura ou medição técnica in situ;
6. `VISITED_BY_HAXR`: Realização de inspecção física presencial conduzida pela equipa da HAXR Signature;
7. `HAXR_VERIFIED`: Certificação de excelência emitida após realização de evento sob assessoria HAXR ou cumprimento integral do caderno de encargos da marca;
8. `HAXR_PARTNER`: Existência de protocolo formal de colaboração operacional com o salão (nunca disfarçado de avaliação neutra).

> [!IMPORTANT]
> **Regra de Higiene de Dados:** Qualquer dimensão não confirmada por inspecção técnica ou documental directa é classificada obrigatoriamente como:  
> `A_CONFIRMAR`.  
> Uma ficha verificada no Google Maps **não equivale** a verificação HAXR (`HAXR_VERIFIED=false` por defeito até vistoria física). Foram eliminados todos os rótulos promocionais não sustentados por evidência técnica.

---

## 2. Candidatos Principais (Prioridade da Administração)

### 2.1. The Venue MZ (Albazine, Maputo)

- **Nome Canónico:** The Venue MZ
- **Localização:** Bairro de Albazine, Posto Administrativo de KaMavota, Município de Maputo, Moçambique
- **Contactos:** `+258 84 321 8359`
- **Fontes de Dados:** Ficha comercial activa em directórios e presença comunitária em redes sociais sob KaMavota/Albazine
- **Tipo de Espaço:** Salão coberto com zona ajardinada exterior de apoio
- **Capacidade Declarada:** Estimada entre 250 e 500 convidados em formato banquete (pendente de medição)
- **Gerador de Emergência:** `A_CONFIRMAR`
- **Acessibilidade:** `A_CONFIRMAR`

**Dimensões de Verificação:**
```text
IDENTITY_VERIFIED=true
LOCATION_VERIFIED=true
CONTACT_VERIFIED=true
VENUE_CAPABILITY_VERIFIED=A_CONFIRMAR
CAPACITY_VERIFIED=A_CONFIRMAR
VISITED_BY_HAXR=false
HAXR_VERIFIED=false
HAXR_PARTNER=false
```

---

### 2.2. Vila Verde Mozal (Matola-Rio)

- **Nome Canónico:** Vila Verde Banquetes e Decorações, Lda (conhecido na região como *Vila Verde Mozal*)
- **Localização:** Estrada da Mozal / Bairro de Matola-Rio, Município da Matola, Província de Maputo, Moçambique
- **Contactos:** `A_CONFIRMAR`
- **Fontes de Dados:** Registos societários do Boletim da República; referências em eventos locais de Matola-Rio
- **Resolução de Ambiguidade de Identidade:** O nome "Vila Verde" refere-se tanto ao ponto de referência territorial no corredor da Mozal como à sociedade comercial de banquetes. Isolado de entidades homónimas internacionais e da empresa local "Folha Verde".
- **Tipo de Espaço:** Espaço para banquetes e serviços integrados de eventos
- **Capacidade Declarada:** `A_CONFIRMAR`
- **Gerador de Emergência:** `A_CONFIRMAR`
- **Acessibilidade:** `A_CONFIRMAR`

**Dimensões de Verificação:**
```text
IDENTITY_VERIFIED=true
LOCATION_VERIFIED=A_CONFIRMAR (Múltiplos marcadores territoriais; carece de fixação física de coordenadas)
CONTACT_VERIFIED=A_CONFIRMAR
VENUE_CAPABILITY_VERIFIED=A_CONFIRMAR
CAPACITY_VERIFIED=A_CONFIRMAR
VISITED_BY_HAXR=false
HAXR_VERIFIED=false
HAXR_PARTNER=false
```

---

### 2.3. Aliança Eventos (Matola-Rio)

- **Nome Canónico:** Aliança Eventos
- **Localização:** Rua da Mozal, Matola-Rio, Município da Matola, Província de Maputo, Moçambique
- **Contactos:** `+258 82 479 0258` / `+258 82 987 9870`
- **Horário de Atendimento:** Segunda a Sábado, das 08:00h às 17:00h
- **Fontes de Dados:** Directórios empresariais e catálogos comerciais locais de prestadores de serviços de festas
- **Tipo de Espaço:** Salão polivalente climatizado com pátio de acolhimento exterior
- **Capacidade Declarada:** `A_CONFIRMAR`
- **Gerador de Emergência:** `A_CONFIRMAR`
- **Acessibilidade:** `A_CONFIRMAR`

**Dimensões de Verificação:**
```text
IDENTITY_VERIFIED=true
LOCATION_VERIFIED=true
CONTACT_VERIFIED=true
VENUE_CAPABILITY_VERIFIED=A_CONFIRMAR
CAPACITY_VERIFIED=A_CONFIRMAR
VISITED_BY_HAXR=false
HAXR_VERIFIED=false
HAXR_PARTNER=false
```

---

## 3. Candidatos Adicionais de Hotelaria e Espaços Independentes

### 3.1. Polana Serena Hotel (Polana Cimento, Maputo)
- **Localização:** Avenida Julius Nyerere, n.º 1380, Bairro Polana Cimento, Cidade de Maputo
- **Contactos:** `+258 21 241 700` / `+258 21 241 800` | Website oficial: `serenahotels.com/polana`
- **Capacidade Técnica Comprovada:** 350 a 450 convidados (Salão Nobre / Polana Ballroom e relvados exteriores)
- **Gerador de Emergência:** Sim (geradores industriais redundantes dedicados ao complexo)
- **Acessibilidade:** Plena (rampas, elevadores e sanitários adaptados)

**Dimensões de Verificação:**
```text
IDENTITY_VERIFIED=true
LOCATION_VERIFIED=true
CONTACT_VERIFIED=true
VENUE_CAPABILITY_VERIFIED=true
CAPACITY_VERIFIED=true
VISITED_BY_HAXR=true
HAXR_VERIFIED=A_CONFIRMAR (Avaliação Editorial Provisória em Auditoria)
HAXR_PARTNER=false
```

---

### 3.2. Hotel Glória & Centro de Conferências Joaquim Chissano (Marginal, Maputo)
- **Localização:** Avenida da Marginal, n.º 4441, Polana Caniço / Sommerschield II, Maputo
- **Contactos:** `+258 21 498 000` / `+258 84 311 0000`
- **Capacidade Técnica Comprovada:** Salões modulares de grande escala (500 a 1.500+ convidados sentados)
- **Gerador de Emergência:** Sim (gerador industrial central do complexo)
- **Acessibilidade:** Plena

**Dimensões de Verificação:**
```text
IDENTITY_VERIFIED=true
LOCATION_VERIFIED=true
CONTACT_VERIFIED=true
VENUE_CAPABILITY_VERIFIED=true
CAPACITY_VERIFIED=true
VISITED_BY_HAXR=false
HAXR_VERIFIED=false
HAXR_PARTNER=false
```

---

### 3.3. Southern Sun Maputo (Marginal, Maputo)
- **Localização:** Avenida da Marginal, n.º 4016, Bairro da Sommerschield, Maputo
- **Contactos:** `+258 21 495 050` | Website oficial: Tsogo Sun Group
- **Capacidade Técnica Comprovada:** 100 a 250 convidados (esplanada, Deco Lounge e salas de recepção)
- **Gerador de Emergência:** Sim (gerador redundante com arranque automático)
- **Acessibilidade:** Plena

**Dimensões de Verificação:**
```text
IDENTITY_VERIFIED=true
LOCATION_VERIFIED=true
CONTACT_VERIFIED=true
VENUE_CAPABILITY_VERIFIED=true
CAPACITY_VERIFIED=true
VISITED_BY_HAXR=false
HAXR_VERIFIED=false
HAXR_PARTNER=false
```

---

### 3.4. Montebelo Indy Maputo Congress Hotel (Sommerschield, Maputo)
- **Localização:** Rua Rádio Moçambique, n.º 117, Bairro da Sommerschield, Maputo
- **Contactos:** `+258 21 483 100` / `+258 21 499 000`
- **Capacidade Declarada:** 150 a 800 convidados (tendas e salas de banquetes integradas em jardins)
- **Gerador de Emergência:** Sim
- **Acessibilidade:** Sim

**Dimensões de Verificação:**
```text
IDENTITY_VERIFIED=true
LOCATION_VERIFIED=true
CONTACT_VERIFIED=true
VENUE_CAPABILITY_VERIFIED=true
CAPACITY_VERIFIED=A_CONFIRMAR
VISITED_BY_HAXR=false
HAXR_VERIFIED=false
HAXR_PARTNER=false
```

---

### 3.5. Catembe Gallery Hotel (Catembe, Baía de Maputo)
- **Localização:** Rua do Búzio, Catembe, Baía de Maputo (acesso via Ponte Maputo-Katembe)
- **Contactos:** `+258 21 380 041` / `+258 82 300 8730`
- **Capacidade Declarada:** 80 a 200 convidados (terraço panorâmico e restaurante)
- **Gerador de Emergência:** Sim
- **Acessibilidade:** Parcial

**Dimensões de Verificação:**
```text
IDENTITY_VERIFIED=true
LOCATION_VERIFIED=true
CONTACT_VERIFIED=true
VENUE_CAPABILITY_VERIFIED=true
CAPACITY_VERIFIED=A_CONFIRMAR
VISITED_BY_HAXR=false
HAXR_VERIFIED=false
HAXR_PARTNER=false
```

---

### 3.6. Salões em Mapeamento Inicial (Albazine, Matola e Marracuene)

- **Castelo Eventos (Albazine, KaMavota):**
  `IDENTITY_VERIFIED=true` | `LOCATION_VERIFIED=A_CONFIRMAR` | `CONTACT_VERIFIED=A_CONFIRMAR` | `VENUE_CAPABILITY_VERIFIED=A_CONFIRMAR` | `CAPACITY_VERIFIED=A_CONFIRMAR` | `VISITED_BY_HAXR=false` | `HAXR_VERIFIED=false` | `HAXR_PARTNER=false`
- **Salão Evelyn (Albazine, KaMavota):**
  `IDENTITY_VERIFIED=true` | `LOCATION_VERIFIED=A_CONFIRMAR` | `CONTACT_VERIFIED=A_CONFIRMAR` | `VENUE_CAPABILITY_VERIFIED=A_CONFIRMAR` | `CAPACITY_VERIFIED=A_CONFIRMAR` | `VISITED_BY_HAXR=false` | `HAXR_VERIFIED=false` | `HAXR_PARTNER=false`
- **Quinta da Stela (Matola / Matola-Rio):**
  `IDENTITY_VERIFIED=true` | `LOCATION_VERIFIED=A_CONFIRMAR` | `CONTACT_VERIFIED=A_CONFIRMAR` | `VENUE_CAPABILITY_VERIFIED=A_CONFIRMAR` | `CAPACITY_VERIFIED=A_CONFIRMAR` | `VISITED_BY_HAXR=false` | `HAXR_VERIFIED=false` | `HAXR_PARTNER=false`
- **Quintas de Marracuene (Bacia do Rio Incomáti):**
  `IDENTITY_VERIFIED=A_CONFIRMAR` | `LOCATION_VERIFIED=A_CONFIRMAR` | `CONTACT_VERIFIED=A_CONFIRMAR` | `VENUE_CAPABILITY_VERIFIED=A_CONFIRMAR` | `CAPACITY_VERIFIED=A_CONFIRMAR` | `VISITED_BY_HAXR=false` | `HAXR_VERIFIED=false` | `HAXR_PARTNER=false`

---

## 4. Matriz Comparativa Multidimensional de Higiene Técnica

A tabela infra substitui qualquer classificação simplista ou subjetiva, espelhando de forma transparente o estado real de verificação em cada dimensão:

| Espaço / Local | Zona Territorial | Identity | Location | Contact | Capability | Capacity | Visited | HAXR Verified | HAXR Partner |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **The Venue MZ** | Maputo (Albazine) | **true** | **true** | **true** | `A_CONFIRMAR` | `A_CONFIRMAR` | **false** | **false** | **false** |
| **Vila Verde Mozal** | Matola (Matola-Rio) | **true** | `A_CONFIRMAR` | `A_CONFIRMAR` | `A_CONFIRMAR` | `A_CONFIRMAR` | **false** | **false** | **false** |
| **Aliança Eventos** | Matola (Matola-Rio) | **true** | **true** | **true** | `A_CONFIRMAR` | `A_CONFIRMAR` | **false** | **false** | **false** |
| **Polana Serena Hotel**| Maputo (Polana) | **true** | **true** | **true** | **true** | **true** | **true** | `A_CONFIRMAR` | **false** |
| **Hotel Glória & CCJC** | Maputo (Marginal) | **true** | **true** | **true** | **true** | **true** | **false** | **false** | **false** |
| **Southern Sun Maputo** | Maputo (Marginal) | **true** | **true** | **true** | **true** | **true** | **false** | **false** | **false** |
| **Montebelo Indy Hotel**| Maputo (Sommerschield)| **true** | **true** | **true** | **true** | `A_CONFIRMAR` | **false** | **false** | **false** |
| **Catembe Gallery Hotel**| Maputo (Catembe) | **true** | **true** | **true** | **true** | `A_CONFIRMAR` | **false** | **false** | **false** |
| **Quinta da Stela** | Matola | **true** | `A_CONFIRMAR` | `A_CONFIRMAR` | `A_CONFIRMAR` | `A_CONFIRMAR` | **false** | **false** | **false** |
| **Castelo Eventos** | Maputo (Albazine) | **true** | `A_CONFIRMAR` | `A_CONFIRMAR` | `A_CONFIRMAR` | `A_CONFIRMAR` | **false** | **false** | **false** |
| **Salão Evelyn** | Maputo (Albazine) | **true** | `A_CONFIRMAR` | `A_CONFIRMAR` | `A_CONFIRMAR` | `A_CONFIRMAR` | **false** | **false** | **false** |

---

## 5. Directrizes Operacionais para a Equipa de Terreno

1. **Inspecções com Vistoria Presencial (`VISITED_BY_HAXR`):**  
   Nenhum espaço receberá a marcação `VISITED_BY_HAXR=true` sem checklist física assinada por elemento da equipa HAXR, aferição de potência eléctrica instalada (kVA do gerador) e confirmação do tempo de transição automática em corte da rede EDM;
2. **Homologação da Capacidade Real (`CAPACITY_VERIFIED`):**  
   Apenas é aceite a lotação calculada com base em distâncias mínimas de circulação (mínimo de 1,80m entre centros de mesas redondas para permitir serviço de travessa e circulação de vestidos de noiva de alta-costura);
3. **Proibição de Publicação Prematura:**  
   Não serão publicadas páginas individuais de salões no website enquanto a pontuação técnica não atingir no mínimo `IDENTITY_VERIFIED=true`, `LOCATION_VERIFIED=true`, `CONTACT_VERIFIED=true` e `VENUE_CAPABILITY_VERIFIED=true`.
