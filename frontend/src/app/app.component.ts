import { Component } from "@angular/core";
import {NavigationEnd, Router} from "@angular/router";

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
})
export class AppComponent {
	title = "frontend";
  displayNavbar = false
  locationHidNav= [
    '/search',
    '/auth',
  ]

  constructor(
    private router: Router
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.displayNavbar = this.displayNav()
      }
    });
  }

  displayNav(){
    // Get the current URL pathname
    let currentPath = window.location.pathname;

    for (let i = 0; i < this.locationHidNav.length; i++) {
      if (currentPath.includes(this.locationHidNav[i])) {
        return false;
      }
    }
    return true
  }
}
