import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { HttpResponse } from '../../../../shared/infrastructure/http/HttpResponse';
import { PrismaService } from '../../../../shared/infrastructure/services';
import { DecodedToken } from '../../../auth/infrastructure/guards/access-token-guard/access-token-guard';
import { Token } from '../../../auth/domain/tokens/Token';
import { HttpUtils } from '../../../../shared/infrastructure/http/HttpUtils';
import { FindUsersAction } from '../../application/find-users-action/find-users-action';
import { getUsersFilterSchema } from './filter-schemas/get-user.filter-schema';
import { SaveUserDTO } from './DTOs/SaveUserDTO';
import { User } from '../../domain/User';
import { SaveUserAction } from '../../application/save-user-action/save-user-action';
import { UserIdNotDefinedError } from '../../domain/UserId/UserIdNotDefinedError';
import { ByUserIdCriteria } from '../../domain/UserId/ByUserIdCriteria';
import {
  PasswordNotEncryptedError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from '../../domain/errors';
import { FilterField } from '../../../../shared/domain/criteria/filter/FilterField';
import {
  FilterOperator,
  FilterOperators,
} from '../../../../shared/domain/criteria/filter/FilterOperator';
import { FilterValue } from '../../../../shared/domain/criteria/filter/FilterValue';
import { Filter } from '../../../../shared/domain/criteria/filter/Filter';
import { ByUsernameCriteria } from '../../domain/Username/ByUsernameCriteria';
import { Criteria } from '../../../../shared/domain/criteria/Criteria';
import { ByEmailCriteria } from '../../domain/Email/ByEmailCriteria';
import { PasswordUtils } from '../../domain/Password/PasswordUtils';
import { UserRepository } from '../../domain/UserRepository';
import { UpdateUserDTO } from './DTOs/UpdateUserDTO';
import { BadRequestError } from '../../../../shared/domain/error/common';
import { AuthTokenRepository } from '../../../auth/domain/tokens/repositories/AuthTokenRepository';
import { UserDTO } from './DTOs/UserDTO';
import { UserDTOMapper } from './DTOs/UserDTOMapper';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { QueryFilterDto } from '../../../../shared/infrastructure/http/QueryFiltersDto';
import { OnEvent } from '@nestjs/event-emitter';
import { CredentialsChangedEvent } from '../../domain/CredentialsChangedEvent';
import { Auth } from '../../../auth/infrastructure/decorators';
import { UserRole } from '../../../roles/domain/UserRole';
import { Datatable } from '../../../../shared/infrastructure/services/datatable/Datatable';

export const RESOURCE_NAME = 'users';

@Controller(RESOURCE_NAME)
@ApiTags(RESOURCE_NAME)
export class UserController {
  constructor(
    private prisma: PrismaService,
    private findUsersAction: FindUsersAction,
    private saveUserAction: SaveUserAction,
    private userRepository: UserRepository,
    private authRepository: AuthTokenRepository,
    private datatable: Datatable,
  ) {}

  @Get('/')
  @ApiOkResponse({
    description: 'Users fetched successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(HttpResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: getSchemaPath(UserDTO),
              },
            },
          },
        },
      ],
    },
  })
  async getUsers(@Query() query: QueryFilterDto) {
    const criteria = HttpUtils.parseFiltersFromQueryFilters(
      query,
      getUsersFilterSchema,
    );
    const users = await this.findUsersAction.run(criteria);
    return HttpResponse.success('Users fetched successfully').withData(
      users.map((user) => UserDTOMapper.toDto(user)),
    );
  }

  @Post('/')
  @Auth(RESOURCE_NAME)
  @ApiBearerAuth()
  @ApiExtraModels(HttpResponse, UserDTO)
  @ApiCreatedResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(HttpResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(UserDTO),
            },
          },
        },
      ],
    },
  })
  async saveUser(
    @DecodedToken() token: Token,
    @Body() body: SaveUserDTO,
  ): Promise<HttpResponse> {
    const {
      username,
      firstname,
      lastname,
      email,
      password,
      role,
      wallet_address,
    } = body;
    const user = new User({
      username,
      firstname,
      lastname,
      email,
      password,
      walletAddress: wallet_address,
      role: new UserRole({ name: role }),
    });

    const savedUser = await this.saveUserAction.run(user);
    return HttpResponse.success('User saved').withData(
      UserDTOMapper.toDto(savedUser),
    );
  }

  @Put('/:id')
  @Auth(RESOURCE_NAME)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'User updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(HttpResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(UserDTO),
            },
          },
        },
      ],
    },
  })
  async updateUser(@Body() body: UpdateUserDTO, @Param('id') id: string) {
    const {
      username,
      firstname,
      lastname,
      email,
      password,
      role,
      wallet_address,
    } = body;
    const user = new User({
      username,
      firstname,
      lastname,
      email,
      password,
      walletAddress: wallet_address,
      role: new UserRole({ name: role }),
    });
    user.withId(parseInt(id));
    if (!user.id) {
      throw new UserIdNotDefinedError();
    }

    // Check if user exist
    const users = await this.findUsersAction.run(new ByUserIdCriteria(user.id));
    if (users.length === 0) {
      throw new UserNotFoundError(`User with id ${user.id} not found`);
    }
    const currentUser = users[0];

    const notSameId = new Filter(
      new FilterField('id'),
      new FilterOperator(FilterOperators.NOT_EQUAL),
      new FilterValue(user.id),
    );

    // Creating criteria that search user by username that are not removed
    const byUsernameCriteria = new ByUsernameCriteria(user.username);
    byUsernameCriteria.filters.push(notSameId);

    // Checking if user already exist
    let fetchedUsers = await this.findUsersAction.run(byUsernameCriteria);
    if (fetchedUsers.length > 0) {
      throw new UserAlreadyExistsError(
        `User with username '${user.username}' already exists`,
      );
    }

    // Creating criteria that search user by email that are not removed
    const byEmailCriteria = new ByEmailCriteria(user.email);
    byEmailCriteria.filters.push(notSameId);

    // Checking if user already exist
    fetchedUsers = await this.findUsersAction.run(byEmailCriteria);
    if (fetchedUsers.length > 0) {
      throw new UserAlreadyExistsError(
        `User with email '${user.email}' already exists`,
      );
    }

    if (!user.password) {
      if (!currentUser.encryptedPassword) {
        throw new PasswordNotEncryptedError();
      }
      user.withEncryptedPassword(currentUser.encryptedPassword);
    } else {
      user.withEncryptedPassword(await PasswordUtils.encrypt(user.password));
    }

    const updatedUser = await this.userRepository.update(user);
    return HttpResponse.success('User updated successfully').withData(
      updatedUser.serialize(),
    );
  }

  @ApiOkResponse({
    description: 'User removed successfully',
    schema: {
      $ref: getSchemaPath(HttpResponse),
    },
  })
  @ApiBearerAuth()
  @Delete('/')
  @Auth(RESOURCE_NAME)
  async deleteUser(@Query() query: QueryFilterDto) {
    const criteria = HttpUtils.parseFiltersFromQueryFilters(
      query,
      getUsersFilterSchema,
    );
    if (!criteria.hasFilters()) {
      throw new BadRequestError('Filters are required to remove a user');
    }

    // Removing errors associated to these users
    const usersToRemove = await this.userRepository.find(criteria);
    if (!(usersToRemove.length > 0)) {
      // If there are no users then exit
      return;
    }
    // User getting user ids from fetched users
    const userIds = usersToRemove.map((user) => {
      if (!user.id) {
        throw new UserIdNotDefinedError(
          "Cannot remove user because it don't have an id",
        );
      }

      return user.id;
    });

    // Creating criteria to remove errors
    const userIdsCriteria = new Criteria([
      new Filter(
        new FilterField('user_id'),
        new FilterOperator(FilterOperators.IN),
        new FilterValue(userIds),
      ),
    ]);
    await this.authRepository.delete(userIdsCriteria);

    // Removing users
    await this.userRepository.remove(criteria);
    return HttpResponse.success('Successful operation');
  }

  @ApiCreatedResponse({
    description: 'This endpoint is for jquery datatables',
  })
  @ApiBearerAuth()
  @Post('/datatables')
  @Auth(RESOURCE_NAME)
  async usersDatatable(@Body() body: any) {
    const data = await this.datatable.getData(
      body,
      `SELECT users.id             as id,
              users.username       as username,
              users.email          as email,
              users.wallet_address as wallet_address,
              roles.name           as role
       FROM users
                LEFT JOIN roles ON roles.id = users.role_id`,
    );
    return HttpResponse.success('Datatables fetched successfully').withData(
      data,
    );
  }

  @OnEvent(CredentialsChangedEvent.NAME)
  async removeSessions(event: CredentialsChangedEvent) {
    const criteria = new Criteria([
      new Filter(
        new FilterField('user_id'),
        new FilterOperator(FilterOperators.EQUAL),
        new FilterValue(event.payload.userID),
      ),
    ]);

    await this.authRepository.delete(criteria);
  }
}
