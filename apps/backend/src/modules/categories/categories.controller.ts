import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ActivateCategory,
  CreateCategory,
  DeactivateCategory,
  ListCategories,
  UpdateCategory,
} from '@repo/catalog';
import { UserRole } from '@repo/auth';
import { JwtGuard } from '../../shared/auth/jwt.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Papeis } from '../../shared/decorators/papeis.decorator';
import { unwrap } from '../../shared/errors/domain-error.mapper';
import { CreateCategoryHttpDto } from './dto/create-category.http.dto';
import { ListCategoriesQueryDto } from './dto/list-categories.query.dto';
import { UpdateCategoryHttpDto } from './dto/update-category.http.dto';

/// Category management endpoints (MASTER/ADMIN). No delete — categories are
/// deactivated only. Controllers contain no rules.
@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly createCategory: CreateCategory,
    private readonly updateCategory: UpdateCategory,
    private readonly activateCategory: ActivateCategory,
    private readonly deactivateCategory: DeactivateCategory,
    private readonly listCategories: ListCategories,
  ) {}

  @Post()
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a category' })
  async create(@Body() dto: CreateCategoryHttpDto) {
    return unwrap(
      await this.createCategory.execute({
        name: dto.name,
        active: dto.active,
      }),
    );
  }

  @Patch(':id')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Rename a category' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryHttpDto) {
    return unwrap(
      await this.updateCategory.execute({ id, name: dto.name }),
    );
  }

  @Patch(':id/activate')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a category' })
  async activate(@Param('id') id: string) {
    return unwrap(await this.activateCategory.execute({ id }));
  }

  @Patch(':id/deactivate')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a category' })
  async deactivate(@Param('id') id: string) {
    return unwrap(await this.deactivateCategory.execute({ id }));
  }

  @Get()
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List categories (optional active filter)' })
  async list(@Query() query: ListCategoriesQueryDto) {
    return unwrap(await this.listCategories.execute({ active: query.active }));
  }
}
