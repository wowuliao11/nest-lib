import { NacosModule } from "./nacos.module";
import { NacosService } from "./nacos.service";
import { Test, TestingModule } from "@nestjs/testing";

describe("Nacos Service", () => {
  let nacosService: NacosService;
  beforeAll(async () => {
    const nacosModule: TestingModule = await Test.createTestingModule({
      providers: [NacosService],
    })
      .overrideProvider(NacosService)
      .useValue(
        new NacosService({
          defaultGroup: "test",
          host: "127.0.0.1",
          port: 8848,
          namespace: "test",
          accessKey: "test",
          secretKey: "test",
          ssl: false,
        })
      )
      .compile();

    nacosService = nacosModule.get<NacosService>(NacosService);
  });

  afterAll(async () => {
    await nacosService.configUnregister();
  });

  it("should be defined", () => {
    expect(nacosService).toBeDefined();
  });

  it("should get config", async () => {
    try {
      const data = { a: 1 };
      await nacosService.setJsonConfig("test", data);
      const config = await nacosService.getJsonConfig("test");

      expect(config).toStrictEqual(data);
    } finally {
      await nacosService.deleteConfig("test");
    }
  });
});
