import { AuthBtnOptions } from '../interfaces/auth-btn-options.interface';
import { SwaggerWrapper } from '../wrappers/swagger.wrapper';
import { TryBtn } from './try.btn';

declare let $: any;

const authCloseClickHandler = () => {
  SwaggerWrapper.hideAuthModal();
};

const authClickHandler = () => {
  TryBtn.unselectAll();
  SwaggerWrapper.showAuthModal();
};

export class AuthBtn {
  public static cfg: AuthBtnOptions; // AuthBtnConfig;

  public static get $element() {
    return $(`.${AuthBtn.cfg.className}`);
  }

  public static init(): void {
    if (!SwaggerWrapper.hasAuth) {
      return;
    }
    const $authBtn = $(
      `<div class="${AuthBtn.cfg.className}">${AuthBtn.cfg.text}</div>`
    );
    $authBtn.click(authClickHandler);
    $(AuthBtn.cfg.posSelector).after($authBtn);
    SwaggerWrapper.onCloseAuthModal(authCloseClickHandler);
  }
}
