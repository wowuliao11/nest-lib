import { ConfigurableModuleBuilder } from '@nestjs/common';
import { NacosModuleOptions } from './nacos.interface';

export const {
  ConfigurableModuleClass: NacosModuleClass,
  MODULE_OPTIONS_TOKEN: NacosModuleOptionsToken,
} = new ConfigurableModuleBuilder<NacosModuleOptions>().build();
