import {effect, Injectable, signal, WritableSignal} from '@angular/core';

export enum Theme {
  Light = "light",
  Dark = "dark",
  Auto = "auto",
}

@Injectable({
  providedIn: 'root'
})
export class ThemeStoreService {
  public readonly theme: WritableSignal<Theme>;

  constructor() {
    this.theme = signal(Theme.Auto);
    const theme = localStorage.getItem('theme');
    switch (theme) {
      case "light":
        this.changeTheme(Theme.Light)
        break;
      case "dark":
        this.changeTheme(Theme.Dark)
        break;
      default:
        this.changeTheme(Theme.Auto)
    }

    effect(() => {
      const theme = this.theme();
      let darkMode = theme === Theme.Dark;

      if (theme === Theme.Auto) {
        darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      this.setDarkMode(darkMode);
    });

    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (event) => {
        const currentTheme = this.theme();
        if (currentTheme === Theme.Auto) {
          const darkMode = event.matches;
          this.setDarkMode(darkMode);
        }
      });
  }

  changeTheme(theme: Theme) {
    this.theme.set(theme);
    localStorage.setItem('theme', theme);
  }

  setDarkMode(darkMode: boolean) {
    const htmlElement = document.querySelector('html')!;
    if (darkMode) {
      htmlElement.setAttribute('data-bs-theme', 'dark');
    } else {
      htmlElement.removeAttribute('data-bs-theme');
    }
  }
}
