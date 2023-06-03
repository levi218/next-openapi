import { TryBtnConfigConfig } from '../config/try-btn-config';
import { RedocWrapper } from '../wrappers/redoc.wrapper';
import { SwaggerWrapper } from '../wrappers/swagger.wrapper';

declare let $: any;

const tryClickHandler = (event: Event) => {
  event.stopPropagation();
  const $tryBtn = $(event.target);
  const shouldOpen = !TryBtn.isSelected($tryBtn);
  TryBtn.unselectAll();
  if (shouldOpen) {
    TryBtn.select($tryBtn);
  }
};

export class TryBtn {
  public static cfg: TryBtnConfigConfig;

  private static get $sibling() {
    return $(`${TryBtn.cfg.siblingSelector}`);
  }

  public static isSelected($btn): boolean {
    return $btn.hasClass(TryBtn.cfg.selectedClassName);
  }

  public static unselectAll(): void {
    SwaggerWrapper.hide();
    RedocWrapper.hide();
    $(TryBtn.cfg.selector).removeClass(TryBtn.cfg.selectedClassName);
  }

  public static select($btn): void {
    $btn.addClass(TryBtn.cfg.selectedClassName);
    RedocWrapper.configureTryBox();

    const { api, method } = RedocWrapper.getCurrentApiInfo();
    SwaggerWrapper.selectApiSection(api, method);

    RedocWrapper.$tryItBoxContainer.append(SwaggerWrapper.$box);
    SwaggerWrapper.show();
    RedocWrapper.fixScrollPosition();
  }

  public static get $selected() {
    return $(`${TryBtn.cfg.selectedSelector}`);
  }

  public static get $btn() {
    return $(`.${TryBtn.cfg.className}`);
  }

  public static init(): void {
    const $tryBtn = $(
      `<button class="${TryBtn.cfg.className}">${TryBtn.cfg.text}</button>`
    );
    $tryBtn.click(tryClickHandler);
    TryBtn.$sibling.after($tryBtn);
  }
}
