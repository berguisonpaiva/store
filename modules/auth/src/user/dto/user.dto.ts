import { PaginatedInputDTO } from '@repo/shared'
import { User } from '../model'
import { UserRole } from '../model/user-role'

/// Public projection of a user — never exposes the password hash.
export type UserDTO = {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateUserInputDTO = {
  actorRole: UserRole
  name: string
  email: string
  password: string
  role: UserRole
  active?: boolean
}

export type UpdateUserInputDTO = {
  actorRole: UserRole
  id: string
  name?: string
  email?: string
  role?: UserRole
}

export type SetUserActiveInputDTO = {
  actorRole: UserRole
  id: string
}

export type DeactivateUserInputDTO = {
  actorRole: UserRole
  userId: string
  requesterId: string
}

export type ListUsersFilterDTO = PaginatedInputDTO & {
  role?: UserRole
  active?: boolean
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
