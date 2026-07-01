import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

/// Query params for the category listing: optional active-state filter.
export class ListCategoriesQueryDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  // Read the RAW value from `obj` — `enableImplicitConversion` would otherwise
  // coerce 'false' to `Boolean('false') === true` before this transform runs.
  @Transform(({ obj, key }) => {
    const raw = obj?.[key];
    if (raw === true || raw === 'true') return true;
    if (raw === false || raw === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  active?: boolean;
}
