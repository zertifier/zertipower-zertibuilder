import {
	AfterViewInit,
	Component,
	effect,
	EffectRef,
	HostListener,
	signal,
	ViewChild,
} from "@angular/core";
import { AuthStoreService } from "../../../services/auth-store/auth-store.service";
import {
	BreakPoints,
	ScreenService,
} from "../../../../../../core/core-services/screen/screen.service";
import { ElementRefDirective } from "../../../../../../core/core-directives/app-element-ref/element-ref.directive";
import { ethers } from "ethers";

@Component({
	selector: "app-wallet-info",
	templateUrl: "./wallet-info.component.html",
	styleUrls: ["./wallet-info.component.scss"],
})
export class WalletInfoComponent implements AfterViewInit {
	@ViewChild(ElementRefDirective, { static: false }) qrCode!: ElementRefDirective;
	readonly walletAddress = signal("");
	readonly privateKey = signal("");
	readonly qrSize = signal(0);
	readonly effects: Array<EffectRef> = [];

	constructor(private authStore: AuthStoreService, private screen: ScreenService) {
		this.effects.push(
			effect(
				() => {
					const wallet = this.authStore.ethereumSigner();
					if (!wallet) {
						return;
					}

					if (!(wallet instanceof ethers.BaseWallet)) {
						throw Error("Connected wallet is not a web wallet");
					}

					this.walletAddress.set(wallet.address);
					this.privateKey.set(wallet.privateKey);
				},
				{ allowSignalWrites: true },
			),
		);
	}

	ngAfterViewInit() {
		setTimeout(() => {
			this.qrSize.set(this.getQrSize(this.screen.getCurrentBreakPoint()));
		}, 0);
	}

	@HostListener("window:resize", ["$event"])
	onWindowResize() {
		const breakPoint = this.screen.getCurrentBreakPoint();

		// Getting width based on breakpoints
		this.qrSize.set(this.getQrSize(breakPoint));
	}

	getQrSize(breakPoint: BreakPoints) {
		switch (breakPoint) {
			case BreakPoints.LG:
			case BreakPoints.MD:
				return this.qrCode.elementRef.nativeElement.offsetWidth / 3;
			case BreakPoints.XL:
				return this.qrCode.elementRef.nativeElement.offsetWidth / 5;
			case BreakPoints.XXL:
				return this.qrCode.elementRef.nativeElement.offsetWidth / 7;
			default:
				return this.qrCode.elementRef.nativeElement.offsetWidth;
		}
	}
}
