import { environment } from "../../../../environments/environment";

export const web3Enabled: () => boolean = () => environment.web3;
export const web2Enabled: () => boolean = () => environment.web2;
