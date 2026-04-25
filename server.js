const http = require("http");

const PORT = process.env.PORT || 3000;

// 推荐在 Render 的 Environment Variables 里设置 API_KEY。
// 如果你没设置，默认密码就是 test123456。
const API_KEY = process.env.API_KEY || "test123456";

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(data, null, 2));
}

function parseUrl(req) {
  const host = req.headers.host || "localhost";
  return new URL(req.url, `https://${host}`);
}

function checkKey(url) {
  const key = url.searchParams.get("key");
  return key === API_KEY;
}

function getMockAudiStatus() {
  return {
    ok: true,
    source: "mock",
    message: "Audi status test server is running",
    updatedAt: new Date().toISOString(),
    car: {
      name: "Audi",
      plate: "测试车辆",
      vinTail: "123456"
    },
    energy: {
      type: "fuel",
      level: 62,
      rangeKm: 486
    },
    security: {
      locked: true,
      doors: {
        frontLeft: "closed",
        frontRight: "closed",
        rearLeft: "closed",
        rearRight: "closed",
        trunk: "closed"
      },
      windows: {
        frontLeft: "closed",
        frontRight: "closed",
        rearLeft: "closed",
        rearRight: "closed",
        sunroof: "closed"
      }
    },
    location: {
      lat: null,
      lng: null,
      address: "暂未接入真实位置"
    }
  };
}

async function probeAudiEndpoints() {
  const targets = [
    {
      name: "一汽奥迪登录接口",
      url: "https://audi2c.faw-vw.com/mapi/user/v1/account/login",
      method: "GET"
    },
    {
      name: "一汽奥迪车辆列表接口",
      url: "https://audi2c.faw-vw.com/mapi/vehicle/v1/vehicle/list",
      method: "GET"
    },
    {
      name: "一汽奥迪个人信息接口",
      url: "https://audi2c.faw-vw.com/capi/v1/user/mine",
      method: "GET"
    },
    {
      name: "大众 OAuth Token 接口",
      url: "https://mbboauth-1d.prd.cn.vwg-connect.cn/mbbcoauth/mobile/oauth2/v1/token",
      method: "GET"
    }
  ];

  const results = [];

  for (const target of targets) {
    const startedAt = Date.now();

    try {
      const response = await fetch(target.url, {
        method: target.method,
        headers: {
          "User-Agent": "MyAuDi/4.0 CFNetwork/1390 Darwin/22.0.0",
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      });

      const text = await response.text();

      results.push({
        name: target.name,
        url: target.url,
        ok: true,
        status: response.status,
        statusText: response.statusText,
        durationMs: Date.now() - startedAt,
        bodyPreview: text.slice(0, 300)
      });
    } catch (error) {
      results.push({
        name: target.name,
        url: target.url,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: String(error)
      });
    }
  }

  return results;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = parseUrl(req);

    if (url.pathname === "/") {
      sendJson(res, 200, {
        ok: true,
        message: "Audi status server is alive",
        routes: {
          status: "/status?key=你的密码",
          probe: "/probe?key=你的密码"
        },
        keyHint: "如果你没有在 Render 设置 API_KEY，默认 key 是 test123456。",
        time: new Date().toISOString()
      });
      return;
    }

    if (url.pathname === "/status") {
      if (!checkKey(url)) {
        sendJson(res, 401, {
          ok: false,
          error: "Unauthorized. Please provide correct key.",
          hint: "访问格式应该是 /status?key=你的密码"
        });
        return;
      }

      sendJson(res, 200, getMockAudiStatus());
      return;
    }

    if (url.pathname === "/probe") {
      if (!checkKey(url)) {
        sendJson(res, 401, {
          ok: false,
          error: "Unauthorized. Please provide correct key.",
          hint: "访问格式应该是 /probe?key=你的密码"
        });
        return;
      }

      const results = await probeAudiEndpoints();

      sendJson(res, 200, {
        ok: true,
        message: "Audi endpoint probe finished",
        time: new Date().toISOString(),
        results
      });
      return;
    }

    sendJson(res, 404, {
      ok: false,
      error: "Not Found",
      path: url.pathname,
      availableRoutes: ["/", "/status?key=你的密码", "/probe?key=你的密码"]
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: String(error)
    });
  }
});

server.listen(PORT, () => {
  console.log(`Audi status test server running on port ${PORT}`);
});
