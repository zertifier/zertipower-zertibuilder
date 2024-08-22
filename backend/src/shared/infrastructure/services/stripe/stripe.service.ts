import {Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma-service";
import {BlockchainService} from "../blockchain-service";

@Injectable()
export class StripeService {

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService
  ) {
  }

  postEvent(signature: string, payload: any) {
    let stripeObject;
    // Handle the event
    switch (payload.type) {
      case 'checkout.session.completed':
        stripeObject = payload.data.object;


        this.createOrder(stripeObject.id, stripeObject.metadata.walletAddress, stripeObject.metadata.qty)
        try {
          // this.blockchainService.mintEkw()
          //MINT

        } catch (e) {
          console.log(e)
        }


        // updateOrderStatus(stripeObject.payment_link, 'accepted')


        console.log('CHECKOUT COMPLETED', payload)
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
    }
  }


  updateOrderStatus(){

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
