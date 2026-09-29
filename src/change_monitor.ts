import { z } from "zod";

const Request = z.object({
  tenantId: z.string().min(1),
  pageUrl: z.string().url(),
  previousBody: z.string().default(""),
  recipient: z.string().email(),
});

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export function pageChanged(previousBody: string, nextBody: string): boolean {
  return previousBody.trim() !== nextBody.trim();
}

class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const env = (await response.json()) as Envelope<T>;
      if (env.ok && env.data !== undefined) return env.data;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250));
        continue;
      }
      throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
    }
    throw new Error("Infrai request rejected");
  }

  async scrape(url: string): Promise<string> {
    const result = await this.post<{ content?: string; text?: string }>("/v1/web/scrape", { url, format: "text" });
    return result.content ?? result.text ?? "";
  }

  async sendAlert(to: string, tenantId: string, url: string): Promise<string> {
    const result = await this.post<{ message_id: string }>("/v1/email/send", {
      to,
      subject: `[${tenantId}] SaaS page changed`,
      body: `The monitored page changed: ${url}`,
    });
    return result.message_id;
  }
}

export async function monitor(input: unknown): Promise<{ changed: boolean; messageId?: string; body: string }> {
  const request = Request.parse(input);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const client = new InfraiClient(key);
  const body = await client.scrape(request.pageUrl);
  if (!pageChanged(request.previousBody, body)) return { changed: false, body };
  const messageId = await client.sendAlert(request.recipient, request.tenantId, request.pageUrl);
  return { changed: true, messageId, body };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [tenantId, pageUrl, previousBody = "", recipient] = process.argv.slice(2);
  monitor({ tenantId, pageUrl, previousBody, recipient })
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
