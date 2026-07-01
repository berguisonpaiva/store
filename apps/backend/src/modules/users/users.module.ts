import { Module } from '@nestjs/common';
import {
  ActivateUser,
  CreateUser,
  DeactivateUser,
  FindUserById,
  ListUsers,
  UpdateUser,
} from '@repo/auth';
import { DbModule } from '../../db/db.module';
import { BcryptHashComparer } from '../../shared/crypto/bcrypt-hash-comparer';
import { BcryptHashGenerator } from '../../shared/crypto/bcrypt-hash-generator';
import { UserPrismaQuery } from './adapters/user.prisma.query';
import { UserPrismaRepository } from './adapters/user.prisma.repository';
import { UsersController } from './users.controller';

@Module({
  imports: [DbModule],
  controllers: [UsersController],
  providers: [
    UserPrismaRepository,
    UserPrismaQuery,
    BcryptHashGenerator,
    BcryptHashComparer,
    {
      provide: CreateUser,
      useFactory: (repo: UserPrismaRepository, hasher: BcryptHashGenerator) =>
        new CreateUser(repo, hasher),
      inject: [UserPrismaRepository, BcryptHashGenerator],
    },
    {
      provide: UpdateUser,
      useFactory: (repo: UserPrismaRepository) => new UpdateUser(repo),
      inject: [UserPrismaRepository],
    },
    {
      provide: ActivateUser,
      useFactory: (repo: UserPrismaRepository) => new ActivateUser(repo),
      inject: [UserPrismaRepository],
    },
    {
      provide: DeactivateUser,
      useFactory: (repo: UserPrismaRepository) => new DeactivateUser(repo),
      inject: [UserPrismaRepository],
    },
    {
      provide: FindUserById,
      useFactory: (repo: UserPrismaRepository) => new FindUserById(repo),
      inject: [UserPrismaRepository],
    },
    {
      provide: ListUsers,
      useFactory: (query: UserPrismaQuery) => new ListUsers(query),
      inject: [UserPrismaQuery],
    },
  ],
  exports: [UserPrismaRepository, BcryptHashComparer],
})
export class UsersModule {}
