import type {
  MessagingChannel,
  MessagingProvider,
  MessagingResult,
  MessagingSendInput,
} from "@/lib/messaging/types";
import { estimateSmsSegments } from "@/lib/messaging/sms/encoding";

/**
 * Mock provider para testes e Preview sem credenciais.
 * Nunca chama rede.
 */
export class MockMessagingProvider implements MessagingProvider {
  readonly id = "mock_messaging";
  private readonly results: MessagingResult[] = [];

  constructor(
    private readonly supported: MessagingChannel[] = [
      "sms_sandbox_or_test",
      "sms_production",
    ],
    private readonly behavior: "ok_dry_run" | "blocked" = "blocked"
  ) {}

  supports(channel: MessagingChannel): boolean {
    return this.supported.includes(channel);
  }

  getResults(): MessagingResult[] {
    return [...this.results];
  }

  async send(input: MessagingSendInput): Promise<MessagingResult> {
    const segments = estimateSmsSegments(input.message.body);
    const result: MessagingResult =
      this.behavior === "ok_dry_run"
        ? {
            ok: true,
            channel: input.channel,
            status: "dry_run",
            providerMessageId: `MOCK_${input.message.idempotencyKey.slice(0, 16)}`,
            dryRun: true,
            segmentEstimate: segments.segmentCount,
            costWarning: segments.costWarning ?? undefined,
          }
        : {
            ok: false,
            channel: input.channel,
            status: "blocked",
            dryRun: true,
            error: "Mock fail-closed — sem envio real.",
            segmentEstimate: segments.segmentCount,
            costWarning: segments.costWarning ?? undefined,
          };
    this.results.push(result);
    return result;
  }
}
