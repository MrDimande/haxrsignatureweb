"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MinusCircle, Trash2 } from "lucide-react";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/AdminField";
import {
  createExpenseAction,
  deleteExpenseAction,
} from "@/lib/finance/actions/expenses.actions";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/finance/constants";
import { formatCurrency } from "@/lib/calculations";
import type { BusinessId, Currency } from "@/lib/admin/types";
import type { CashAnalytics, ExpenseCategory } from "@/lib/finance/types";
import type { ManagedEvent } from "@/lib/events/types";

type ExpensesPanelProps = {
  analytics: CashAnalytics;
  businesses: { id: BusinessId; name: string }[];
  events: ManagedEvent[];
};

export default function ExpensesPanel({
  analytics,
  businesses,
  events,
}: ExpensesPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [businessId, setBusinessId] = useState<BusinessId>(
    businesses[0]?.id ?? "haxr-signature"
  );
  const [eventId, setEventId] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("production");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  if (!analytics.financeExtrasEnabled) return null;

  function handleCreate() {
    const parsed = Number(amount);
    if (!description.trim() || !Number.isFinite(parsed) || parsed <= 0) return;

    const event = events.find((item) => item.id === eventId);

    startTransition(async () => {
      await createExpenseAction(
        {
          businessId,
          eventId: eventId || null,
          category,
          description,
          amount: parsed,
          currency: "MZN" as Currency,
          expenseDate,
          reference,
          notes,
        },
        event?.name
      );
      setDescription("");
      setAmount("");
      setReference("");
      setNotes("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteExpenseAction(id);
      router.refresh();
    });
  }

  return (
    <section className="admin-card p-6 md:p-8 space-y-6 border-red-500/10">
      <div className="flex items-start gap-3">
        <MinusCircle className="w-5 h-5 text-red-300/80 shrink-0 mt-0.5" />
        <div>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
            Despesas operacionais
          </p>
          <h3 className="font-serif text-xl font-light text-white/90">
            Saídas e custos de produção
          </h3>
          <p className="text-sm text-grey/55 mt-2">
            Registe fornecedores, logística, equipa e outros custos para calcular
            a margem real do negócio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminSelect
          label="Empresa"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value as BusinessId)}
        >
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
        >
          {EXPENSE_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {EXPENSE_CATEGORY_LABELS[item]}
            </option>
          ))}
        </AdminSelect>
        <AdminInput
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: Impressão de convites"
        />
        <AdminInput
          label="Valor"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <AdminInput
          label="Data"
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
        />
        <AdminSelect
          label="Evento (opcional)"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          <option value="">Sem evento</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </AdminSelect>
        <AdminInput
          label="Referência"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>

      <AdminTextarea
        label="Notas"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending}
        className="admin-btn-secondary"
      >
        {isPending ? "A registar…" : "Registar despesa"}
      </button>

      {analytics.expenses.length > 0 ? (
        <ul className="space-y-2 pt-2">
          {analytics.expenses.slice(0, 10).map((expense) => (
            <li
              key={expense.id}
              className="flex items-center justify-between gap-3 p-3 border border-grey-dark/60"
            >
              <div className="min-w-0">
                <p className="text-sm text-white/85 truncate">
                  {expense.description}
                </p>
                <p className="text-[10px] text-grey/45 mt-1">
                  {expense.expenseDate} ·{" "}
                  {EXPENSE_CATEGORY_LABELS[expense.category]}
                  {expense.eventName ? ` · ${expense.eventName}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-serif text-base text-red-200/80">
                  -{formatCurrency(expense.amount, expense.currency)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(expense.id)}
                  className="text-grey/40 hover:text-red-300/90"
                  aria-label="Remover despesa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
