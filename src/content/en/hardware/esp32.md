---
title: ESP32 Hardware Guide (C++/Arduino)
description: Complete firmware template for connecting ESP32 to Betty PaaS.
---

## 💻 Sample Code

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "192.168.1.100";
const int mqtt_port = 1883;

const char* sensor_id = "4c40ea57-43e0-4ee2-a8d5-77aae4fc387b";
const char* api_key = "betty_live_...";
const char* mqtt_topic = "betty/sensor/4c40ea57-43e0-4ee2-a8d5-77aae4fc387b/data";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    while (!client.connect(sensor_id, sensor_id, api_key)) delay(5000);
  }
  client.loop();

  StaticJsonDocument<200> doc;
  doc["temperature"] = 24.5;
  doc["humidity"] = 58.0;
  doc["origin_type"] = "sensor";

  char buffer[256];
  serializeJson(doc, buffer);
  client.publish(mqtt_topic, buffer);
  delay(5000);
}
```
