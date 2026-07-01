import { Result, UseCase } from '@repo/shared'
import { UserRepository } from '../provider'

export interface DeleteUserInput {
  id: string
}

export class DeleteUser
  implements UseCase<DeleteUserInput, void>
{
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: DeleteUserInput): Promise<Result<void>> {
    return this.userRepository.delete(input.id)
  }
}
