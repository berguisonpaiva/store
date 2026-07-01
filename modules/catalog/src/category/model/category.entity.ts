import { Entity, EntityProps, Result } from '@repo/shared'
import { CategoryName } from './category-name.vo'

export interface CategoryProps extends EntityProps {
  name: string
  active: boolean
}

/// Category aggregate. Name validation lives in `CategoryName`; the unique-name
/// rule is enforced by a domain specification at the use-case level, never by a
/// database constraint. There is no deletion — categories are deactivated only.
export class Category extends Entity<Category, CategoryProps> {
  private constructor(props: CategoryProps) {
    super(props)
  }

  get name(): string {
    return this.props.name
  }

  get active(): boolean {
    return this.props.active
  }

  static create(props: CategoryProps): Category {
    const result = Category.tryCreate(props)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(props: CategoryProps): Result<Category> {
    const name = CategoryName.tryCreate(props.name)
    if (name.isFailure) return name.withFail

    return Result.ok(
      new Category({
        ...props,
        name: name.instance.value,
        active: props.active ?? true,
      }),
    )
  }

  /// Renames the category (re-validated by `tryCreate`).
  rename(name: string): Result<Category> {
    return this.cloneWith({ name })
  }

  activate(): Result<Category> {
    return this.cloneWith({ active: true })
  }

  deactivate(): Result<Category> {
    return this.cloneWith({ active: false })
  }
}
