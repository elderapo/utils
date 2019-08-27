import { Deferred } from "ts-deferred";
import { sleep } from "../timers";

let apiKey: string | null = null;
let captchaContainer: HTMLDivElement | null = null;

export const initInvisibleReCaptcha = (_apiKey: string): void => {
  apiKey = _apiKey;

  if (!captchaContainer) {
    captchaContainer = document.createElement("div");
    captchaContainer.style.zIndex = "99999";
    captchaContainer.style.position = "absolute";
    document.body.appendChild(captchaContainer);
  }
};

export class InvisibleReCaptcha {
  private container: HTMLDivElement;
  private widgetId: number | null = null;

  private getTokenDeferred: Deferred<string> | null = null;

  constructor() {
    if (!apiKey) {
      throw new Error("Init recaptcha fist...");
    }

    void this.init();
  }

  private async getGrecaptcha() {
    const { grecaptcha } = window as any;

    while (!grecaptcha || !grecaptcha.render) {
      await sleep(100);
    }

    return grecaptcha;
  }

  private async init() {
    if (!captchaContainer) {
      return;
    }

    this.container = document.createElement("div");
    captchaContainer.appendChild(this.container);

    const grecaptcha = await this.getGrecaptcha();

    this.widgetId = grecaptcha.render(this.container, {
      sitekey: apiKey,
      size: "invisible",
      badge: "bottomright",
      callback: (response: any) => {
        if (this.getTokenDeferred) {
          this.getTokenDeferred.resolve(response);
        }
      },
      "error-callback": (err: Error) => {
        if (this.getTokenDeferred) {
          this.getTokenDeferred.reject(err);
        }
      }
    });
  }

  public delete(): void {
    if (captchaContainer) {
      captchaContainer.removeChild(this.container);
    }
  }

  public async getToken(): Promise<string> {
    const grecaptcha = await this.getGrecaptcha();

    if (this.getTokenDeferred) {
      throw new Error("Already in progress...");
    }

    try {
      if (grecaptcha.getResponse(this.widgetId) !== "") {
        await grecaptcha.reset(this.widgetId);
      }

      this.getTokenDeferred = new Deferred<string>();
      grecaptcha.execute(this.widgetId);
      const result = await this.getTokenDeferred.promise;
      return result;
    } catch (ex) {
      throw ex;
    } finally {
      this.getTokenDeferred = null;
    }
  }
}
