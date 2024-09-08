"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NacosModule = void 0;
const common_1 = require("@nestjs/common");
const nacos_service_1 = require("./nacos.service");
const nacos_module_definition_1 = require("./nacos.module-definition");
let NacosModule = class NacosModule extends nacos_module_definition_1.NacosModuleClass {
};
exports.NacosModule = NacosModule;
exports.NacosModule = NacosModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [nacos_service_1.NacosService],
        exports: [nacos_service_1.NacosService],
    })
], NacosModule);
//# sourceMappingURL=nacos.module.js.map