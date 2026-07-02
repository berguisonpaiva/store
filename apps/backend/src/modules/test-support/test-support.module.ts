import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { TestSupportController } from './test-support.controller';

@Module({
  imports: [DbModule],
  controllers: [TestSupportController],
})
export class TestSupportModule {}
