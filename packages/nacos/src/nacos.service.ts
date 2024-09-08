import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ClientOptions, NacosConfigClient, NacosNamingClient } from "nacos";
import { networkInterfaces } from "os";
import { NacosModuleOptionsToken } from "./nacos.module-definition";
import { NacosModuleOptions } from "./nacos.interface";
import { isEmpty, safeParseJson } from "./util/util";

@Injectable()
export class NacosService implements OnModuleDestroy {
  private readonly logger = new Logger(NacosService.name);
  private namingClient;
  private configClient: NacosConfigClient;
  private host: string;
  private port: number;
  private namespace: string;
  private accessKey: string;
  private secretKey: string;
  private ssl: boolean;
  private defaultGroup: string;
  configMap: Map<string, any> = new Map();

  constructor(
    @Inject(NacosModuleOptionsToken)
    readonly initOptions: NacosModuleOptions
  ) {
    this.defaultGroup = initOptions.defaultGroup ?? "DEFAULT_GROUP";
    this.host = initOptions.host;
    this.port = initOptions.port;
    this.namespace = initOptions.namespace;
    this.accessKey = initOptions.accessKey;
    this.secretKey = initOptions.secretKey;
    this.ssl = initOptions.ssl ?? false;

    if (isEmpty(this.host)) throw new Error("nacos server must not be null!");

    if (isEmpty(this.namespace))
      throw new Error("nacos namespace must not be null!");

    if (isEmpty(this.accessKey))
      throw new Error("nacos accessKey must not be null!");

    if (isEmpty(this.secretKey))
      throw new Error("nacos secretKey must not be null!");
    const options: ClientOptions = {
      serverAddr: `${this.host}:${this.port}`,
      namespace: this.namespace,
      accessKey: this.accessKey,
      secretKey: this.secretKey,
      ssl: initOptions.ssl ?? false,
    };

    if (/^http/.test(this.host)) {
      // http格式转化成hostname
      const url = new URL(this.host);
      options.serverAddr = url.host;
    }

    this.configClient = new NacosConfigClient(options);
  }

  async getJsonConfig(
    key: string,
    group = this.defaultGroup,
    initFunc?: (content: any) => void
  ): Promise<any> {
    if (this.configMap.has(`${group}-${key}`)) {
      return safeParseJson(this.configMap.get(`${group}-${key}`));
    } else {
      await this.loadConfig(key, group, initFunc, true);
      return safeParseJson(this.configMap.get(`${group}-${key}`));
    }
  }

  async getConfig(key: string, group = this.defaultGroup): Promise<string> {
    if (this.configMap.has(`${group}-${key}`)) {
      return this.configMap.get(`${group}-${key}`);
    } else {
      await this.loadConfig(key, group);
      return this.configMap.get(`${group}-${key}`);
    }
  }

  private async loadConfig(
    dataId: string,
    group: string,
    initFunc?: (content: any) => void,
    isJson?: boolean
  ): Promise<string | undefined> {
    const content = await this.configClient.getConfig(dataId, group);
    if (isEmpty(content)) return undefined;
    if (initFunc === undefined) return content;
    this.callInitFunc(content, initFunc, isJson);
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

  private callInitFunc(
    content: string,
    initFunc: (content: any) => void,
    isJson?: boolean
  ): void {
    if (!isEmpty(initFunc)) {
      initFunc(isJson ? safeParseJson(content) : content);
    }
  }

  private setConfig(key: string, content: string): void {
    this.configMap.set(`${key}`, content);
    this.logger.log({
      title: "nacos config loaded",
      dataId: key,
      group: this.defaultGroup,
      newValue: content,
    });
  }

  private async getNamingClient(): Promise<NacosNamingClient> {
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

    this.namingClient = new NacosNamingClient(options);

    await this.namingClient.ready();
    return this.namingClient;
  }

  async onModuleDestroy(): Promise<void> {
    await this.namingClient?.close();
    this.logger.log("nacos closed");
  }

  /**
   * @param name 应用名称
   * @param enable 是否注册，开发环境默认不注册
   * */
  async register(name: string, enable = false): Promise<boolean> {
    if (!enable) {
      return false;
    }

    const networks = networkInterfaces();
    const [ip] = Object.values(networks)
      .flat()
      .filter((x) => x?.family === "IPv4" && !x.internal)
      .map((x) => x?.address);

    if (isEmpty(ip)) throw new Error("ip must not be null!");
    const port = Number((await this.getConfig("port", "order")) ?? 3000);
    const client = await this.getNamingClient();
    await client.registerInstance(name, {
      ip: ip!,
      port: port,
      healthy: true,
      enabled: true,
      instanceId: `${ip}:${port}`,
    });
    this.logger.log("nacos register");

    return true;
  }
}
