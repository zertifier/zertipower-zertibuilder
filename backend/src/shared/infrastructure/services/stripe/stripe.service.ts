import {Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma-service";
import {BlockchainService} from "../blockchain-service";
import { StripeMintStatus } from '@prisma/client';
import {MintSocket} from "./MintSocket";
@Injectable()
export class StripeService {

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private mintSocket: MintSocket
  ) {
  }

  async postEvent(signature: string, payload: any) {
    let stripeObject;
    switch (payload.type) {
      case 'checkout.session.completed':
        stripeObject = payload.data.object;

        await this.createOrder(stripeObject.id, stripeObject.metadata.walletAddress, stripeObject.metadata.qty)
        try {
          console.log(`Minting to ${stripeObject.metadata.walletAddress}`)
          await this.blockchainService.mintEkw(stripeObject.metadata.walletAddress, stripeObject.metadata.qty)
          await this.updateOrderStatus(stripeObject.id, 'ACCEPTED')
          this.mintSocket.emitToSession(stripeObject.id, "ACCEPTED")

        } catch (e) {
          console.log(e)
          await this.updateOrderStatus(stripeObject.id, 'ERROR')
          this.mintSocket.emitToSession(stripeObject.id, "ERROR")
        }
        break;
    }
  }


  async updateOrderStatus(sessionId: string, status: StripeMintStatus ){
    await this.prisma.stripe.update({
      data: {
        mintStatus: status
      },
      where: {
        sessionId
      }
    })
  }

  async createOrder(sessionId: string, walletAddress: string, qty: string){
    await this.prisma.stripe.create({
      data: {
        walletAddress,
        sessionId,
        qty: parseInt(qty)
      }
    })
  }

}
