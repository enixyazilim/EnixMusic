import { BrowserView, ipcMain } from "electron";
import fs from "fs";
import Conf from "conf";

import IIntegration from "../integration";
import { StoreSchema } from "~shared/store/schema";
import { Unsubscribe } from "conf/dist/source/types";

export default class CustomCSS implements IIntegration {
  private enixmView: BrowserView;
  private store: Conf<StoreSchema>;
  private isEnabled = false;
  private hasInjectedOnce = false;

  private customCSSKey: string | null = null;
  private storeListener: Unsubscribe | null = null;
  private ipcListener: () => void | null = null;

  private currentWatcher: fs.FSWatcher | null = null;

  public provide(store: Conf<StoreSchema>, enixmView: BrowserView): void {
    let enixmViewChanged = false;
    if (enixmView !== this.enixmView) {
      enixmViewChanged = true;
    }

    this.enixmView = enixmView;
    this.store = store;

    if (enixmViewChanged) {
      this.customCSSKey = null;
    }

    if ((this.isEnabled && !this.hasInjectedOnce) || (this.isEnabled && enixmViewChanged)) {
      this.enable();
    }
  }

  public enable(): void {
    this.isEnabled = true;
    if (this.enixmView === null || this.customCSSKey) return;

    this.injectCSS();

    // Listen to updates to the custom CSS file
    if (this.storeListener) {
      this.storeListener();
      this.storeListener = null;
    }
    this.storeListener = this.store.onDidChange("appearance", (oldState, newState) => {
      if (newState.customCSSEnabled && oldState.customCSSPath != newState.customCSSPath) {
        this.updateCSS();
      }
    });
  }

  public disable(): void {
    this.removeCSS();
    this.isEnabled = false;
    this.hasInjectedOnce = false;

    if (this.currentWatcher) {
      this.currentWatcher.close();
      this.currentWatcher = null;
    }

    if (this.storeListener) {
      this.storeListener();
      this.storeListener = null;
    }

    if (this.ipcListener) {
      ipcMain.removeListener("enixmView:loaded", this.ipcListener);
      this.ipcListener = null;
    }
  }

  public getYTMScripts(): { name: string; script: string }[] {
    return [];
  }

  public updateCSS(): void {
    if (this.isEnabled) {
      this.removeCSS();
      this.injectCSS();
    }
  }

  // --------------------------------------------------

  private injectCSS() {
    if (!this.enixmView) {
      return;
    }
    this.hasInjectedOnce = true;

    const cssPath: string | null = this.store.get("appearance.customCSSPath");
    if (cssPath && fs.existsSync(cssPath)) {
      const content: string = fs.readFileSync(cssPath, "utf8");

      /* To do in the future...
        Have an alternative means of checking if YTM has loaded
        as I'd rather keep away from constantly having an event for if `enixmView:loaded` is emitted
        and only needed for the initial load of the app */
      if (this.ipcListener) {
        ipcMain.removeListener("enixmView:loaded", this.ipcListener);
      }
      this.ipcListener = () => {
        this.enixmView.webContents.insertCSS(content).then(customCssRef => {
          this.customCSSKey = customCssRef;
        });
      };
      ipcMain.once("enixmView:loaded", this.ipcListener);

      this.enixmView.webContents.insertCSS(content).then(customCssRef => {
        this.refitYTMPopups();
        this.customCSSKey = customCssRef;
      });

      this.watchCSSFile(cssPath);
    }
  }

  private async removeCSS() {
    if (this.customCSSKey === null || !this.enixmView) return;

    await this.enixmView.webContents.removeInsertedCSS(this.customCSSKey);
    this.customCSSKey = null;
    this.refitYTMPopups();
  }

  private async watchCSSFile(newFile?: string) {
    // Reset the file listener if it exists
    if (this.currentWatcher) {
      this.currentWatcher.close();
      this.currentWatcher = null;
    }

    if (newFile === null) return;

    // Watch for changes to the custom CSS file
    // and update the CSS when it changes
    this.currentWatcher = fs.watch(newFile, {}, (type, filename) => {
      if (type === "change") {
        this.updateCSS();
      } else if (type === "rename") {
        if (filename) {
          this.store.set("appearance.customCSSPath", null);
          this.removeCSS();
          this.currentWatcher.close();
        }
      }
    });
  }

  private async refitYTMPopups() {
    if (this.enixmView) {
      this.enixmView.webContents.send("enixmView:refitPopups");
    }
  }
}
