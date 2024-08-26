import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param, Query, Redirect, Headers,
} from "@nestjs/common";
import {HttpResponse} from "src/shared/infrastructure/http/HttpResponse";
import {PrismaService} from "src/shared/infrastructure/services/prisma-service/prisma-service";
import {ApiTags} from "@nestjs/swagger";
import {Datatable} from "../../shared/infrastructure/services/datatable/Datatable";
import {Auth} from "../auth/infrastructure/decorators";
import {EnvironmentService} from "../../shared/infrastructure/services";
import Stripe from 'stripe'
import {StripeService} from "../../shared/infrastructure/services/stripe/stripe.service";

export const RESOURCE_NAME = "stripe";

@ApiTags(RESOURCE_NAME)
@Controller("stripe")
export class StripeController {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private datatable: Datatable,
    private environment: EnvironmentService,
    private stripeService: StripeService
    ) {
    const secretKey = this.environment.getEnv().STRIPE_SECRET_KEY;
    this.stripe = new Stripe(secretKey);
  }

  @Get()
  // @Auth(RESOURCE_NAME)
  @Redirect()
  async get(@Query() query: any) {
    const {quantity, walletAddress} = query

    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: this.environment.getEnv().STRIPE_PRICE_KEY,
          quantity,
        },
      ],
      automatic_tax: {
        enabled: true
      },
      metadata: {
        walletAddress: walletAddress,
        qty: quantity,
      },
      mode: 'payment',
      success_url: `${this.environment.getEnv().COMPTADOR_FRONTEND_URL}/user/wallet?blockchain=true&success=true&walletAddress=${walletAddress}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.environment.getEnv().COMPTADOR_FRONTEND_URL}/user/wallet?blockchain=true&success=false&walletAddress=${walletAddress}`,
    });

    // console.log(session.id)

   /* await this.prisma.stripe.create({
      data: {
        sessionId: session.id
      }
    })*/
    return {url: session.url, statusCode: 303};
  }


  @Get('session/:sessionId/status')
  async getSessionStatus(@Param('sessionId') sessionId: string) {
/*    const session = await this.stripe.checkout.sessions.retrieve(sessionId)
    console.log(session)*/

    const data = await this.prisma.stripe.findUnique({
      select: {
        mintStatus: true
      },
      where:{
        sessionId
      }
    })


    return HttpResponse.success(
      "session fetched successfully"
    ).withData(data ? data.mintStatus : 'ERROR');
  }


  @Post('webhook')
  // @Auth(RESOURCE_NAME)
  async stripeWebhook(@Headers('stripe-signature') signature: string, @Body() body: any) {

    // console.log(body)
    this.stripeService.postEvent(signature, body)


  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.id = data.id;
    mappedData.userId = data.userId | data.user_id;
    mappedData.eventId = data.eventId | data.event_id;
    mappedData.requestId = data.requestId | data.request_id;
    mappedData.amount = data.amount;
    mappedData.status = data.status;
    mappedData.createdAt = data.createdAt | data.created_at;
    return mappedData;
  }
}
