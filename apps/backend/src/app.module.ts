import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { DbModule } from './db/db.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { TestSupportModule } from './modules/test-support/test-support.module';
import { loadEnv } from './core/config/env.config';

@Module({
  imports: [
    DbModule,
    SharedModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    SalesModule,
    ...(loadEnv().enableTestSupport ? [TestSupportModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
