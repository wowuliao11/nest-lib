import { Global, Module } from '@nestjs/common';
import { NacosService } from './nacos.service';
import { NacosModuleClass } from './nacos.module-definition';
@Global()
@Module({
  providers: [NacosService],
  exports: [NacosService],
})
export class NacosModule extends NacosModuleClass {}
