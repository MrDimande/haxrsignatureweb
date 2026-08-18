import { isEditionPersistenceConfigured } from "@/lib/edition/registry";
import { getEditionRsvpEmailConfig } from "@/lib/edition/rsvp/config";
import { persistEditionRsvp } from "@/lib/edition/rsvp/persist";
import { sendEditionRsvpNotificationEmail } from "@/lib/edition/rsvp/send-notification";
import type { EditionRsvpResult, EditionRsvpSuccessPayload } from "@/lib/edition/rsvp/types";
import { validateEditionRsvpBody } from "@/lib/edition/rsvp/validate";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function processEditionRsvpSubmission(
  body: unknown,
  options?: { presentedProxySecret?: string }
): Promise<EditionRsvpResult> {
  const validated = validateEditionRsvpBody(body);

  if (!validated.ok) {
    return {
      status: 400,
      body: { success: false, error: validated.error },
    };
  }

  if (validated.honeypot) {
    return {
      status: 200,
      body: {
        success: true,
        message: "RSVP process completed (honeypot trigger).",
      },
    };
  }

  const submission = validated.submission;
  const persistenceRequired =
    isSupabaseConfigured() && isEditionPersistenceConfigured(submission.slug);

  let persistResult: Awaited<ReturnType<typeof persistEditionRsvp>> | null =
    null;

  if (persistenceRequired) {
    persistResult = await persistEditionRsvp(submission, {
      presentedProxySecret: options?.presentedProxySecret,
    });

    if (!persistResult.ok) {
      console.error("[edition/rsvp] Persist failed:", persistResult.error);
      return {
        status: 502,
        body: {
          success: false,
          error:
            "Não foi possível registar a confirmação. Tente novamente em instantes.",
        },
      };
    }
  } else if (isSupabaseConfigured()) {
    console.warn(
      `[edition/rsvp] Event ID não configurado para slug "${submission.slug}" — apenas email.`
    );
  }

  const notificationsEnabled =
    process.env.EDITION_RSVP_NOTIFICATIONS_ENABLED?.trim().toLowerCase() !== "false";

  const emailConfig = notificationsEnabled ? getEditionRsvpEmailConfig(submission.slug) : null;
  let emailResult: Awaited<
    ReturnType<typeof sendEditionRsvpNotificationEmail>
  > | null = null;

  if (emailConfig) {
    try {
      emailResult = await sendEditionRsvpNotificationEmail(
        submission,
        emailConfig
      );
    } catch (emailError) {
      console.error("[edition/rsvp] Email delivery failed:", emailError);

      if (persistResult?.ok) {
        return {
          status: 502,
          body: {
            success: false,
            error:
              "A confirmação foi registada, mas não foi possível enviar o email. Contacte a equipa HAXR.",
            persisted: true,
          },
        };
      }

      if (process.env.RESEND_API_KEY) {
        return {
          status: 502,
          body: {
            success: false,
            error:
              "Não foi possível enviar a confirmação. Tente novamente em instantes.",
          },
        };
      }
    }
  }

  const responseBody: EditionRsvpSuccessPayload = {
    success: true,
    message: "O seu RSVP foi registado com sucesso!",
    data: submission,
    persisted: Boolean(persistResult?.ok),
  };

  if (notificationsEnabled) {
    responseBody.emailSent = Boolean(emailResult?.teamSent);
    responseBody.guestEmailSent = Boolean(emailResult?.guestSent);
  }

  return {
    status: 200,
    body: responseBody,
  };
}
