import { Injectable } from '@nestjs/common';
import { UserPredictionIntegrationService } from './user-prediction-integration.service';
import { PrismaService } from '../../../../shared/infrastructure/services/prisma-service/prisma-service';
import * as moment from 'moment-timezone';

export interface MontolivetPredictionResult {
  communityId: number;
  prediction: { time: string; value: number }[];
  individualPredictions: Array<{
    cupsId: number;
    prediction: any;
  }>;
  metadata: {
    startDate: string;
    endDate: string;
    totalInstallations: number;
    timestamp: string;
    weatherApi?: string;
    coordinates?: { lat: number | null; lng: number | null };
  };
}

@Injectable()
export class MontolivetPredictionService {
  constructor(
    private userPredictionIntegration: UserPredictionIntegrationService,
    private prisma: PrismaService,
  ) {}

  private getMontolivetCommunityId(): number {
    const communityId = process.env.MONTOLIVET_COMMUNITY_ID;
    return communityId ? parseInt(communityId) : 1; // Default to 1 if not configured
  }

  async getMontolivetPrediction(
    startDate?: string,
    endDate?: string,
  ): Promise<MontolivetPredictionResult> {
    const communityId = this.getMontolivetCommunityId();
    const defaultStartDate = moment.tz('Europe/Madrid').startOf('day').format('YYYY-MM-DD');
    const defaultEndDate = moment.tz('Europe/Madrid').add(6, 'days').format('YYYY-MM-DD');

    const predictionStartDate = startDate || defaultStartDate;
    const predictionEndDate = endDate || defaultEndDate;

    console.log(`🌤️ [MONTOLIVET] Starting prediction for community ID: ${communityId}`);
    console.log(`📅 [MONTOLIVET] Date range: ${predictionStartDate} to ${predictionEndDate}`);

    try {
      const community = await this.prisma.communities.findUnique({
        where: { id: communityId },
        select: { id: true, name: true, lat: true, lng: true },
      });

      if (!community) {
        throw new Error(`Community Montolivet (ID: ${communityId}) not found`);
      }

      console.log(`📍 [MONTOLIVET] Community found: ${community.name}`);
      console.log(`📍 [MONTOLIVET] Coordinates: ${community.lat}, ${community.lng}`);
      console.log(`🔧 [MONTOLIVET] Using Open Meteo API for weather prediction`);

      const individualPredictions = await this.userPredictionIntegration.predictProductionForCommunity(
        communityId,
        predictionStartDate,
        predictionEndDate,
      );

      console.log(`✅ [MONTOLIVET] Individual predictions completed: ${individualPredictions.length} installations`);

      const combinedPrediction = await this.userPredictionIntegration.getCombinedCommunityPrediction(
        communityId,
        predictionStartDate,
        predictionEndDate,
      );

      console.log(`✅ [MONTOLIVET] Combined prediction completed: ${combinedPrediction.length} data points`);

      return {
        communityId: communityId,
        prediction: combinedPrediction,
        individualPredictions: individualPredictions.map(p => ({
          cupsId: p.cupsId,
          prediction: p.prediction,
        })),
        metadata: {
          startDate: predictionStartDate,
          endDate: predictionEndDate,
          totalInstallations: individualPredictions.length,
          timestamp: moment().toISOString(),
          weatherApi: 'Open Meteo',
          coordinates: { lat: community.lat, lng: community.lng },
        },
      };
    } catch (error: any) {
      console.error(`❌ [MONTOLIVET] Error getting prediction:`, error.message);
      throw new Error(`Failed to get Montolivet prediction: ${error.message}`);
    }
  }

  async getMontolivetInstallations() {
    const communityId = this.getMontolivetCommunityId();
    const cups = await this.prisma.cups.findMany({
      where: {
        communityId: communityId,
        type: 'community',
      },
      select: {
        id: true,
        cups: true,
        lat: true,
        lng: true,
        active: true,
      },
    });

    return {
      communityId: communityId,
      installations: cups,
      totalInstallations: cups.length,
      activeInstallations: cups.filter(c => c.active).length,
    };
  }

  async getMontolivetHistoricalData(
    startDate: string,
    endDate: string,
  ) {
    const communityId = this.getMontolivetCommunityId();
    const cups = await this.prisma.cups.findMany({
      where: {
        communityId: communityId,
        type: 'community',
      },
      select: {
        id: true,
        cups: true,
      },
    });

    const historicalData = await Promise.all(
      cups.map(async (cupsItem) => {
        const energyData = await this.prisma.energyHourly.findMany({
          where: {
            cupsId: cupsItem.id,
            infoDt: {
              gte: moment(startDate).startOf('day').toDate(),
              lte: moment(endDate).endOf('day').toDate(),
            },
            production: { not: null },
          },
          select: {
            infoDt: true,
            production: true,
          },
          orderBy: { infoDt: 'asc' },
        });

        return {
          cupsId: cupsItem.id,
          cups: cupsItem.cups,
          data: energyData.map(record => ({
            timestamp: record.infoDt?.toISOString() || '',
            production: record.production || 0,
          })),
        };
      }),
    );

    return {
      communityId: communityId,
      startDate,
      endDate,
      historicalData,
    };
  }
}