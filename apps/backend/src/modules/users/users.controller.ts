import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ActivateUser,
  ChangePassword,
  CreateUser,
  DeactivateUser,
  FindUserById,
  ListUsers,
  UpdateUser,
  UserRole,
} from '@repo/auth';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Papeis } from '../../shared/decorators/papeis.decorator';
import { JwtGuard } from '../../shared/auth/jwt.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { unwrap } from '../../shared/errors/domain-error.mapper';
import { CreateUserHttpDto } from './dto/create-user.http.dto';
import { UpdateUserHttpDto } from './dto/update-user.http.dto';
import { ChangePasswordHttpDto } from './dto/change-password.http.dto';
import { ListUsersQueryDto } from './dto/list-users.query.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUser,
    private readonly updateUser: UpdateUser,
    private readonly activateUser: ActivateUser,
    private readonly deactivateUser: DeactivateUser,
    private readonly changePassword: ChangePassword,
    private readonly findUserById: FindUserById,
    private readonly listUsers: ListUsers,
  ) {}

  @Post()
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a staff user (MASTER/ADMIN only)' })
  async create(
    @CurrentUser('role') actorRole: UserRole,
    @Body() dto: CreateUserHttpDto,
  ) {
    return unwrap(
      await this.createUser.execute({
        actorRole,
        name: dto.name,
        email: dto.email,
        password: dto.password,
        role: dto.role,
        active: dto.active,
      }),
    );
  }

  @Patch(':id')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Edit a user (MASTER/ADMIN only)' })
  async update(
    @CurrentUser('role') actorRole: UserRole,
    @Param('id') id: string,
    @Body() dto: UpdateUserHttpDto,
  ) {
    return unwrap(
      await this.updateUser.execute({
        actorRole,
        id,
        name: dto.name,
        email: dto.email,
        role: dto.role,
      }),
    );
  }

  @Patch(':id/activate')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a user (MASTER/ADMIN only)' })
  async activate(
    @CurrentUser('role') actorRole: UserRole,
    @Param('id') id: string,
  ) {
    return unwrap(await this.activateUser.execute({ actorRole, id }));
  }

  @Patch(':id/deactivate')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a user (blocks the last active MASTER)' })
  async deactivate(
    @CurrentUser('role') actorRole: UserRole,
    @Param('id') id: string,
  ) {
    return unwrap(await this.deactivateUser.execute({ actorRole, id }));
  }

  @Patch(':id/password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Change your own password' })
  async password(
    @CurrentUser('id') currentUserId: string,
    @Param('id') id: string,
    @Body() dto: ChangePasswordHttpDto,
  ) {
    if (id !== currentUserId) {
      throw new ForbiddenException('OPERATION_NOT_ALLOWED_FOR_ROLE');
    }
    unwrap(
      await this.changePassword.execute({
        id,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
      }),
    );
  }

  @Get()
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List users (paginated, filter by role/active)' })
  async list(@Query() query: ListUsersQueryDto) {
    return unwrap(
      await this.listUsers.execute({
        page: query.page,
        pageSize: query.pageSize,
        role: query.role,
        active: query.active,
      }),
    );
  }

  @Get(':id')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Fetch a user by id' })
  async findById(@Param('id') id: string) {
    return unwrap(await this.findUserById.execute({ id }));
  }
}
