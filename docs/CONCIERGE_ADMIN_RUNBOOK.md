# HAXR Concierge — Runbook Operador (Admin)

**Versão:** Sprint V2-A · Julho 2026
**Âmbito:** Tab **Concierge** no evento (`/admin/events/[id]` → Concierge)

---

## 1. Pré-requisitos

| Requisito | Como verificar |
|-----------|----------------|
| Migration `027_concierge.sql` aplicada | Tab Concierge carrega sem aviso âmbar |
| `GEMINI_API_KEY` no ambiente | Banner «IA activa» no painel |
| Sessão Admin válida | Acesso ao painel de eventos |

**Regra de ouro:** A IA organiza. A equipa HAXR valida. O cliente acompanha.
**Nada é aplicado sem clicar em «Aprovar e aplicar».**

---

## 2. Tipos de documento suportados (apply automático)

| Tipo | Ficheiros típicos | Destino após aprovação |
|------|-------------------|------------------------|
| Proposta de fornecedor | PDF, Word, email export | Sub-tab **Fornecedores** |
| Recibo / pagamento | PDF, imagem M-Pesa | `/admin/cash` (financeiro) |
| Lista de convidados | CSV, Excel | Tab **Convidados** |
| Referência visual | JPG, PNG, PDF moodboard | Sub-tab **Moodboard** |
| Checklist | PDF, Word, texto | Sub-tab **Checklist** |

### Tipos sem apply automático (V2-A)

| Tipo | Comportamento |
|------|---------------|
| `contract` (Contrato) | IA pode classificar; **não aplica** automaticamente |
| `other` (Outro) | Idem — rever ficheiro e registar manualmente |

Use **Ver ficheiro original** para consultar o anexo. Rejeite ou corrija noutros módulos se necessário.

---

## 3. Fluxo padrão

### 3.1 Upload

1. Abra o evento → tab **Concierge**.
2. Clique **Carregar documento**.
3. Seleccione PDF, CSV, Excel (`.xlsx`), Word (`.docx`), imagem ou texto.
4. Aguarde processamento — novo item aparece na sub-tab **Fila** (filtro «Por rever»).

**Limites:** máx. 20 MB · tipos MIME permitidos (ver aviso se rejeitado).

### 3.2 Rever

1. Na **Fila**, seleccione o item.
2. Verifique:
   - Nome do ficheiro e tipo detectado
   - **Badge de confiança** (alta / baixa)
   - JSON extraído (editável)
3. Se confiança **baixa** (< 70%): compare com o **ficheiro original** linha a linha antes de aprovar.

### 3.3 Editar JSON

- Corrija nomes, valores MZN, datas (ISO `YYYY-MM-DD`), lista de convidados, etc.
- Erros de validação aparecem em vermelho **antes** de aprovar.
- JSON inválido **não pode** ser aprovado até corrigir.

### 3.4 Aprovar

1. Clique **Aprovar e aplicar** (acção explícita).
2. Se sucesso: mensagem verde + links para o destino (financeiro, convidados, sub-tabs).
3. Confirme dados na área de destino.

### 3.5 Rejeitar

1. Clique **Rejeitar** se o documento for irrelevante, duplicado ou incorrigível.
2. Nenhum dado é gravado nos módulos do evento.

---

## 4. Falha ao aplicar (retry)

Se aparecer **«Falha ao aplicar: …»**:

1. O item **permanece em «Por rever»** (não fica aprovado).
2. Corrija o JSON conforme a mensagem de erro.
3. Clique **Tentar aplicar novamente**.

**Causas comuns:**

| Erro | Acção |
|------|-------|
| Proposta sem nome de fornecedor | Preencher `vendorProposal.vendorName` |
| Recibo sem valor | Corrigir `paymentReceipt.amount` > 0 |
| Lista vazia | Adicionar `guestList.guests` ou `guestList.csvText` |
| Checklist sem tarefas | Adicionar `checklist.items[]` |
| Tipo contract/other | Não há apply — rejeitar ou processar manualmente |

---

## 5. Reprocessar com IA

Use **Reprocessar com IA** quando:

- A extracção inicial estiver claramente errada
- O upload tiver falhado na IA mas o ficheiro estiver no storage
- Quiser uma segunda leitura (sem aplicar automaticamente)

Isto cria um **novo item na fila**. O anterior mantém-se no histórico.
**Nunca reprocessa sozinho** — só por clique do operador.

---

## 6. Confiança baixa da IA

| Badge | Significado | Acção |
|-------|-------------|-------|
| Confiança alta (≥ 70%) | Extracção provávelmente correcta | Rever amostra |
| Confiança baixa (< 70%) | Risco de erro | Revisão cuidadosa obrigatória |
| Confiança: — | IA não devolveu score | Tratar como baixa |

**Nunca** assumir que dados de pagamento ou convidados estão correctos só porque a IA classificou.

---

## 7. Onde ver dados aplicados

| Sub-tab / link | Conteúdo |
|----------------|----------|
| **Fornecedores** | `event_vendors` via Concierge |
| **Checklist** | Tarefas `event_checklist_items` |
| **Moodboard** | Referências `event_moodboard_items` |
| Tab **Convidados** | Import idempotente (dedup) |
| **/admin/cash** | Pagamentos registados |

---

## 8. Formatos de ficheiro

| Formato | Parser | Notas |
|---------|--------|-------|
| CSV / TXT | Nativo | Preferir UTF-8 |
| PDF | pdf-parse | Bom para propostas e recibos |
| XLSX / XLS | SheetJS | Primeira folha; listas grandes truncadas na IA |
| DOCX | Mammoth | Preferir a `.doc` legado |
| DOC legado | Fallback limitado | Converter para DOCX ou PDF se possível |
| Imagens | Gemini vision | M-Pesa, moodboard, fotos |

---

## 9. Quando a IA errar

1. **Não aprovar** dados incorrectos.
2. Editar JSON manualmente **ou** **Reprocessar com IA**.
3. Se o tipo estiver errado (`documentType`), corrija no JSON antes de aprovar.
4. Para convidados com duplicados, use tab **Convidados** + fila de revisão existente.
5. Rejeite documentos irrelevantes para manter a fila limpa.

---

## 10. Segurança e privacidade

- Uploads são **operacionais** — não vão para marketing/Brevo.
- Links de ficheiro original expiram (~1 hora).
- Caminhos de storage validados por evento.
- Apenas Admin autenticado acede ao Concierge.

---

## 11. Troubleshooting rápido

| Sintoma | Solução |
|---------|---------|
| Aviso migration em falta | Aplicar `027_concierge.sql` no Supabase |
| «IA não configurada» | Definir `GEMINI_API_KEY` |
| Excel sem convidados na IA | Abrir XLSX — verificar primeira folha e cabeçalhos |
| JSON inválido | Corrigir sintaxe; ver erros listados |
| Contrato na fila | Sem apply — ver secção 2 |
| Item aprovado mas sem dados | Verificar mensagem de erro; usar retry |

---

## 12. Próximo sprint (V2-B) — fora do scope actual

Apply automático para **contratos / documentos de evento** ainda não existe.
Opções em avaliação: tabela `event_attachments`, integração com módulo documentos, ou manter só arquivo + revisão.
