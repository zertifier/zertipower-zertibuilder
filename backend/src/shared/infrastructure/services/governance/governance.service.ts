import { Injectable } from '@nestjs/common';
import { PrismaService } from "../prisma-service";
import { notificationCodes, NotificationsService } from '../notifications-service';

interface ExpiredProposal {
  id: number;
  vote: number | null;
  count: number;
  communityId: number;
  proposal: string;
  proposalType: 'equal' | 'weighted';
  proposalQuorum: number;
}

interface OptionVote {
  optionId: number;
  votes: number;
  userVotes: number;
}

interface CommunityMembersNumber {
  membersNumber: number;
}

interface ProposalOption {
  id: number;
  option: string;
}

export type ProposalStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'EXECUTED' | 'DENIED';

@Injectable()
export class GovernanceService {

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {
    this.updateExpiredProposalsStatus()
  }

  async updateExpiredProposalsStatus() {

    //Select proposals about to expire without result:
    let expiredProposals: ExpiredProposal[];

    try {
      expiredProposals = await this.prisma.$queryRaw<ExpiredProposal[]>`
    SELECT id, community_id as communityId, proposal as proposal, type as proposalType, quorum as proposalQuorum
    FROM proposals
    WHERE expiration_dt < CURRENT_DATE
    AND result_option_id IS NULL
    AND status != 'EXPIRED'
    AND status != 'DENIED'
    `
    } catch (error) {
      console.log("updateExpiredProposalsStatus error", error)
      return;
    }

    if (!expiredProposals.length) {
      return;
    }

    for (let expiredProposal of expiredProposals) {

      try {

        const proposalId = expiredProposal.id;
        const communityId = expiredProposal.communityId
        const proposalName = expiredProposal.proposal;
        const proposalType = expiredProposal.proposalType;
        const proposalQuorum = expiredProposal.proposalQuorum;
        let optionVotes: OptionVote[] = [];
        let proposalOptions: ProposalOption[] = [];
        let membersNumber: number = 0;
        let numberOfVotes: number = 0;
        let greatVotesNumberOptionId: number | null = null;
        let proposalStatus: ProposalStatus = 'EXPIRED';
        let winnerProposalOption: string = '';

        const communityMembersNumber = await this.prisma.$queryRaw<CommunityMembersNumber[]>`
          SELECT COUNT(DISTINCT customers.id) as membersNumber
          FROM customers
          LEFT JOIN cups
          ON cups.customer_id = customers.id
          WHERE cups.community_id = ${communityId};`

        membersNumber = communityMembersNumber[0].membersNumber;

        //todo: different calculate if proposal type is weighted or equal ¿?

        if (proposalType != 'equal' && proposalType != 'weighted') {
          console.log("Error on proposal type: neither equal nor weighted")
          continue; // Skip to the next iteration
        }

        //Calculate winner option 

        optionVotes = await this.prisma.$queryRaw<OptionVote[]>`
          SELECT option_id as optionId, SUM(vote_value) AS votes , COUNT(user_id) AS userVotes 
          FROM votes 
          WHERE proposal_id = ${proposalId} 
          GROUP BY option_id
          `

        let maxVotes = -1;

        for (let optionVote of optionVotes) {
          numberOfVotes += Number(optionVote.userVotes);
          if (optionVote.votes > maxVotes) {
            maxVotes = optionVote.votes;
            greatVotesNumberOptionId = optionVote.optionId;
          }
        }

        //determine whether the vote has reached the required quorum:

        if ((Number(numberOfVotes) / Number(membersNumber)) >= proposalQuorum) {

          proposalStatus = 'EXPIRED';

          await this.prisma.$queryRaw`
            UPDATE proposals
            SET status = ${proposalStatus},  
            result_option_id = ${greatVotesNumberOptionId}
            WHERE id = ${proposalId}
            AND expiration_dt < CURRENT_DATE 
            AND (status = 'ACTIVE' OR status = 'PENDING');`

          proposalOptions = await this.prisma.$queryRaw<ProposalOption[]>`
            SELECT id, option FROM proposals_options WHERE proposal_id = ${proposalId} AND id = ${greatVotesNumberOptionId}
          `

        } else {

          //The request hasn't reached the required quorum

          proposalStatus = 'DENIED';
          greatVotesNumberOptionId = null;

          await this.prisma.$queryRaw`
            UPDATE proposals
            SET status = ${proposalStatus}
            WHERE 
            id = ${proposalId} AND
            expiration_dt < CURRENT_DATE 
            AND (status = 'ACTIVE' OR status = 'PENDING')`;
        }

        let notificationText = ''

        if (greatVotesNumberOptionId && proposalOptions.length) {
          winnerProposalOption = proposalOptions[0].option;
          notificationText = `The proposal is ${proposalStatus}. ${numberOfVotes} votes from ${membersNumber} members. Result is ${winnerProposalOption}`;
        } else {
          notificationText = `The proposal is ${proposalStatus}. ${numberOfVotes} votes from ${membersNumber} members.`;
        }

        const notificationSubject = this.notificationsService.getNotificationSubject(notificationCodes.proposalExpired, this.notificationsService.defaultNotificationLang, { proposalName })
        await this.notificationsService.sendCommunityNotification(communityId, notificationCodes.proposalExpired, notificationSubject, notificationText)

      } catch (error) {
        console.log("updateExpiredProposalsStatus error", error);
        continue;
      }

    }
  }
}

//todo: update result_option_id : depends on votes and votes type (equal or weightened)

// await this.prisma.$queryRaw`
//     UPDATE proposals
//     SET status = 'EXPIRED'
//     WHERE expiration_dt < CURRENT_DATE AND (status = 'ACTIVE' OR status = 'PENDING');`

/*const [data, updatedData]: [any, any] = await this.prisma.$transaction([
  this.prisma.$queryRaw`
    SELECT pr.*
    FROM proposals pr
    LEFT JOIN votes ON proposal_id = pr.id
    WHERE expiration_dt < CURRENT_DATE AND result_option_id IS NULL`,

  this.prisma.$queryRaw`
    UPDATE proposals
    SET status = 'EXPIRED'
    WHERE expiration_dt < CURRENT_DATE;`,
])*/

/*const proposals = await this.prisma.$queryRaw`
SELECT pr.id, votes.option_id as vote, COUNT(option_id) count
FROM proposals pr
  LEFT JOIN votes ON proposal_id = pr.id
WHERE expiration_dt < CURRENT_DATE
AND result_option_id IS NULL
AND votes.id IS NOT NULL
GROUP BY option_id
ORDER BY count DESC LIMIT 1
`*/

// const expiredProposals = await this.prisma.$queryRaw<ExpiredProposal[]>`
//   SELECT pr.id, votes.option_id as vote, SUM(vote_value) count, pr.community_id as communityId, pr.proposal as proposal
//   FROM proposals pr
//          LEFT JOIN votes ON proposal_id = pr.id
//   WHERE expiration_dt < CURRENT_DATE
//     AND result_option_id IS NULL
//   GROUP BY option_id
//   ORDER BY count DESC LIMIT 1
// `
