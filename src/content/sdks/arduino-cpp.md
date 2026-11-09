---
title: Cliente Arduino / C++
description: Librería y clase reutilizable en C++ para microcontroladores ESP32 y ESP8266.
---

Este módulo encapsula la conexión WiFi, el cliente MQTT de Botuto y la reconexión automática en una clase limpia en C++.

---

## 💻 Clase Reutilizable `BotutoClient.h`

```cpp
#ifndef BETTY_CLIENT_H
#define BETTY_CLIENT_H

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

class BotutoClient {
private:
  WiFiClient _wifiClient;
  PubSubClient _mqttClient;
  String _sensorId;
  String _apiKey;
  String _topic;

public:
  BotutoClient(const char* brokerHost, int brokerPort, const char* sensorId, const char* apiKey) {
    _sensorId = sensorId;
    _apiKey = apiKey;
    _topic = String("botuto/sensor/") + sensorId + "/data";
    _mqttClient.setClient(_wifiClient);
    _mqttClient.setServer(brokerHost, brokerPort);
  }

  void loop() {
    if (!_mqttClient.connected()) {
      reconnect();
    }
    _mqttClient.loop();
  }

  bool send(StaticJsonDocument<256>& doc) {
    if (!doc.containsKey("origin_type")) {
      doc["origin_type"] = "sensor";
    }
    char buffer[256];
    serializeJson(doc, buffer);
    return _mqttClient.publish(_topic.c_str(), buffer);
  }

private:
  void reconnect() {
    while (!_mqttClient.connected()) {
      if (_mqttClient.connect(_sensorId.c_str(), _sensorId.c_str(), _apiKey.c_str())) {
        Serial.println("✅ [Botuto] Conectado al broker MQTT");
      } else {
        Serial.print("❌ [Botuto] Reintentando en 5s, estado=");
        Serial.println(_mqttClient.state());
        delay(5000);
      }
    }
  }
};

#endif
```
