import { OnModuleDestroy } from "@nestjs/common";
import { NacosModuleOptions } from "./nacos.interface";
export declare class NacosService implements OnModuleDestroy {
    readonly initOptions: NacosModuleOptions;
    private readonly logger;
    private namingClient;
    private configClient;
    private host;
    private port;
    private namespace;
    private accessKey;
    private secretKey;
    private ssl;
    private defaultGroup;
    configMap: Map<string, any>;
    constructor(initOptions: NacosModuleOptions);
    getJsonConfig(key: string, group?: string, initFunc?: (content: any) => void): Promise<any>;
    getConfig(key: string, group?: string): Promise<string>;
    private loadConfig;
    private callInitFunc;
    private setConfig;
    private getNamingClient;
    onModuleDestroy(): Promise<void>;
    /**
     * @param name 应用名称
     * @param enable 是否注册，开发环境默认不注册
     * */
    register(name: string, enable?: boolean): Promise<boolean>;
}
//# sourceMappingURL=nacos.service.d.ts.map