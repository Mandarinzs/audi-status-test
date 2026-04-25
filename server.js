const http = require("http");

const PORT = process.env.PORT || 3000;

// 先做一个测试用密码，后面你可以改
const API_KEY = process.env.API_KEY || "test123456";

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(data, null, 2));
}

function getQuery(url) {
  const result = {};
  const questionIndex = url.indexOf("?");

  if (questionIndex === -1) {
    return result;
  }

  const queryString = url.slice(questionIndex + 1);

  for (const part of queryString.split("&")) {
    const [key, value] = part.split("=");
    if (key) {
      result[decodeURIComponent(key)] = decodeURIComponent(value || "");
    }
  }

  return result;
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

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    sendJson(res, 200, {
      ok: true,
      message: "Audi status server is alive",
      try: "/status?key=你的密码"
    });
    return;
  }

  if (req.url.startsWith("/status")) {
    const query = getQuery(req.url);

    if (query.key !== API_KEY) {
      sendJson(res, 401, {
        ok: false,
        error: "Unauthorized. Please provide correct key."
      });
      return;
    }

    sendJson(res, 200, getMockAudiStatus());
    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: "Not Found"
  });
});

server.listen(PORT, () => {
  console.log(`Audi status test server running on port ${PORT}`);
});
