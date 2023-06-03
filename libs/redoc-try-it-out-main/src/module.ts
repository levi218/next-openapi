import { AuthBtnConfig } from './config/auth-btn-config';
import { RedocTryItOutConfig } from './config/redoc-try-it-out-config';
import { StyleMatcherConfig } from './config/style-matcher.config';
import { SwaggerConfig } from './config/swagger-config';
import { TryBtnConfigConfig } from './config/try-btn-config';
import { AuthBtn } from './elements/auth.btn';
import { TryBtn } from './elements/try.btn';
import { RedocTryItOutOptions } from './interfaces/redoc-try-it-out-options.interface';
import { Styler } from './styler';
import { loadScript } from './utils/loaders/scripts';
import { RedocWrapper } from './wrappers/redoc.wrapper';
import { SwaggerWrapper } from './wrappers/swagger.wrapper';

export class RedocTryItOut {
  private static async loadDependencies(): Promise<void> {
    await loadScript(RedocWrapper.cfg.tryItDependencies.jqueryUrl);
    return loadScript(RedocWrapper.cfg.tryItDependencies.jqueryScrollToUrl);
  }

  private static async loadAll(): Promise<void[]> {
    await RedocTryItOut.loadDependencies();
    return Promise.all([RedocWrapper.init(), SwaggerWrapper.init()]);
  }

  private static config(
    url: string,
    cfg: RedocTryItOutOptions,
    element?: HTMLElement
  ): void {
    RedocWrapper.cfg = new RedocTryItOutConfig(url, cfg, element);

    if (RedocWrapper.cfg.tryItOutEnabled) {
      SwaggerWrapper.cfg = new SwaggerConfig(
        cfg.swaggerOptions || {},
        url,
        true
      );
      AuthBtn.cfg = Object.assign(new AuthBtnConfig({}), cfg.authBtn);
      TryBtn.cfg = new TryBtnConfigConfig(cfg.tryBtn || {});
      Styler.cfg = new StyleMatcherConfig(
        cfg.stylerMatcher || {},
        SwaggerWrapper.cfg,
        RedocWrapper.cfg
      );
    }
  }

  public static async init(
    docUrl: string,
    cfg: RedocTryItOutOptions,
    element?: HTMLElement
  ): Promise<void> {
    console.log('effective');
    RedocTryItOut.config(docUrl, cfg, element);

    if (RedocWrapper.cfg.tryItOutEnabled) {
      await RedocTryItOut.loadAll();
      AuthBtn.init();
      TryBtn.init();
      Styler.init();
    } else {
      await RedocWrapper.init();
    }
  }
}
