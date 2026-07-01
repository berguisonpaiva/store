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
  ActivateProduct,
  CreateProduct,
  DeactivateProduct,
  FindProductById,
  ListProducts,
  UpdateProduct,
} from '@repo/catalog';
import { UserRole } from '@repo/auth';
import { JwtGuard } from '../../shared/auth/jwt.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Papeis } from '../../shared/decorators/papeis.decorator';
import { unwrap } from '../../shared/errors/domain-error.mapper';
import { CreateProductHttpDto } from './dto/create-product.http.dto';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import { UpdateProductHttpDto } from './dto/update-product.http.dto';

/// Product management endpoints (ADMIN). Controllers contain no rules —
/// they validate the HTTP shape, delegate to the domain use cases and translate
/// the `Result` via `unwrap`.
@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProduct,
    private readonly updateProduct: UpdateProduct,
    private readonly activateProduct: ActivateProduct,
    private readonly deactivateProduct: DeactivateProduct,
    private readonly listProducts: ListProducts,
    private readonly findProductById: FindProductById,
  ) {}

  @Post()
  @Papeis(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a product with at least one variation' })
  async create(@Body() dto: CreateProductHttpDto) {
    return unwrap(
      await this.createProduct.execute({
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        active: dto.active,
        variations: dto.variations.map((variation) => ({
          sku: variation.sku,
          barcode: variation.barcode,
          attributes: variation.attributes,
          price: variation.price,
          minStock: variation.minStock,
          active: variation.active,
        })),
      }),
    );
  }

  @Patch(':id')
  @Papeis(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Edit a product profile (name/description/category)',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateProductHttpDto) {
    return unwrap(
      await this.updateProduct.execute({
        id,
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
      }),
    );
  }

  @Patch(':id/activate')
  @Papeis(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a product' })
  async activate(@Param('id') id: string) {
    return unwrap(await this.activateProduct.execute({ id }));
  }

  @Patch(':id/deactivate')
  @Papeis(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a product' })
  async deactivate(@Param('id') id: string) {
    return unwrap(await this.deactivateProduct.execute({ id }));
  }

  @Get()
  @Papeis(UserRole.ADMIN)
  @ApiOperation({ summary: 'List products (paginated, name search, filters)' })
  async list(@Query() query: ListProductsQueryDto) {
    return unwrap(
      await this.listProducts.execute({
        page: query.page,
        pageSize: query.pageSize,
        name: query.name,
        categoryId: query.categoryId,
        active: query.active,
      }),
    );
  }

  @Get(':id')
  @Papeis(UserRole.ADMIN)
  @ApiOperation({ summary: 'Fetch a product by id (with its variations)' })
  async findById(@Param('id') id: string) {
    return unwrap(await this.findProductById.execute({ id }));
  }
}
