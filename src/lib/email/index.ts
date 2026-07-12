/**
 * Módulo de email HAXR — marketing outbound Brevo.
 *
 * Separação:
 * - Marketing: src/lib/email/marketing/*
 * - Transaccional funil: src/lib/brevo/* + transactional/*
 * - Contacto formulário: Resend (src/lib/contact/emails.ts)
 * - Concierge inbound: futuro concierge@haxrsignature.com (não misturar)
 */

export * from "@/lib/email/email-config";
export * from "@/lib/email/email-types";
export * from "@/lib/email/brevo-client";
export * from "@/lib/email/email-renderer";

export * from "@/lib/email/marketing/marketing-service";
export * from "@/lib/email/marketing/marketing-templates";
export * from "@/lib/email/marketing/marketing-campaigns";
export * from "@/lib/email/marketing/marketing-lists";
export * from "@/lib/email/marketing/marketing-segments";
export * from "@/lib/email/marketing/marketing-audit";

export * from "@/lib/email/transactional/transactional-service";
