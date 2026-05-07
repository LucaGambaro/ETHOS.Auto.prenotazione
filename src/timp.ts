import { config } from "./config.js";

export interface Admission {
  id: string | number;
  sessionTime: string;
  raw: any;
}

export interface Ticket {
  id: string | number;
  status: string;
}

function headers(): Record<string, string> {
  return {
    accept: "application/timp.user-app-v2",
    "accept-language": "it_IT",
    "api-access-key": config.timpApiKey,
    "api-access-token": config.timpApiToken,
    "app-platform": "web",
    "app-version": "8.15.0",
    "content-type": "application/json",
    "time-zone": "Europe/Rome",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
  };
}

/**
 * Recupera la lista di admission per una data (YYYY-MM-DD).
 * Lancia un errore con un messaggio leggibile in caso di 401 o altri errori.
 */
export async function fetchAdmissions(date: string): Promise<Admission[]> {
  const res = await fetch(
    `${config.timpBaseUrl}/activities/${config.timpActivityId}/admissions?date=${date}`,
    { headers: headers() },
  );

  if (res.status === 401) {
    throw new AuthError(
      "Token scaduto o non valido. Aggiorna TIMP_API_TOKEN nel file .env",
    );
  }
  if (!res.ok) {
    throw new Error(
      `Errore nel recupero sessioni: ${res.status}\n${await res.text()}`,
    );
  }

  const data = await res.json();
  const raw: any[] = Array.isArray(data)
    ? data
    : (data.admissions ?? data.data ?? []);

  return raw.map((a: any) => ({
    id: a.id,
    sessionTime:
      a.hours ??
      a.start_hour ??
      a.start_time ??
      a.starts_at ??
      a.time ??
      "orario sconosciuto",
    raw: a,
  }));
}

/**
 * Prenota la prima admission disponibile.
 * Restituisce null se la sessione è già prenotata, il ticket altrimenti.
 */
export async function bookAdmission(
  admission: Admission,
): Promise<{ ticketId: string | number } | null> {
  const res = await fetch(
    `${config.timpBaseUrl}/admissions/${admission.id}/tickets`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ user_details: "" }),
    },
  );

  if (res.status === 401) {
    throw new AuthError(
      "Token scaduto durante la prenotazione. Aggiorna TIMP_API_TOKEN nel file .env",
    );
  }

  if (!res.ok) {
    const body = await res.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(body);
    } catch {}

    if (
      res.status === 409 ||
      res.status === 422 ||
      parsed?.error_code === "other_ticket"
    ) {
      return null; // già prenotato
    }

    throw new Error(`Errore durante la prenotazione: ${res.status}\n${body}`);
  }

  const data = await res.json();
  const ticketId: string | number =
    data.id ?? data.ticket?.id ?? data.ticket_id ?? "sconosciuto";
  return { ticketId };
}

/** Recupera lo stato di un ticket. */
export async function fetchTicket(ticketId: string | number): Promise<Ticket> {
  const res = await fetch(`${config.timpBaseUrl}/tickets/${ticketId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    return { id: ticketId, status: "stato non verificabile" };
  }

  const data = await res.json();
  return {
    id: ticketId,
    status: data.status ?? data.state ?? "confermato",
  };
}

/** Errore specifico per problemi di autenticazione (401). */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
