"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NacosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NacosService = void 0;
const common_1 = require("@nestjs/common");
const nacos_1 = require("nacos");
const os_1 = require("os");
const nacos_module_definition_1 = require("./nacos.module-definition");
const util_1 = require("./util/util");
let NacosService = NacosService_1 = class NacosService {
    constructor(initOptions) {
        var _a, _b;
        this.initOptions = initOptions;
        this.logger = new common_1.Logger(NacosService_1.name);
        this.listenerSet = new Set();
        this.configMap = new Map();
        this.defaultGroup = (_a = initOptions.defaultGroup) !== null && _a !== void 0 ? _a : "DEFAULT_GROUP";
        this.host = initOptions.host;
        this.port = initOptions.port;
        this.namespace = initOptions.namespace;
        this.accessKey = initOptions.accessKey;
        this.secretKey = initOptions.secretKey;
        this.ssl = (_b = initOptions.ssl) !== null && _b !== void 0 ? _b : false;
        if ((0, util_1.isEmpty)(this.host))
            throw new Error("nacos server must not be null!");
        if ((0, util_1.isEmpty)(this.namespace))
            throw new Error("nacos namespace must not be null!");
        if ((0, util_1.isEmpty)(this.accessKey))
            throw new Error("nacos accessKey must not be null!");
        if ((0, util_1.isEmpty)(this.secretKey))
            throw new Error("nacos secretKey must not be null!");
        const options = {
            serverAddr: this.host,
            serverPort: this.port,
            namespace: this.namespace,
            accessKey: this.accessKey,
            secretKey: this.secretKey,
            ssl: this.ssl,
        };
        if (/^http/.test(this.host)) {
            // http格式转化成hostname
            const url = new URL(this.host);
            options.serverAddr = url.host;
        }
        this.configClient = new nacos_1.NacosConfigClient(options);
    }
    async getJsonConfig(key, group = this.defaultGroup, initFunc) {
        if (this.configMap.has(`${group}-${key}`)) {
            return (0, util_1.safeParseJson)(this.configMap.get(`${group}-${key}`));
        }
        else {
            await this.loadConfig(key, group, initFunc, true);
            return (0, util_1.safeParseJson)(this.configMap.get(`${group}-${key}`));
        }
    }
    async deleteConfig(dataId, group = this.defaultGroup) {
        await this.configClient.remove(dataId, group);
        this.configMap.delete(`${group}-${dataId}`);
    }
    async setJsonConfig(dataId, content, group = this.defaultGroup) {
        this.configMap.set(`${group}-${dataId}`, content);
        await this.configClient.publishSingle(dataId, group, JSON.stringify(content));
    }
    async getConfig(key, group = this.defaultGroup) {
        if (this.configMap.has(`${group}-${key}`)) {
            return this.configMap.get(`${group}-${key}`);
        }
        else {
            await this.loadConfig(key, group);
            return this.configMap.get(`${group}-${key}`);
        }
    }
    async loadConfig(dataId, group, initFunc, isJson) {
        const content = await this.configClient.getConfig(dataId, group);
        if ((0, util_1.isEmpty)(content))
            return undefined;
        if (initFunc === undefined)
            return content;
        this.callInitFunc(content, initFunc, isJson);
        this.listenerSet.add({ dataId, group });
        this.configClient.subscribe({ dataId, group }, (content) => {
            this.logger.log({
                title: "nacos config changed",
                dataId,
                group,
                newValue: content,
                oldValue: this.configMap.get(`${group}-${dataId}`),
            });
            this.callInitFunc(content, initFunc, isJson);
            this.setConfig(`${group}-${dataId}`, content);
        });
        this.setConfig(`${group}-${dataId}`, content);
        return content;
    }
    callInitFunc(content, initFunc, isJson) {
        if (!(0, util_1.isEmpty)(initFunc)) {
            initFunc(isJson ? (0, util_1.safeParseJson)(content) : content);
        }
    }
    setConfig(key, content) {
        this.configMap.set(`${key}`, content);
        this.logger.log({
            title: "nacos config loaded",
            dataId: key,
            group: this.defaultGroup,
            newValue: content,
        });
    }
    async getNamingClient() {
        if (this.namingClient) {
            return this.namingClient;
        }
        const options = {
            serverList: this.host,
            namespace: this.namespace,
            logger: console,
        };
        if (/^http/.test(options.serverList)) {
            // http格式转化成hostname
            const url = new URL(this.host);
            options.serverList = url.host;
        }
        this.namingClient = new nacos_1.NacosNamingClient(options);
        await this.namingClient.ready();
        return this.namingClient;
    }
    async onModuleDestroy() {
        var _a;
        await ((_a = this.namingClient) === null || _a === void 0 ? void 0 : _a.close());
        this.logger.log("nacos closed");
    }
    /**
     * @param name 应用名称
     * @param enable 是否注册，开发环境默认不注册
     * */
    async register(name, enable = false) {
        var _a;
        if (!enable) {
            return false;
        }
        const networks = (0, os_1.networkInterfaces)();
        const [ip] = Object.values(networks)
            .flat()
            .filter((x) => (x === null || x === void 0 ? void 0 : x.family) === "IPv4" && !x.internal)
            .map((x) => x === null || x === void 0 ? void 0 : x.address);
        if ((0, util_1.isEmpty)(ip))
            throw new Error("ip must not be null!");
        const port = Number((_a = (await this.getConfig("port", "order"))) !== null && _a !== void 0 ? _a : 3000);
        const client = await this.getNamingClient();
        await client.registerInstance(name, {
            ip: ip,
            port: port,
            healthy: true,
            enabled: true,
            instanceId: `${ip}:${port}`,
        });
        this.logger.log("nacos register");
        return true;
    }
    async configUnregister() {
        for (const listener of this.listenerSet) {
            await this.configClient.unsubscribe(listener);
        }
        await this, this.configClient.close();
    }
};
exports.NacosService = NacosService;
exports.NacosService = NacosService = NacosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nacos_module_definition_1.NacosModuleOptionsToken)),
    __metadata("design:paramtypes", [Object])
], NacosService);
//# sourceMappingURL=nacos.service.js.map