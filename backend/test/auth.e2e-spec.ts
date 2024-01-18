import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AuthModule } from "../src/features/auth/auth.module";
import { ethers } from "ethers";

describe("Users", () => {
  let app: INestApplication;
  const WALLET_PRIVATE_KEY =
    "0xdb1514c80403101aa6749c7bc952c1602884b03071dee7e26c16ed6865c65a2c";
  const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("POST /auth/request-code", async () => {
    const randomCodeRegex = /\w{66}\d{13}/;
    const response = await request(app.getHttpServer())
      .post("/auth/request-code")
      .send({ wallet_address: await wallet.getAddress() })
      .set("Accept", "application/json")
      .expect(201);

    const code = response.body.data.code as string;
    expect(randomCodeRegex.test(code)).toBe(true);
  });

  it("POST /auth/login-w3", async () => {
    const walletAddress = await wallet.getAddress();
    const httpServer = app.getHttpServer();
    const jwtRegex = /^\w+\.\w+\.\w+$/;

    const response1 = await request(httpServer)
      .post("/auth/request-code")
      .send({ wallet_address: walletAddress })
      .expect(201);

    const code = response1.body.data.code as string;
    const signature = await wallet.signMessage(code);
    const response2 = await request(httpServer)
      .post("/auth/login-w3")
      .send({ wallet_address: walletAddress, signature })
      .expect(201);
    const access_token = response2.body.data.access_token as string;
    const refresh_token = response2.body.data.refresh_token as string;

    expect(jwtRegex.test(access_token)).toBe(true);
    expect(jwtRegex.test(refresh_token)).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
