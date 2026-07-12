export type EditionRsvpSubmission = {
  name: string;
  attending: boolean;
  guests: number;
  slug: string;
  email?: string;
  phone?: string;
  messageForBride?: string;
  size?: string;
  dressCodeConfirmed?: boolean;
};

export type EditionRsvpSuccessPayload = {
  success: true;
  message: string;
  data: EditionRsvpSubmission;
  persisted: boolean;
  emailSent?: boolean;
  guestEmailSent?: boolean;
};

export type EditionRsvpErrorPayload = {
  success: false;
  error: string;
  persisted?: boolean;
};

export type EditionRsvpResult =
  | { status: 200; body: EditionRsvpSuccessPayload | { success: true; message: string } }
  | { status: 400; body: EditionRsvpErrorPayload }
  | { status: 429; body: EditionRsvpErrorPayload; retryAfterSeconds: number }
  | { status: 500; body: EditionRsvpErrorPayload }
  | { status: 502; body: EditionRsvpErrorPayload };
