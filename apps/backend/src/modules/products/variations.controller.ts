import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ActivateVariation,
  AddVariation,
  DeactivateVariation,
  FindVariationByBarcode,
  FindVariationBySku,
  UpdateVariation,
} from '@repo/catalog';
import { UserRole } from '@repo/auth';
import { JwtGuard } from '../../shared/auth/jwt.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Papeis } from '../../shared/decorators/papeis.decorator';
import { unwrap } from '../../shared/errors/domain-error.mapper';
import { CreateVariationHttpDto } from './dto/create-variation.http.dto';
import { UpdateVariationHttpDto } from './dto/update-variation.http.dto';

/// Variation endpoints. Management routes are nested under the owning product
/// (`/products/:productId/variations/...`) so the aggregate root is always in
/// the path. The PDV lookups (`by-sku`/`by-barcode`) are flat and open to any
/// authenticated staff member (incl. OPERADOR) since they run the register.
@ApiTags('variations')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller()
export class VariationsController {
  constructor(
    private readonly addVariation: AddVariation,
    private readonly updateVariation: UpdateVariation,
    private readonly activateVariation: ActivateVariation,
    private readonly deactivateVariation: DeactivateVariation,
    private readonly findVariationBySku: FindVariationBySku,
    private readonly findVariationByBarcode: FindVariationByBarcode,
  ) {}

  @Post('products/:productId/variations')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a variation to a product' })
  async add(
    @Param('productId') productId: string,
    @Body() dto: CreateVariationHttpDto,
  ) {
    return unwrap(
      await this.addVariation.execute({
        productId,
        sku: dto.sku,
        barcode: dto.barcode,
        attributes: dto.attributes,
        price: dto.price,
        minStock: dto.minStock,
        active: dto.active,
      }),
    );
  }

  @Patch('products/:productId/variations/:variationId')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Edit a variation' })
  async update(
    @Param('productId') productId: string,
    @Param('variationId') variationId: string,
    @Body() dto: UpdateVariationHttpDto,
  ) {
    return unwrap(
      await this.updateVariation.execute({
        productId,
        variationId,
        sku: dto.sku,
        barcode: dto.barcode,
        attributes: dto.attributes,
        price: dto.price,
        minStock: dto.minStock,
      }),
    );
  }

  @Patch('products/:productId/variations/:variationId/activate')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a variation' })
  async activate(
    @Param('productId') productId: string,
    @Param('variationId') variationId: string,
  ) {
    return unwrap(
      await this.activateVariation.execute({ productId, variationId }),
    );
  }

  @Patch('products/:productId/variations/:variationId/deactivate')
  @Papeis(UserRole.MASTER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a variation' })
  async deactivate(
    @Param('productId') productId: string,
    @Param('variationId') variationId: string,
  ) {
    return unwrap(
      await this.deactivateVariation.execute({ productId, variationId }),
    );
  }

  @Get('variations/by-sku/:sku')
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'PDV: look up a variation by exact SKU' })
  async bySku(@Param('sku') sku: string) {
    return unwrap(await this.findVariationBySku.execute({ sku }));
  }

  @Get('variations/by-barcode/:barcode')
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'PDV: look up a variation by exact barcode' })
  async byBarcode(@Param('barcode') barcode: string) {
    return unwrap(await this.findVariationByBarcode.execute({ barcode }));
  }
}
