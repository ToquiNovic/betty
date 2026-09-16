---
title: Guía de Conexión ESP32 (C++/Arduino)
description: Código completo y configuración para conectar placas ESP32 a Betty.
---

El ESP32 es el microcontrolador recomendado para Betty debido a su conectividad WiFi dual, aceleración criptográfica y bajo consumo.

---

## 📦 Librerías Necesarias (Arduino IDE / PlatformIO)

Instala las siguientes librerías desde el Gestor de Librerías:
- `PubSubClient` (por Nick O'Leary)
- `ArduinoJson` (v6 o v7 por Benoît Blanchon)

---

## 💻 Código Fuente de Ejemplo

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// 1. Configuración de Red WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// 2. Configuración de Betty MQTT Broker
const char* mqtt_server = "192.168.1.100"; // IP o dominio de tu servidor Betty
const int mqtt_port = 1883;

// 3. Credenciales del Sensor en Betty
const char* sensor_id = "4c40ea57-43e0-4ee2-a8d5-77aae4fc387b"; // UUID
const char* api_key = "betty_live_a1b2c3d4e5f6g7h8...";          // API Key completa

const char* mqtt_topic = "betty/sensor/4c40ea57-43e0-4ee2-a8d5-77aae4fc387b/data";

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
const long interval = 5000; // Enviar telemetría cada 5 segundos

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Conectando a ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi conectado. IP: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Conectando a Betty MQTT Broker...");
    // Conectar usando sensor_id como usuario y api_key como contraseña
    if (client.connect(sensor_id, sensor_id, api_key)) {
      Serial.println(" ¡Conectado exitosamente!");
    } else {
      Serial.print(" Falló conexión, rc=");
      Serial.print(client.state());
      Serial.println(" Reintentando en 5 segundos...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    // Simular lecturas de sensores (o leer sensores reales como DHT22 o BME280)
    float temp = 22.0 + (random(0, 100) / 10.0);
    float hum = 50.0 + (random(0, 200) / 10.0);

    // Crear JSON
    StaticJsonDocument<200> doc;
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["origin_type"] = "sensor";

    char buffer[256];
    serializeJson(doc, buffer);

    // Publicar en el topic de Betty
    Serial.print("Publicando datos: ");
    Serial.println(buffer);
    client.publish(mqtt_topic, buffer);
  }
}
```
